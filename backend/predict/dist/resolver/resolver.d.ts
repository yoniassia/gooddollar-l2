import type { Market, MarketStatus } from '../types/index.js';
interface CreateMarketParams {
    question: string;
    category: string;
    endTime: number;
    resolver?: string;
}
export declare class MarketResolverService {
    private markets;
    private adminAddress;
    private nextOnChainId;
    constructor(adminAddress: string);
    /** Create a new market */
    createMarket(params: CreateMarketParams): Market;
    /** Get a market by ID */
    getMarket(id: string): Market | undefined;
    /** Get all markets */
    getAllMarkets(): Market[];
    /** Get markets by status */
    getMarketsByStatus(status: MarketStatus): Market[];
    /** Close a market (after end time, before resolution) */
    closeMarket(id: string): Market;
    /** Resolve a market as YES or NO */
    resolveMarket(id: string, yesWon: boolean): Market;
    /** Void a market (refund all participants) */
    voidMarket(id: string): Market;
    /** Check and auto-close expired markets */
    checkExpiredMarkets(): Market[];
}
export {};
//# sourceMappingURL=resolver.d.ts.map