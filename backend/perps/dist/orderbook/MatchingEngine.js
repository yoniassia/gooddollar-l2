"use strict";
/**
 * GoodPerps Matching Engine
 *
 * Manages multiple order books and coordinates trade settlement.
 * Handles external routing to Hyperliquid when internal liquidity is thin.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchingEngine = void 0;
const events_1 = require("events");
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const OrderBook_1 = require("./OrderBook");
const types_1 = require("./types");
const pino_1 = __importDefault(require("pino"));
const logger = (0, pino_1.default)({ name: 'matching-engine' });
class MatchingEngine extends events_1.EventEmitter {
    books = new Map();
    pendingSettlement = [];
    settlementInterval = null;
    tradeHistory = [];
    maxTradeHistory = 10000;
    // Settlement batching config
    SETTLEMENT_INTERVAL_MS = 2000; // Batch every 2 seconds
    MIN_BATCH_SIZE = 1;
    constructor() {
        super();
    }
    /**
     * Initialize a new market.
     */
    addMarket(config) {
        if (this.books.has(config.symbol)) {
            throw new Error(`Market ${config.symbol} already exists`);
        }
        const book = new OrderBook_1.OrderBook(config);
        this.books.set(config.symbol, book);
        logger.info({ market: config.symbol }, 'Market added');
    }
    /**
     * Start the settlement batching loop.
     */
    start() {
        this.settlementInterval = setInterval(() => {
            this.flushSettlement();
        }, this.SETTLEMENT_INTERVAL_MS);
        logger.info('Matching engine started');
    }
    /**
     * Stop the engine.
     */
    stop() {
        if (this.settlementInterval) {
            clearInterval(this.settlementInterval);
            this.settlementInterval = null;
        }
        // Flush remaining trades
        this.flushSettlement();
        logger.info('Matching engine stopped');
    }
    /**
     * Submit a new order.
     */
    submitOrder(params) {
        const book = this.books.get(params.market);
        if (!book)
            throw new Error(`Unknown market: ${params.market}`);
        const { order, trades } = book.placeOrder({
            userId: params.userId,
            side: params.side,
            type: params.type,
            price: params.price,
            size: params.size,
            timeInForce: params.timeInForce,
            reduceOnly: params.reduceOnly,
            clientId: params.clientId,
        });
        // Add trades to settlement queue
        if (trades.length > 0) {
            this.pendingSettlement.push(...trades);
            this.tradeHistory.push(...trades);
            // Trim history
            if (this.tradeHistory.length > this.maxTradeHistory) {
                this.tradeHistory = this.tradeHistory.slice(-this.maxTradeHistory);
            }
        }
        // Emit events
        this.emit('order', order);
        for (const trade of trades) {
            this.emit('trade', trade);
        }
        this.emit('bookUpdate', book.getL2Book());
        // Check if order needs external routing
        const remaining = new bignumber_js_1.default(order.remainingSize);
        let externalRouted = false;
        if (remaining.gt(0) && params.type === types_1.OrderType.Market) {
            // Market order with remaining size → route to external venue
            externalRouted = true;
            this.emit('routeExternal', {
                market: params.market,
                side: params.side,
                size: remaining.toString(),
                userId: params.userId,
                orderId: order.id,
            });
            logger.info({
                orderId: order.id,
                market: params.market,
                remainingSize: remaining.toString(),
            }, 'Routing remaining size to external venue');
        }
        return {
            order,
            internalTrades: trades,
            externalRouted,
            externalSize: externalRouted ? remaining.toString() : undefined,
        };
    }
    /**
     * Cancel an order.
     */
    cancelOrder(market, orderId, userId) {
        const book = this.books.get(market);
        if (!book)
            return null;
        const order = book.cancelOrder(orderId, userId);
        if (order) {
            this.emit('order', order);
            this.emit('bookUpdate', book.getL2Book());
        }
        return order;
    }
    /**
     * Get order book snapshot.
     */
    getBook(market, depth) {
        const book = this.books.get(market);
        return book?.getL2Book(depth) ?? null;
    }
    /**
     * Get BBO for a market.
     */
    getBBO(market) {
        const book = this.books.get(market);
        return book?.getBBO() ?? null;
    }
    /**
     * Get recent trades for a market.
     */
    getRecentTrades(market, limit = 50) {
        return this.tradeHistory
            .filter(t => t.market === market)
            .slice(-limit);
    }
    /**
     * Get user's open orders.
     */
    getUserOrders(userId, market) {
        if (market) {
            const book = this.books.get(market);
            return book?.getUserOrders(userId) ?? [];
        }
        const allOrders = [];
        for (const book of this.books.values()) {
            allOrders.push(...book.getUserOrders(userId));
        }
        return allOrders;
    }
    /**
     * Get all active markets.
     */
    getMarkets() {
        return Array.from(this.books.keys());
    }
    /**
     * Get market config.
     */
    getMarketConfig(market) {
        return this.books.get(market)?.config;
    }
    // --- Private ---
    flushSettlement() {
        if (this.pendingSettlement.length < this.MIN_BATCH_SIZE)
            return;
        const trades = [...this.pendingSettlement];
        this.pendingSettlement = [];
        const totalVolume = trades.reduce((sum, t) => sum.plus(new bignumber_js_1.default(t.price).times(t.size)), new bignumber_js_1.default(0));
        const totalFees = trades.reduce((sum, t) => sum.plus(new bignumber_js_1.default(t.makerFee).abs()).plus(new bignumber_js_1.default(t.takerFee)), new bignumber_js_1.default(0));
        const batch = {
            id: `batch-${Date.now()}`,
            trades,
            timestamp: Date.now(),
            totalVolume: totalVolume.toString(),
            totalFees: totalFees.toString(),
        };
        logger.info({
            batchId: batch.id,
            tradeCount: trades.length,
            volume: batch.totalVolume,
            fees: batch.totalFees,
        }, 'Settlement batch ready');
        this.emit('settlement', batch);
    }
}
exports.MatchingEngine = MatchingEngine;
//# sourceMappingURL=MatchingEngine.js.map