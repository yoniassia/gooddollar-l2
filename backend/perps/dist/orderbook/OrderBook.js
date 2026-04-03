"use strict";
/**
 * GoodPerps Order Book Engine
 *
 * In-memory Central Limit Order Book (CLOB) with price-time priority.
 * Inspired by Hyperliquid's on-chain book and dYdX's off-chain matching.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderBook = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const uuid_1 = require("uuid");
const types_1 = require("./types");
// Configure BigNumber for financial precision
bignumber_js_1.default.config({ DECIMAL_PLACES: 18, ROUNDING_MODE: bignumber_js_1.default.ROUND_DOWN });
class OrderBook {
    bids = new Map(); // price string → level
    asks = new Map();
    sortedBidPrices = []; // Descending (best bid first)
    sortedAskPrices = []; // Ascending (best ask first)
    ordersById = new Map();
    ordersByUser = new Map();
    market;
    config;
    tradeSequence = 0;
    constructor(config) {
        this.market = config.symbol;
        this.config = config;
    }
    /**
     * Place a new order. Returns the order and any resulting trades.
     */
    placeOrder(params) {
        const now = Date.now();
        const order = {
            id: (0, uuid_1.v4)(),
            clientId: params.clientId,
            market: this.market,
            side: params.side,
            type: params.type,
            price: params.price,
            size: params.size,
            filledSize: '0',
            remainingSize: params.size,
            status: types_1.OrderStatus.New,
            timeInForce: params.timeInForce ?? types_1.TimeInForce.GTC,
            reduceOnly: params.reduceOnly ?? false,
            postOnly: params.timeInForce === types_1.TimeInForce.PostOnly,
            triggerPrice: params.triggerPrice,
            userId: params.userId,
            timestamp: now,
            updatedAt: now,
        };
        // Validate order
        this.validateOrder(order);
        // For market orders, set aggressive price
        if (order.type === types_1.OrderType.Market) {
            order.price = order.side === types_1.Side.Buy ? '999999999' : '0.000001';
            order.timeInForce = types_1.TimeInForce.IOC;
        }
        // Match against opposite side
        const trades = this.matchOrder(order);
        // Handle remaining size based on TIF
        if (new bignumber_js_1.default(order.remainingSize).gt(0)) {
            switch (order.timeInForce) {
                case types_1.TimeInForce.IOC:
                case types_1.TimeInForce.FOK:
                    // Cancel remaining
                    if (order.timeInForce === types_1.TimeInForce.FOK && trades.length > 0) {
                        // FOK should have been all-or-nothing — revert trades
                        // (simplified: in production, check before matching)
                    }
                    order.status = trades.length > 0 ? types_1.OrderStatus.PartiallyFilled : types_1.OrderStatus.Canceled;
                    break;
                case types_1.TimeInForce.PostOnly:
                    if (trades.length > 0) {
                        // Post-only order would have crossed — reject
                        order.status = types_1.OrderStatus.Rejected;
                        return { order, trades: [] };
                    }
                    this.addToBook(order);
                    break;
                case types_1.TimeInForce.GTC:
                default:
                    order.status = trades.length > 0 ? types_1.OrderStatus.PartiallyFilled : types_1.OrderStatus.New;
                    this.addToBook(order);
                    break;
            }
        }
        else {
            order.status = types_1.OrderStatus.Filled;
        }
        return { order, trades };
    }
    /**
     * Cancel an order by ID.
     */
    cancelOrder(orderId, userId) {
        const order = this.ordersById.get(orderId);
        if (!order || order.userId !== userId)
            return null;
        if (order.status === types_1.OrderStatus.Filled || order.status === types_1.OrderStatus.Canceled)
            return null;
        this.removeFromBook(order);
        order.status = types_1.OrderStatus.Canceled;
        order.updatedAt = Date.now();
        return order;
    }
    /**
     * Cancel all orders for a user.
     */
    cancelAllOrders(userId) {
        const orderIds = this.ordersByUser.get(userId);
        if (!orderIds)
            return [];
        const canceled = [];
        for (const orderId of orderIds) {
            const result = this.cancelOrder(orderId, userId);
            if (result)
                canceled.push(result);
        }
        return canceled;
    }
    /**
     * Get L2 order book snapshot.
     */
    getL2Book(depth = 20) {
        const bids = [];
        const asks = [];
        for (let i = 0; i < Math.min(depth, this.sortedBidPrices.length); i++) {
            const level = this.bids.get(this.sortedBidPrices[i]);
            bids.push({
                price: level.price.toString(),
                size: level.totalSize.toString(),
                orderCount: level.orders.length,
            });
        }
        for (let i = 0; i < Math.min(depth, this.sortedAskPrices.length); i++) {
            const level = this.asks.get(this.sortedAskPrices[i]);
            asks.push({
                price: level.price.toString(),
                size: level.totalSize.toString(),
                orderCount: level.orders.length,
            });
        }
        return {
            market: this.market,
            bids,
            asks,
            timestamp: Date.now(),
        };
    }
    /**
     * Get best bid and ask.
     */
    getBBO() {
        const bestBid = this.sortedBidPrices[0] ?? null;
        const bestAsk = this.sortedAskPrices[0] ?? null;
        const spread = bestBid && bestAsk
            ? new bignumber_js_1.default(bestAsk).minus(bestBid).toString()
            : null;
        return { bestBid, bestAsk, spread };
    }
    /**
     * Get mid price.
     */
    getMidPrice() {
        const { bestBid, bestAsk } = this.getBBO();
        if (!bestBid || !bestAsk)
            return null;
        return new bignumber_js_1.default(bestBid).plus(bestAsk).div(2).toString();
    }
    /**
     * Get a user's open orders.
     */
    getUserOrders(userId) {
        const orderIds = this.ordersByUser.get(userId);
        if (!orderIds)
            return [];
        return Array.from(orderIds)
            .map(id => this.ordersById.get(id))
            .filter(o => o && (o.status === types_1.OrderStatus.New || o.status === types_1.OrderStatus.PartiallyFilled));
    }
    // --- Private Methods ---
    validateOrder(order) {
        const size = new bignumber_js_1.default(order.size);
        const price = new bignumber_js_1.default(order.price);
        if (size.lte(0))
            throw new Error('Order size must be positive');
        if (order.type === types_1.OrderType.Limit && price.lte(0))
            throw new Error('Limit price must be positive');
        if (size.lt(this.config.minOrderSize))
            throw new Error(`Min order size: ${this.config.minOrderSize}`);
        if (size.gt(this.config.maxOrderSize))
            throw new Error(`Max order size: ${this.config.maxOrderSize}`);
        // Check tick size
        const tickSize = new bignumber_js_1.default(this.config.tickSize);
        if (!price.mod(tickSize).eq(0) && order.type === types_1.OrderType.Limit) {
            throw new Error(`Price must be multiple of tick size: ${this.config.tickSize}`);
        }
        // Check lot size
        const lotSize = new bignumber_js_1.default(this.config.lotSize);
        if (!size.mod(lotSize).eq(0)) {
            throw new Error(`Size must be multiple of lot size: ${this.config.lotSize}`);
        }
    }
    matchOrder(takerOrder) {
        const trades = [];
        const isBuy = takerOrder.side === types_1.Side.Buy;
        const book = isBuy ? this.asks : this.bids;
        const sortedPrices = isBuy ? this.sortedAskPrices : this.sortedBidPrices;
        const takerRemaining = new bignumber_js_1.default(takerOrder.remainingSize);
        let filled = new bignumber_js_1.default(0);
        const pricesToRemove = [];
        for (let i = 0; i < sortedPrices.length && filled.lt(takerRemaining); i++) {
            const priceStr = sortedPrices[i];
            const level = book.get(priceStr);
            // Check if price crosses
            const takerPrice = new bignumber_js_1.default(takerOrder.price);
            if (isBuy && level.price.gt(takerPrice))
                break;
            if (!isBuy && level.price.lt(takerPrice))
                break;
            // Self-trade prevention
            const ordersToRemove = [];
            for (let j = 0; j < level.orders.length && filled.lt(takerRemaining); j++) {
                const makerOrder = level.orders[j];
                // Skip self-trades
                if (makerOrder.userId === takerOrder.userId)
                    continue;
                const makerRemaining = new bignumber_js_1.default(makerOrder.remainingSize);
                const tradeSize = bignumber_js_1.default.min(takerRemaining.minus(filled), makerRemaining);
                const tradePrice = level.price; // Maker's price (price improvement for taker)
                // Create trade
                const trade = {
                    id: `t-${++this.tradeSequence}`,
                    market: this.market,
                    price: tradePrice.toString(),
                    size: tradeSize.toString(),
                    side: takerOrder.side,
                    makerOrderId: makerOrder.id,
                    takerOrderId: takerOrder.id,
                    makerUserId: makerOrder.userId,
                    takerUserId: takerOrder.userId,
                    makerFee: tradeSize.times(tradePrice).times(this.config.makerFeeRate).toString(),
                    takerFee: tradeSize.times(tradePrice).times(this.config.takerFeeRate).toString(),
                    timestamp: Date.now(),
                };
                trades.push(trade);
                filled = filled.plus(tradeSize);
                // Update maker order
                makerOrder.filledSize = new bignumber_js_1.default(makerOrder.filledSize).plus(tradeSize).toString();
                makerOrder.remainingSize = makerRemaining.minus(tradeSize).toString();
                makerOrder.updatedAt = Date.now();
                if (new bignumber_js_1.default(makerOrder.remainingSize).eq(0)) {
                    makerOrder.status = types_1.OrderStatus.Filled;
                    ordersToRemove.push(j);
                    this.ordersById.delete(makerOrder.id);
                    const userOrders = this.ordersByUser.get(makerOrder.userId);
                    if (userOrders)
                        userOrders.delete(makerOrder.id);
                }
                else {
                    makerOrder.status = types_1.OrderStatus.PartiallyFilled;
                }
            }
            // Remove filled maker orders from level (reverse to preserve indices)
            for (let k = ordersToRemove.length - 1; k >= 0; k--) {
                level.orders.splice(ordersToRemove[k], 1);
            }
            // Recalculate level size
            level.totalSize = level.orders.reduce((sum, o) => sum.plus(o.remainingSize), new bignumber_js_1.default(0));
            if (level.orders.length === 0) {
                pricesToRemove.push(priceStr);
            }
        }
        // Clean up empty price levels
        for (const priceStr of pricesToRemove) {
            book.delete(priceStr);
            const idx = sortedPrices.indexOf(priceStr);
            if (idx >= 0)
                sortedPrices.splice(idx, 1);
        }
        // Update taker order
        takerOrder.filledSize = filled.toString();
        takerOrder.remainingSize = takerRemaining.minus(filled).toString();
        takerOrder.updatedAt = Date.now();
        return trades;
    }
    addToBook(order) {
        const isBuy = order.side === types_1.Side.Buy;
        const book = isBuy ? this.bids : this.asks;
        const sortedPrices = isBuy ? this.sortedBidPrices : this.sortedAskPrices;
        const priceStr = order.price;
        let level = book.get(priceStr);
        if (!level) {
            level = {
                price: new bignumber_js_1.default(priceStr),
                orders: [],
                totalSize: new bignumber_js_1.default(0),
            };
            book.set(priceStr, level);
            // Insert into sorted array (binary search)
            const insertIdx = this.findInsertIndex(sortedPrices, priceStr, isBuy);
            sortedPrices.splice(insertIdx, 0, priceStr);
        }
        level.orders.push(order);
        level.totalSize = level.totalSize.plus(order.remainingSize);
        // Track order
        this.ordersById.set(order.id, order);
        if (!this.ordersByUser.has(order.userId)) {
            this.ordersByUser.set(order.userId, new Set());
        }
        this.ordersByUser.get(order.userId).add(order.id);
    }
    removeFromBook(order) {
        const isBuy = order.side === types_1.Side.Buy;
        const book = isBuy ? this.bids : this.asks;
        const sortedPrices = isBuy ? this.sortedBidPrices : this.sortedAskPrices;
        const priceStr = order.price;
        const level = book.get(priceStr);
        if (!level)
            return;
        const idx = level.orders.findIndex(o => o.id === order.id);
        if (idx >= 0) {
            level.totalSize = level.totalSize.minus(order.remainingSize);
            level.orders.splice(idx, 1);
        }
        if (level.orders.length === 0) {
            book.delete(priceStr);
            const priceIdx = sortedPrices.indexOf(priceStr);
            if (priceIdx >= 0)
                sortedPrices.splice(priceIdx, 1);
        }
        this.ordersById.delete(order.id);
        const userOrders = this.ordersByUser.get(order.userId);
        if (userOrders)
            userOrders.delete(order.id);
    }
    findInsertIndex(arr, price, descending) {
        const val = new bignumber_js_1.default(price);
        let lo = 0, hi = arr.length;
        while (lo < hi) {
            const mid = (lo + hi) >>> 1;
            const cmp = new bignumber_js_1.default(arr[mid]);
            if (descending ? cmp.gt(val) : cmp.lt(val)) {
                lo = mid + 1;
            }
            else {
                hi = mid;
            }
        }
        return lo;
    }
    /**
     * Get total number of open orders.
     */
    get totalOrders() {
        return this.ordersById.size;
    }
}
exports.OrderBook = OrderBook;
//# sourceMappingURL=OrderBook.js.map