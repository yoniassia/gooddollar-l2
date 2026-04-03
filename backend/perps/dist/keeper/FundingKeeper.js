"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FundingKeeper = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const pino_1 = __importDefault(require("pino"));
const logger = (0, pino_1.default)({ name: 'funding-keeper' });
class FundingKeeper {
    oracle;
    contracts;
    markets;
    interval = null;
    running = false;
    latestRates = new Map();
    rateHistory = new Map();
    maxHistory = 168; // 7 days of hourly rates
    // Config
    FUNDING_INTERVAL_MS = 3600_000; // 1 hour
    MAX_RATE = new bignumber_js_1.default('0.001'); // 0.1% per hour
    RATE_MULTIPLIER = new bignumber_js_1.default(1).div(24); // 1/24 per hour
    stats = {
        updatesSubmitted: 0,
        lastUpdateTime: 0,
    };
    constructor(oracle, contracts, markets) {
        this.oracle = oracle;
        this.contracts = contracts;
        this.markets = markets;
    }
    /**
     * Start the funding rate keeper.
     */
    start() {
        if (this.running)
            return;
        this.running = true;
        // Calculate initial rates immediately
        this.updateAllRates().catch(err => {
            logger.error({ err }, 'Initial funding rate update failed');
        });
        // Then update every hour
        this.interval = setInterval(() => {
            this.updateAllRates().catch(err => {
                logger.error({ err }, 'Funding rate update failed');
            });
        }, this.FUNDING_INTERVAL_MS);
        logger.info({ markets: this.markets }, 'Funding keeper started');
    }
    /**
     * Stop the keeper.
     */
    stop() {
        this.running = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        logger.info({ stats: this.stats }, 'Funding keeper stopped');
    }
    /**
     * Get current funding rate for a market.
     */
    getFundingRate(market) {
        return this.latestRates.get(market) ?? null;
    }
    /**
     * Get funding rate history for a market.
     */
    getFundingHistory(market, limit = 24) {
        const history = this.rateHistory.get(market) ?? [];
        return history.slice(-limit);
    }
    /**
     * Get predicted next funding rate based on current prices.
     */
    getPredictedRate(market) {
        const oraclePrice = this.oracle.getPrice(market);
        if (!oraclePrice)
            return null;
        return oraclePrice.fundingRate;
    }
    /**
     * Get stats.
     */
    getStats() {
        return {
            ...this.stats,
            marketsTracked: this.markets.length,
            currentRates: Object.fromEntries(this.markets.map(m => [m, this.latestRates.get(m)?.rate ?? 'N/A'])),
        };
    }
    // --- Private ---
    async updateAllRates() {
        const now = Date.now();
        const nextFunding = now + this.FUNDING_INTERVAL_MS;
        for (const market of this.markets) {
            try {
                const oraclePrice = this.oracle.getPrice(market);
                if (!oraclePrice || oraclePrice.stale) {
                    logger.warn({ market }, 'Skipping funding update — stale oracle');
                    continue;
                }
                const markPrice = new bignumber_js_1.default(oraclePrice.markPrice);
                const indexPrice = new bignumber_js_1.default(oraclePrice.indexPrice);
                if (indexPrice.eq(0)) {
                    logger.warn({ market }, 'Skipping funding update — zero index price');
                    continue;
                }
                // Calculate funding rate
                let rate = markPrice.minus(indexPrice)
                    .div(indexPrice)
                    .times(this.RATE_MULTIPLIER);
                // Cap at max rate
                if (rate.abs().gt(this.MAX_RATE)) {
                    rate = rate.gt(0) ? this.MAX_RATE : this.MAX_RATE.negated();
                }
                const fundingRate = {
                    market,
                    rate: rate.toString(),
                    markPrice: markPrice.toString(),
                    indexPrice: indexPrice.toString(),
                    nextFundingTime: nextFunding,
                    timestamp: now,
                };
                // Store
                this.latestRates.set(market, fundingRate);
                if (!this.rateHistory.has(market)) {
                    this.rateHistory.set(market, []);
                }
                const history = this.rateHistory.get(market);
                history.push(fundingRate);
                if (history.length > this.maxHistory) {
                    history.splice(0, history.length - this.maxHistory);
                }
                // Submit to chain
                await this.contracts.updateFundingRate(market, rate.toString(), markPrice.toString(), indexPrice.toString());
                this.stats.updatesSubmitted++;
                this.stats.lastUpdateTime = now;
                logger.info({
                    market,
                    rate: rate.toString(),
                    markPrice: markPrice.toString(),
                    indexPrice: indexPrice.toString(),
                    premium: markPrice.minus(indexPrice).div(indexPrice).times(100).toFixed(4) + '%',
                }, 'Funding rate updated');
            }
            catch (err) {
                logger.error({ err, market }, 'Failed to update funding rate');
            }
        }
    }
}
exports.FundingKeeper = FundingKeeper;
//# sourceMappingURL=FundingKeeper.js.map