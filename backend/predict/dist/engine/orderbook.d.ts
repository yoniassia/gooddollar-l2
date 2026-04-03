import type { Order, OrderBookSnapshot, OutcomeToken, Side, Trade } from '../types/index.js';
export interface MatchResult {
    trades: Trade[];
    remainingOrder: Order | null;
}
export type TradeCallback = (trade: Trade) => void;
export type OrderUpdateCallback = (order: Order) => void;
export declare class OrderBookEngine {
    private books;
    private orders;
    private onTrade?;
    private onOrderUpdate?;
    constructor(opts?: {
        onTrade?: TradeCallback;
        onOrderUpdate?: OrderUpdateCallback;
    });
    /** Initialize order books for a market */
    initMarket(marketId: string): void;
    /** Place a new order into the book */
    placeOrder(params: {
        marketId: string;
        token: OutcomeToken;
        side: Side;
        price: number;
        size: number;
        maker: string;
        type?: 'GTC' | 'FOK' | 'FAK';
        expiration?: number;
    }): MatchResult;
    /** Cancel an order by ID */
    cancelOrder(orderId: string): Order | undefined;
    /** Get order book snapshot for a market token */
    getOrderBook(marketId: string, token: OutcomeToken): OrderBookSnapshot | undefined;
    /** Get midpoint price */
    getMidpoint(marketId: string, token: OutcomeToken): number | undefined;
    /** Get an order by ID */
    getOrder(orderId: string): Order | undefined;
    /** Get all open orders for a maker */
    getOrdersByMaker(maker: string): Order[];
    private matchOrder;
    private addToBook;
}
//# sourceMappingURL=orderbook.d.ts.map