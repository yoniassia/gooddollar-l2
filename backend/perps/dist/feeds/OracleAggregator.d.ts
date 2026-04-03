/**
 * Oracle Aggregator
 *
 * Combines prices from multiple sources (Pyth, Hyperliquid, Chainlink)
 * to produce a reliable mark price and index price for each market.
 *
 * Mark Price = median(Pyth, Hyperliquid mid, Chainlink)
 * Index Price = Pyth (primary), Chainlink (fallback)
 * Funding Rate = (Mark - Index) / Index * (1/24)
 */
import { EventEmitter } from 'events';
import { HyperliquidFeed } from './HyperliquidFeed';
import { PythFeed } from './PythFeed';
export interface OraclePrice {
    market: string;
    markPrice: string;
    indexPrice: string;
    fundingRate: string;
    sources: {
        pyth?: string;
        hyperliquid?: string;
        chainlink?: string;
    };
    timestamp: number;
    stale: boolean;
}
export declare class OracleAggregator extends EventEmitter {
    private hlFeed;
    private pythFeed;
    private markets;
    private latestPrices;
    private updateInterval;
    private pythPrices;
    private hlPrices;
    private chainlinkPrices;
    constructor(hlFeed: HyperliquidFeed, pythFeed: PythFeed);
    /**
     * Start the oracle aggregator for given markets.
     */
    start(markets: string[]): Promise<void>;
    /**
     * Stop the oracle.
     */
    stop(): void;
    /**
     * Get oracle price for a market.
     */
    getPrice(market: string): OraclePrice | null;
    /**
     * Get mark price for a market.
     */
    getMarkPrice(market: string): string | null;
    /**
     * Get index price for a market.
     */
    getIndexPrice(market: string): string | null;
    /**
     * Set Chainlink price (called by contract reader).
     */
    setChainlinkPrice(market: string, price: string): void;
    private updateAllPrices;
    private median;
}
//# sourceMappingURL=OracleAggregator.d.ts.map