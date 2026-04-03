/**
 * GoodPerps Order Book Engine
 *
 * In-memory Central Limit Order Book (CLOB) with price-time priority.
 * Inspired by Hyperliquid's on-chain book and dYdX's off-chain matching.
 */
import { Order, Trade, Side, OrderType, TimeInForce, L2Book, MarketConfig } from './types';
export declare class OrderBook {
    private bids;
    private asks;
    private sortedBidPrices;
    private sortedAskPrices;
    private ordersById;
    private ordersByUser;
    readonly market: string;
    readonly config: MarketConfig;
    private tradeSequence;
    constructor(config: MarketConfig);
    /**
     * Place a new order. Returns the order and any resulting trades.
     */
    placeOrder(params: {
        userId: string;
        side: Side;
        type: OrderType;
        price: string;
        size: string;
        timeInForce?: TimeInForce;
        reduceOnly?: boolean;
        clientId?: string;
        triggerPrice?: string;
    }): {
        order: Order;
        trades: Trade[];
    };
    /**
     * Cancel an order by ID.
     */
    cancelOrder(orderId: string, userId: string): Order | null;
    /**
     * Cancel all orders for a user.
     */
    cancelAllOrders(userId: string): Order[];
    /**
     * Get L2 order book snapshot.
     */
    getL2Book(depth?: number): L2Book;
    /**
     * Get best bid and ask.
     */
    getBBO(): {
        bestBid: string | null;
        bestAsk: string | null;
        spread: string | null;
    };
    /**
     * Get mid price.
     */
    getMidPrice(): string | null;
    /**
     * Get a user's open orders.
     */
    getUserOrders(userId: string): Order[];
    private validateOrder;
    private matchOrder;
    private addToBook;
    private removeFromBook;
    private findInsertIndex;
    /**
     * Get total number of open orders.
     */
    get totalOrders(): number;
}
//# sourceMappingURL=OrderBook.d.ts.map