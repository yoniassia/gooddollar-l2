"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OracleAggregator = void 0;
const events_1 = require("events");
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const pino_1 = __importDefault(require("pino"));
const logger = (0, pino_1.default)({ name: 'oracle-aggregator' });
// Market → coin mapping for Hyperliquid
const MARKET_TO_HL_COIN = {
    'BTC-USD': 'BTC',
    'ETH-USD': 'ETH',
    'SOL-USD': 'SOL',
    'DOGE-USD': 'DOGE',
    'AVAX-USD': 'AVAX',
    'ARB-USD': 'ARB',
    'OP-USD': 'OP',
    'LINK-USD': 'LINK',
};
const MAX_STALENESS_MS = 60_000; // 60 seconds
class OracleAggregator extends events_1.EventEmitter {
    hlFeed;
    pythFeed;
    markets = [];
    latestPrices = new Map();
    updateInterval = null;
    // Per-source prices with timestamps
    pythPrices = new Map();
    hlPrices = new Map();
    chainlinkPrices = new Map();
    constructor(hlFeed, pythFeed) {
        super();
        this.hlFeed = hlFeed;
        this.pythFeed = pythFeed;
        // Listen to price updates
        this.hlFeed.on('mids', (mids) => {
            const now = Date.now();
            for (const [coin, price] of Object.entries(mids)) {
                // Find market for this coin
                for (const [market, hlCoin] of Object.entries(MARKET_TO_HL_COIN)) {
                    if (hlCoin === coin) {
                        this.hlPrices.set(market, { price, ts: now });
                    }
                }
            }
        });
        this.pythFeed.on('price', (update) => {
            this.pythPrices.set(update.market, { price: update.price, ts: update.timestamp });
        });
    }
    /**
     * Start the oracle aggregator for given markets.
     */
    async start(markets) {
        this.markets = markets;
        // Connect feeds
        const hlCoins = markets.map(m => MARKET_TO_HL_COIN[m]).filter(Boolean);
        await Promise.all([
            this.hlFeed.connect(hlCoins),
            this.pythFeed.connect(markets),
        ]);
        // Update aggregated prices every 500ms
        this.updateInterval = setInterval(() => {
            this.updateAllPrices();
        }, 500);
        logger.info({ markets }, 'Oracle aggregator started');
    }
    /**
     * Stop the oracle.
     */
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        this.hlFeed.disconnect();
        this.pythFeed.disconnect();
    }
    /**
     * Get oracle price for a market.
     */
    getPrice(market) {
        return this.latestPrices.get(market) ?? null;
    }
    /**
     * Get mark price for a market.
     */
    getMarkPrice(market) {
        return this.latestPrices.get(market)?.markPrice ?? null;
    }
    /**
     * Get index price for a market.
     */
    getIndexPrice(market) {
        return this.latestPrices.get(market)?.indexPrice ?? null;
    }
    /**
     * Set Chainlink price (called by contract reader).
     */
    setChainlinkPrice(market, price) {
        this.chainlinkPrices.set(market, { price, ts: Date.now() });
    }
    // --- Private ---
    updateAllPrices() {
        const now = Date.now();
        for (const market of this.markets) {
            const sources = {};
            const validPrices = [];
            let stale = false;
            // Pyth
            const pyth = this.pythPrices.get(market);
            if (pyth && (now - pyth.ts) < MAX_STALENESS_MS) {
                sources.pyth = pyth.price;
                validPrices.push(new bignumber_js_1.default(pyth.price));
            }
            // Hyperliquid
            const hl = this.hlPrices.get(market);
            if (hl && (now - hl.ts) < MAX_STALENESS_MS) {
                sources.hyperliquid = hl.price;
                validPrices.push(new bignumber_js_1.default(hl.price));
            }
            // Chainlink
            const cl = this.chainlinkPrices.get(market);
            if (cl && (now - cl.ts) < MAX_STALENESS_MS) {
                sources.chainlink = cl.price;
                validPrices.push(new bignumber_js_1.default(cl.price));
            }
            if (validPrices.length === 0) {
                stale = true;
                // Use last known price if available
                const existing = this.latestPrices.get(market);
                if (existing) {
                    existing.stale = true;
                    this.latestPrices.set(market, existing);
                }
                continue;
            }
            // Mark price = median of available sources
            const markPrice = this.median(validPrices);
            // Index price = Pyth (primary) or first available
            const indexPrice = pyth
                ? new bignumber_js_1.default(pyth.price)
                : validPrices[0];
            // Funding rate = (mark - index) / index * (1/24)
            // Capped at ±0.1% per hour
            let fundingRate = markPrice.minus(indexPrice).div(indexPrice).div(24);
            const maxRate = new bignumber_js_1.default('0.001'); // 0.1%
            if (fundingRate.abs().gt(maxRate)) {
                fundingRate = fundingRate.gt(0) ? maxRate : maxRate.negated();
            }
            const oraclePrice = {
                market,
                markPrice: markPrice.toString(),
                indexPrice: indexPrice.toString(),
                fundingRate: fundingRate.toString(),
                sources,
                timestamp: now,
                stale,
            };
            this.latestPrices.set(market, oraclePrice);
            this.emit('price', oraclePrice);
        }
    }
    median(values) {
        if (values.length === 0)
            throw new Error('No values for median');
        if (values.length === 1)
            return values[0];
        const sorted = [...values].sort((a, b) => a.comparedTo(b) ?? 0);
        const mid = Math.floor(sorted.length / 2);
        if (sorted.length % 2 === 0) {
            return sorted[mid - 1].plus(sorted[mid]).div(2);
        }
        return sorted[mid];
    }
}
exports.OracleAggregator = OracleAggregator;
//# sourceMappingURL=OracleAggregator.js.map