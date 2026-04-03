export type Side = 'BUY' | 'SELL';
export type OutcomeToken = 'YES' | 'NO';
export type OrderType = 'GTC' | 'GTD' | 'FOK' | 'FAK';
export type OrderStatus = 'OPEN' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED';
export type TradeStatus = 'MATCHED' | 'SUBMITTED' | 'CONFIRMED' | 'FAILED';
export type MarketStatus = 'OPEN' | 'CLOSED' | 'RESOLVED_YES' | 'RESOLVED_NO' | 'VOIDED';
export interface Market {
    id: string;
    onChainId: number;
    question: string;
    category: string;
    endTime: number;
    status: MarketStatus;
    resolver: string;
    totalYES: bigint;
    totalNO: bigint;
    collateral: bigint;
    tickSize: number;
    polymarketTokenId?: string;
    createdAt: number;
}
export interface Order {
    id: string;
    marketId: string;
    token: OutcomeToken;
    side: Side;
    price: number;
    size: number;
    filledSize: number;
    status: OrderStatus;
    type: OrderType;
    maker: string;
    expiration?: number;
    createdAt: number;
    updatedAt: number;
}
export interface Trade {
    id: string;
    marketId: string;
    token: OutcomeToken;
    makerOrderId: string;
    takerOrderId: string;
    price: number;
    size: number;
    maker: string;
    taker: string;
    status: TradeStatus;
    txHash?: string;
    createdAt: number;
}
export interface OrderBookLevel {
    price: number;
    size: number;
    orders: number;
}
export interface OrderBookSnapshot {
    marketId: string;
    token: OutcomeToken;
    bids: OrderBookLevel[];
    asks: OrderBookLevel[];
    midpoint: number;
    spread: number;
    timestamp: number;
}
export interface PriceFeed {
    marketId: string;
    source: 'polymarket' | 'goodpredict';
    yesMidpoint: number;
    noMidpoint: number;
    yesSpread: number;
    noSpread: number;
    updatedAt: number;
}
export type WSMessageType = 'subscribe' | 'unsubscribe' | 'orderbook_snapshot' | 'orderbook_update' | 'trade' | 'order_update' | 'price_update' | 'market_update';
export interface WSMessage {
    type: WSMessageType;
    channel?: string;
    data: unknown;
}
export interface WSSubscription {
    type: 'subscribe' | 'unsubscribe';
    channels: string[];
}
//# sourceMappingURL=index.d.ts.map