/**
 * Pyth Network Price Feed Integration
 *
 * Connects to Pyth's Hermes price service for sub-second price updates.
 * Primary oracle source for mark price and index price calculation.
 *
 * Pyth Price Feed IDs (mainnet):
 * - BTC/USD: 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43
 * - ETH/USD: 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace
 * - SOL/USD: 0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d
 */
import { EventEmitter } from 'events';
export interface PythPrice {
    feedId: string;
    price: string;
    confidence: string;
    expo: number;
    publishTime: number;
    emaPrice: string;
    emaConfidence: string;
}
export declare const PYTH_FEED_IDS: Record<string, string>;
export declare class PythFeed extends EventEmitter {
    private ws;
    private latestPrices;
    private feedIdToMarket;
    private isConnected;
    private reconnectDelay;
    constructor();
    /**
     * Connect and subscribe to price feeds for given markets.
     */
    connect(markets: string[]): Promise<void>;
    /**
     * Get latest price for a market.
     */
    getPrice(market: string): PythPrice | null;
    /**
     * Get formatted price (adjusted for exponent).
     */
    getFormattedPrice(market: string): string | null;
    /**
     * Fetch latest prices via REST (one-shot).
     */
    fetchPrices(markets: string[]): Promise<Map<string, string>>;
    /**
     * Disconnect.
     */
    disconnect(): void;
    private doConnect;
    private handleMessage;
}
//# sourceMappingURL=PythFeed.d.ts.map