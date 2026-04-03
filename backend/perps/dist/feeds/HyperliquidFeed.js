"use strict";
/**
 * Hyperliquid Price Feed Integration
 *
 * Connects to Hyperliquid's WebSocket API to stream real-time prices,
 * order book data, and trades. Used for:
 * 1. Oracle price feed (mark price calculation)
 * 2. External liquidity assessment (for smart order routing)
 * 3. Trade routing (execute on Hyperliquid when internal liquidity thin)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HyperliquidFeed = void 0;
const ws_1 = __importDefault(require("ws"));
const events_1 = require("events");
const pino_1 = __importDefault(require("pino"));
const logger = (0, pino_1.default)({ name: 'hyperliquid-feed' });
const MAINNET_WS = 'wss://api.hyperliquid.xyz/ws';
const MAINNET_REST = 'https://api.hyperliquid.xyz';
const TESTNET_WS = 'wss://api.hyperliquid-testnet.xyz/ws';
const TESTNET_REST = 'https://api.hyperliquid-testnet.xyz';
class HyperliquidFeed extends events_1.EventEmitter {
    ws = null;
    wsUrl;
    restUrl;
    reconnectDelay = 1000;
    maxReconnectDelay = 30000;
    isConnected = false;
    subscribedCoins = new Set();
    latestMids = {};
    latestBooks = new Map();
    pingInterval = null;
    constructor(options = {}) {
        super();
        this.wsUrl = options.testnet ? TESTNET_WS : MAINNET_WS;
        this.restUrl = options.testnet ? TESTNET_REST : MAINNET_REST;
    }
    /**
     * Connect to Hyperliquid WebSocket and subscribe to feeds.
     */
    async connect(coins) {
        this.subscribedCoins = new Set(coins);
        return this.doConnect();
    }
    /**
     * Get latest mid price for a coin.
     */
    getMidPrice(coin) {
        return this.latestMids[coin] ?? null;
    }
    /**
     * Get all latest mid prices.
     */
    getAllMids() {
        return { ...this.latestMids };
    }
    /**
     * Get latest L2 book for a coin.
     */
    getBook(coin) {
        return this.latestBooks.get(coin) ?? null;
    }
    /**
     * Fetch all mid prices via REST (one-shot).
     */
    async fetchMids() {
        const response = await fetch(`${this.restUrl}/info`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'allMids' }),
        });
        const data = await response.json();
        this.latestMids = data;
        return data;
    }
    /**
     * Fetch L2 book via REST (one-shot).
     */
    async fetchL2Book(coin) {
        const response = await fetch(`${this.restUrl}/info`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'l2Book', coin }),
        });
        const data = await response.json();
        this.latestBooks.set(coin, data);
        return data;
    }
    /**
     * Fetch asset metadata and live context.
     */
    async fetchMetaAndCtx() {
        const response = await fetch(`${this.restUrl}/info`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'metaAndAssetCtxs' }),
        });
        return response.json();
    }
    /**
     * Fetch candle data.
     */
    async fetchCandles(coin, interval, startTime, endTime) {
        const response = await fetch(`${this.restUrl}/info`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'candleSnapshot',
                req: { coin, interval, startTime, endTime: endTime ?? Date.now() },
            }),
        });
        return response.json();
    }
    /**
     * Disconnect.
     */
    disconnect() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
    }
    // --- Private ---
    doConnect() {
        return new Promise((resolve, reject) => {
            this.ws = new ws_1.default(this.wsUrl);
            this.ws.on('open', () => {
                logger.info('Connected to Hyperliquid WebSocket');
                this.isConnected = true;
                this.reconnectDelay = 1000;
                // Subscribe to allMids
                this.send({ method: 'subscribe', subscription: { type: 'allMids' } });
                // Subscribe to per-coin feeds
                for (const coin of this.subscribedCoins) {
                    this.send({ method: 'subscribe', subscription: { type: 'l2Book', coin } });
                    this.send({ method: 'subscribe', subscription: { type: 'trades', coin } });
                    this.send({ method: 'subscribe', subscription: { type: 'activeAssetCtx', coin } });
                }
                // Ping keepalive
                this.pingInterval = setInterval(() => {
                    if (this.ws?.readyState === ws_1.default.OPEN) {
                        this.ws.ping();
                    }
                }, 30000);
                resolve();
            });
            this.ws.on('message', (data) => {
                try {
                    const msg = JSON.parse(data.toString());
                    this.handleMessage(msg);
                }
                catch (err) {
                    logger.error({ err }, 'Failed to parse WebSocket message');
                }
            });
            this.ws.on('close', () => {
                logger.warn('Hyperliquid WebSocket disconnected');
                this.isConnected = false;
                if (this.pingInterval) {
                    clearInterval(this.pingInterval);
                    this.pingInterval = null;
                }
                this.scheduleReconnect();
            });
            this.ws.on('error', (err) => {
                logger.error({ err }, 'Hyperliquid WebSocket error');
                if (!this.isConnected)
                    reject(err);
            });
        });
    }
    handleMessage(msg) {
        const { channel, data } = msg;
        switch (channel) {
            case 'allMids':
                this.latestMids = data.mids;
                this.emit('mids', data.mids);
                break;
            case 'l2Book':
                const book = data;
                this.latestBooks.set(book.coin, book);
                this.emit('book', book);
                break;
            case 'trades':
                const trades = Array.isArray(data) ? data : [data];
                for (const trade of trades) {
                    this.emit('trade', trade);
                }
                break;
            case 'activeAssetCtx':
                this.emit('assetCtx', data);
                break;
            case 'subscriptionResponse':
                logger.debug({ subscription: data }, 'Subscription confirmed');
                break;
            default:
                logger.debug({ channel }, 'Unknown channel');
        }
    }
    send(msg) {
        if (this.ws?.readyState === ws_1.default.OPEN) {
            this.ws.send(JSON.stringify(msg));
        }
    }
    scheduleReconnect() {
        logger.info({ delay: this.reconnectDelay }, 'Scheduling reconnect');
        setTimeout(() => {
            this.doConnect().catch(err => {
                logger.error({ err }, 'Reconnect failed');
                this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
                this.scheduleReconnect();
            });
        }, this.reconnectDelay);
    }
}
exports.HyperliquidFeed = HyperliquidFeed;
//# sourceMappingURL=HyperliquidFeed.js.map