/**
 * Hyperliquid Price Feed Integration
 *
 * Connects to Hyperliquid's WebSocket API to stream real-time prices,
 * order book data, and trades. Used for:
 * 1. Oracle price feed (mark price calculation)
 * 2. External liquidity assessment (for smart order routing)
 * 3. Trade routing (execute on Hyperliquid when internal liquidity thin)
 */
import { EventEmitter } from 'events';
export interface HyperliquidMids {
    [coin: string]: string;
}
export interface HyperliquidL2Level {
    px: string;
    sz: string;
    n: number;
}
export interface HyperliquidBook {
    coin: string;
    levels: [HyperliquidL2Level[], HyperliquidL2Level[]];
    time: number;
}
export interface HyperliquidTrade {
    coin: string;
    side: string;
    px: string;
    sz: string;
    time: number;
    tid: number;
}
export interface HyperliquidAssetCtx {
    coin: string;
    funding: number;
    openInterest: number;
    oraclePx: number;
    markPx: number;
    midPx?: number;
    dayNtlVlm: number;
    prevDayPx: number;
}
export declare class HyperliquidFeed extends EventEmitter {
    private ws;
    private wsUrl;
    private restUrl;
    private reconnectDelay;
    private maxReconnectDelay;
    private isConnected;
    private subscribedCoins;
    private latestMids;
    private latestBooks;
    private pingInterval;
    constructor(options?: {
        testnet?: boolean;
    });
    /**
     * Connect to Hyperliquid WebSocket and subscribe to feeds.
     */
    connect(coins: string[]): Promise<void>;
    /**
     * Get latest mid price for a coin.
     */
    getMidPrice(coin: string): string | null;
    /**
     * Get all latest mid prices.
     */
    getAllMids(): HyperliquidMids;
    /**
     * Get latest L2 book for a coin.
     */
    getBook(coin: string): HyperliquidBook | null;
    /**
     * Fetch all mid prices via REST (one-shot).
     */
    fetchMids(): Promise<HyperliquidMids>;
    /**
     * Fetch L2 book via REST (one-shot).
     */
    fetchL2Book(coin: string): Promise<HyperliquidBook>;
    /**
     * Fetch asset metadata and live context.
     */
    fetchMetaAndCtx(): Promise<any>;
    /**
     * Fetch candle data.
     */
    fetchCandles(coin: string, interval: string, startTime: number, endTime?: number): Promise<any[]>;
    /**
     * Disconnect.
     */
    disconnect(): void;
    private doConnect;
    private handleMessage;
    private send;
    private scheduleReconnect;
}
//# sourceMappingURL=HyperliquidFeed.d.ts.map