/**
 * Funding Rate Keeper
 *
 * Calculates and submits funding rate updates every hour.
 * Funding mechanism keeps mark price anchored to index price:
 * - If longs > shorts (mark > index), longs pay shorts
 * - If shorts > longs (mark < index), shorts pay longs
 *
 * Formula: funding_rate = (mark_price - index_price) / index_price * (1/24)
 * Capped at ±0.1% per hour (±2.4% per day)
 */
import { OracleAggregator } from '../feeds/OracleAggregator';
import { ContractInteraction } from '../contracts/ContractInteraction';
import { FundingRate } from '../orderbook/types';
export declare class FundingKeeper {
    private oracle;
    private contracts;
    private markets;
    private interval;
    private running;
    private latestRates;
    private rateHistory;
    private readonly maxHistory;
    private readonly FUNDING_INTERVAL_MS;
    private readonly MAX_RATE;
    private readonly RATE_MULTIPLIER;
    private stats;
    constructor(oracle: OracleAggregator, contracts: ContractInteraction, markets: string[]);
    /**
     * Start the funding rate keeper.
     */
    start(): void;
    /**
     * Stop the keeper.
     */
    stop(): void;
    /**
     * Get current funding rate for a market.
     */
    getFundingRate(market: string): FundingRate | null;
    /**
     * Get funding rate history for a market.
     */
    getFundingHistory(market: string, limit?: number): FundingRate[];
    /**
     * Get predicted next funding rate based on current prices.
     */
    getPredictedRate(market: string): string | null;
    /**
     * Get stats.
     */
    getStats(): {
        marketsTracked: number;
        currentRates: {
            [k: string]: string;
        };
        updatesSubmitted: number;
        lastUpdateTime: number;
    };
    private updateAllRates;
}
//# sourceMappingURL=FundingKeeper.d.ts.map