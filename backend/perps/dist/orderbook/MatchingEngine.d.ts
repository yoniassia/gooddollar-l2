/**
 * GoodPerps Matching Engine
 *
 * Manages multiple order books and coordinates trade settlement.
 * Handles external routing to Hyperliquid when internal liquidity is thin.
 */
import { EventEmitter } from 'events';
import { Order, Trade, Side, OrderType, TimeInForce, MarketConfig, L2Book } from './types';
export interface MatchResult {
    order: Order;
    internalTrades: Trade[];
    externalRouted: boolean;
    externalSize?: string;
}
export interface SettlementBatch {
    id: string;
    trades: Trade[];
    timestamp: number;
    totalVolume: string;
    totalFees: string;
}
export declare class MatchingEngine extends EventEmitter {
    private books;
    private pendingSettlement;
    private settlementInterval;
    private tradeHistory;
    private readonly maxTradeHistory;
    private readonly SETTLEMENT_INTERVAL_MS;
    private readonly MIN_BATCH_SIZE;
    constructor();
    /**
     * Initialize a new market.
     */
    addMarket(config: MarketConfig): void;
    /**
     * Start the settlement batching loop.
     */
    start(): void;
    /**
     * Stop the engine.
     */
    stop(): void;
    /**
     * Submit a new order.
     */
    submitOrder(params: {
        userId: string;
        market: string;
        side: Side;
        type: OrderType;
        price: string;
        size: string;
        timeInForce?: TimeInForce;
        reduceOnly?: boolean;
        clientId?: string;
    }): MatchResult;
    /**
     * Cancel an order.
     */
    cancelOrder(market: string, orderId: string, userId: string): Order | null;
    /**
     * Get order book snapshot.
     */
    getBook(market: string, depth?: number): L2Book | null;
    /**
     * Get BBO for a market.
     */
    getBBO(market: string): {
        bestBid: string | null;
        bestAsk: string | null;
        spread: string | null;
    } | null;
    /**
     * Get recent trades for a market.
     */
    getRecentTrades(market: string, limit?: number): Trade[];
    /**
     * Get user's open orders.
     */
    getUserOrders(userId: string, market?: string): Order[];
    /**
     * Get all active markets.
     */
    getMarkets(): string[];
    /**
     * Get market config.
     */
    getMarketConfig(market: string): MarketConfig | undefined;
    private flushSettlement;
}
//# sourceMappingURL=MatchingEngine.d.ts.map