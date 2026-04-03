import type { PriceFeed } from '../types/index.js';
interface PolymarketMarket {
    id: string;
    condition_id: string;
    question: string;
    tokens: Array<{
        token_id: string;
        outcome: string;
        price: number;
    }>;
    active: boolean;
    closed: boolean;
    volume: string;
    liquidity: string;
}
export declare class PolymarketFeed {
    private feeds;
    private linkedMarkets;
    private pollInterval;
    private pollIntervalMs;
    constructor(pollIntervalMs?: number);
    /** Link a GoodPredict market to a Polymarket token pair */
    linkMarket(marketId: string, yesTokenId: string, noTokenId: string): void;
    /** Unlink a market */
    unlinkMarket(marketId: string): void;
    /** Start polling */
    start(): void;
    /** Stop polling */
    stop(): void;
    /** Get latest feed for a market */
    getFeed(marketId: string): PriceFeed | undefined;
    /** Get all feeds */
    getAllFeeds(): PriceFeed[];
    /** Search Polymarket for a question and return matching markets */
    searchMarkets(query: string): Promise<PolymarketMarket[]>;
    private pollAll;
    private pollMarket;
    private fetchMidpoint;
    private fetchBook;
    private calcSpread;
}
export {};
//# sourceMappingURL=polymarket.d.ts.map