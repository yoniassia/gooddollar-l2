/**
 * GoodPerps Order Book Types
 */
export declare enum Side {
    Buy = "buy",
    Sell = "sell"
}
export declare enum OrderType {
    Limit = "limit",
    Market = "market",
    StopLoss = "stop_loss",
    TakeProfit = "take_profit"
}
export declare enum TimeInForce {
    GTC = "gtc",// Good til canceled
    IOC = "ioc",// Immediate or cancel
    FOK = "fok",// Fill or kill
    PostOnly = "post_only"
}
export declare enum OrderStatus {
    New = "new",
    PartiallyFilled = "partially_filled",
    Filled = "filled",
    Canceled = "canceled",
    Rejected = "rejected",
    Expired = "expired"
}
export declare enum MarginMode {
    Cross = "cross",
    Isolated = "isolated"
}
export interface Order {
    id: string;
    clientId?: string;
    market: string;
    side: Side;
    type: OrderType;
    price: string;
    size: string;
    filledSize: string;
    remainingSize: string;
    status: OrderStatus;
    timeInForce: TimeInForce;
    reduceOnly: boolean;
    postOnly: boolean;
    triggerPrice?: string;
    userId: string;
    timestamp: number;
    updatedAt: number;
}
export interface Trade {
    id: string;
    market: string;
    price: string;
    size: string;
    side: Side;
    makerOrderId: string;
    takerOrderId: string;
    makerUserId: string;
    takerUserId: string;
    makerFee: string;
    takerFee: string;
    timestamp: number;
}
export interface L2Level {
    price: string;
    size: string;
    orderCount: number;
}
export interface L2Book {
    market: string;
    bids: L2Level[];
    asks: L2Level[];
    timestamp: number;
}
export interface Position {
    userId: string;
    market: string;
    side: Side;
    size: string;
    entryPrice: string;
    markPrice: string;
    liquidationPrice: string;
    margin: string;
    unrealizedPnl: string;
    realizedPnl: string;
    leverage: number;
    marginMode: MarginMode;
    timestamp: number;
}
export interface MarketConfig {
    symbol: string;
    baseAsset: string;
    quoteAsset: string;
    tickSize: string;
    lotSize: string;
    minOrderSize: string;
    maxOrderSize: string;
    maxLeverage: number;
    maintenanceMarginRate: string;
    initialMarginRate: string;
    makerFeeRate: string;
    takerFeeRate: string;
    fundingInterval: number;
}
export interface PriceUpdate {
    market: string;
    price: string;
    source: 'hyperliquid' | 'pyth' | 'chainlink' | 'internal';
    timestamp: number;
}
export interface FundingRate {
    market: string;
    rate: string;
    markPrice: string;
    indexPrice: string;
    nextFundingTime: number;
    timestamp: number;
}
//# sourceMappingURL=types.d.ts.map