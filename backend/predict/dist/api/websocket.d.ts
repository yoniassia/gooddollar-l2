import type { Server } from 'http';
import type { Trade, Order, OrderBookSnapshot, PriceFeed } from '../types/index.js';
export declare class PredictWebSocketServer {
    private wss;
    private clients;
    private pingInterval;
    constructor(server: Server);
    /** Broadcast an orderbook snapshot to subscribers */
    broadcastOrderBook(snapshot: OrderBookSnapshot): void;
    /** Broadcast a trade to subscribers */
    broadcastTrade(trade: Trade): void;
    /** Broadcast an order update to the specific user */
    broadcastOrderUpdate(order: Order): void;
    /** Broadcast a price update */
    broadcastPriceUpdate(feed: PriceFeed): void;
    /** Broadcast a market status update */
    broadcastMarketUpdate(marketId: string, data: Record<string, unknown>): void;
    /** Get connection stats */
    getStats(): {
        connections: number;
        subscriptions: Map<string, number>;
    };
    close(): void;
    private handleSubscription;
    private broadcast;
}
//# sourceMappingURL=websocket.d.ts.map