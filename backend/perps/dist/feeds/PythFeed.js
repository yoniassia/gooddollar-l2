"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PythFeed = exports.PYTH_FEED_IDS = void 0;
const events_1 = require("events");
const pino_1 = __importDefault(require("pino"));
const logger = (0, pino_1.default)({ name: 'pyth-feed' });
// Well-known Pyth price feed IDs
exports.PYTH_FEED_IDS = {
    'BTC-USD': '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
    'ETH-USD': '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
    'SOL-USD': '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
    'DOGE-USD': '0xdcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a0299b0150c672d25c',
    'AVAX-USD': '0x93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1571f5e9bf957',
    'MATIC-USD': '0x5de33440f6c8a81b1a34e6c3dc3a1a4bf96205e0afb2a0ebde6e07e7db4c2b16',
    'ARB-USD': '0x3fa4252848f9f0a1480be62745a4629d9eb1322aebab8a791e344b3b9c1adcf5',
    'OP-USD': '0x385f64d993f7b77d8182ed5003d97c60aa3361f3cecfe711544d2d59165e9bdf',
    'LINK-USD': '0x8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221',
    'UNI-USD': '0x78d185a741d07edb3412b09008b7c5cfb9bbbd7d568bf00ba737b456ba171501',
};
const HERMES_WS_URL = 'wss://hermes.pyth.network/ws';
const HERMES_REST_URL = 'https://hermes.pyth.network';
class PythFeed extends events_1.EventEmitter {
    ws = null;
    latestPrices = new Map();
    feedIdToMarket = new Map();
    isConnected = false;
    reconnectDelay = 1000;
    constructor() {
        super();
        // Build reverse mapping
        for (const [market, feedId] of Object.entries(exports.PYTH_FEED_IDS)) {
            this.feedIdToMarket.set(feedId, market);
        }
    }
    /**
     * Connect and subscribe to price feeds for given markets.
     */
    async connect(markets) {
        const feedIds = markets
            .map(m => exports.PYTH_FEED_IDS[m])
            .filter(Boolean);
        if (feedIds.length === 0) {
            logger.warn('No valid Pyth feed IDs for requested markets');
            return;
        }
        return this.doConnect(feedIds);
    }
    /**
     * Get latest price for a market.
     */
    getPrice(market) {
        const feedId = exports.PYTH_FEED_IDS[market];
        if (!feedId)
            return null;
        return this.latestPrices.get(feedId) ?? null;
    }
    /**
     * Get formatted price (adjusted for exponent).
     */
    getFormattedPrice(market) {
        const pythPrice = this.getPrice(market);
        if (!pythPrice)
            return null;
        const price = Number(pythPrice.price) * Math.pow(10, pythPrice.expo);
        return price.toString();
    }
    /**
     * Fetch latest prices via REST (one-shot).
     */
    async fetchPrices(markets) {
        const feedIds = markets.map(m => exports.PYTH_FEED_IDS[m]).filter(Boolean);
        const idsParam = feedIds.map(id => `ids[]=${id}`).join('&');
        const url = `${HERMES_REST_URL}/v2/updates/price/latest?${idsParam}`;
        const response = await fetch(url);
        const data = await response.json();
        const result = new Map();
        if (data.parsed) {
            for (const item of data.parsed) {
                const feedId = '0x' + item.id;
                const market = this.feedIdToMarket.get(feedId);
                if (market) {
                    const price = Number(item.price.price) * Math.pow(10, item.price.expo);
                    result.set(market, price.toString());
                }
            }
        }
        return result;
    }
    /**
     * Disconnect.
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
    }
    // --- Private ---
    doConnect(feedIds) {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(HERMES_WS_URL);
            this.ws.addEventListener('open', () => {
                logger.info('Connected to Pyth Hermes WebSocket');
                this.isConnected = true;
                this.reconnectDelay = 1000;
                // Subscribe to price feeds
                const subMsg = {
                    type: 'subscribe',
                    ids: feedIds,
                    verbose: true,
                    binary: false,
                };
                this.ws.send(JSON.stringify(subMsg));
                resolve();
            });
            this.ws.addEventListener('message', (event) => {
                try {
                    const msg = JSON.parse(typeof event.data === 'string' ? event.data : event.data.toString());
                    this.handleMessage(msg);
                }
                catch (err) {
                    logger.error({ err }, 'Failed to parse Pyth message');
                }
            });
            this.ws.addEventListener('close', () => {
                logger.warn('Pyth WebSocket disconnected');
                this.isConnected = false;
                setTimeout(() => {
                    this.doConnect(feedIds).catch(() => {
                        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
                    });
                }, this.reconnectDelay);
            });
            this.ws.addEventListener('error', (err) => {
                logger.error({ err }, 'Pyth WebSocket error');
                if (!this.isConnected)
                    reject(err);
            });
        });
    }
    handleMessage(msg) {
        if (msg.type === 'price_update' && msg.price_feed) {
            const feed = msg.price_feed;
            const feedId = '0x' + feed.id;
            const market = this.feedIdToMarket.get(feedId);
            if (market && feed.price) {
                const pythPrice = {
                    feedId,
                    price: feed.price.price,
                    confidence: feed.price.conf,
                    expo: feed.price.expo,
                    publishTime: feed.price.publish_time,
                    emaPrice: feed.ema_price?.price ?? '0',
                    emaConfidence: feed.ema_price?.conf ?? '0',
                };
                this.latestPrices.set(feedId, pythPrice);
                const formattedPrice = Number(pythPrice.price) * Math.pow(10, pythPrice.expo);
                this.emit('price', {
                    market,
                    price: formattedPrice.toString(),
                    confidence: (Number(pythPrice.confidence) * Math.pow(10, pythPrice.expo)).toString(),
                    timestamp: pythPrice.publishTime * 1000,
                    source: 'pyth',
                });
            }
        }
    }
}
exports.PythFeed = PythFeed;
//# sourceMappingURL=PythFeed.js.map