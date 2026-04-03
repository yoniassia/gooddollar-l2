"use strict";
/**
 * GoodPerps WebSocket Server
 *
 * Client-facing WebSocket API for:
 * - Real-time order book updates
 * - Trade stream
 * - User order/position updates
 * - Oracle price feeds
 *
 * Protocol inspired by Hyperliquid's WebSocket API design.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoodPerpsWebSocketServer = void 0;
const ws_1 = __importStar(require("ws"));
const events_1 = require("events");
const uuid_1 = require("uuid");
const pino_1 = __importDefault(require("pino"));
const types_1 = require("../orderbook/types");
const logger = (0, pino_1.default)({ name: 'ws-server' });
class GoodPerpsWebSocketServer extends events_1.EventEmitter {
    wss;
    clients = new Map();
    userClients = new Map(); // userId → client IDs
    engine;
    oracle;
    httpServer;
    constructor(httpServer, engine, oracle) {
        super();
        this.httpServer = httpServer;
        this.engine = engine;
        this.oracle = oracle;
        this.wss = new ws_1.WebSocketServer({ server: httpServer, path: '/ws' });
        this.setupEventForwarding();
        this.setupConnectionHandler();
    }
    /**
     * Broadcast to all clients subscribed to a channel.
     */
    broadcast(channel, data, market) {
        const subKey = market ? `${channel}:${market}` : channel;
        for (const client of this.clients.values()) {
            if (client.subscriptions.has(subKey) && client.ws.readyState === ws_1.default.OPEN) {
                client.ws.send(JSON.stringify({ channel, data }));
            }
        }
    }
    /**
     * Send to specific user's connected clients.
     */
    sendToUser(userId, channel, data) {
        const clientIds = this.userClients.get(userId);
        if (!clientIds)
            return;
        for (const clientId of clientIds) {
            const client = this.clients.get(clientId);
            if (client?.ws.readyState === ws_1.default.OPEN) {
                client.ws.send(JSON.stringify({ channel, data }));
            }
        }
    }
    setupEventForwarding() {
        // Forward order book updates
        this.engine.on('bookUpdate', (book) => {
            this.broadcast('l2Book', book, book.market);
        });
        // Forward trades
        this.engine.on('trade', (trade) => {
            this.broadcast('trades', trade, trade.market);
            // Send to maker and taker
            this.sendToUser(trade.makerUserId, 'userFills', trade);
            this.sendToUser(trade.takerUserId, 'userFills', trade);
        });
        // Forward order updates
        this.engine.on('order', (order) => {
            this.sendToUser(order.userId, 'orderUpdates', {
                order: {
                    id: order.id,
                    clientId: order.clientId,
                    market: order.market,
                    side: order.side,
                    type: order.type,
                    price: order.price,
                    size: order.size,
                    filledSize: order.filledSize,
                    remainingSize: order.remainingSize,
                    status: order.status,
                    timestamp: order.timestamp,
                },
                status: order.status,
                statusTimestamp: order.updatedAt,
            });
        });
        // Forward settlement batches
        this.engine.on('settlement', (batch) => {
            this.broadcast('settlement', {
                batchId: batch.id,
                tradeCount: batch.trades.length,
                totalVolume: batch.totalVolume,
                totalFees: batch.totalFees,
                timestamp: batch.timestamp,
            });
        });
        // Forward oracle prices
        this.oracle.on('price', (price) => {
            this.broadcast('oracle', price, price.market);
        });
    }
    setupConnectionHandler() {
        this.wss.on('connection', (ws, req) => {
            const clientId = (0, uuid_1.v4)();
            const session = {
                id: clientId,
                ws,
                subscriptions: new Set(),
                authenticated: false,
            };
            this.clients.set(clientId, session);
            logger.info({ clientId, ip: req.socket.remoteAddress }, 'Client connected');
            ws.on('message', (data) => {
                try {
                    const msg = JSON.parse(data.toString());
                    this.handleClientMessage(session, msg);
                }
                catch (err) {
                    ws.send(JSON.stringify({ error: 'Invalid JSON' }));
                }
            });
            ws.on('close', () => {
                this.clients.delete(clientId);
                if (session.userId) {
                    const userSessions = this.userClients.get(session.userId);
                    if (userSessions) {
                        userSessions.delete(clientId);
                        if (userSessions.size === 0)
                            this.userClients.delete(session.userId);
                    }
                }
                logger.info({ clientId }, 'Client disconnected');
            });
            ws.on('error', (err) => {
                logger.error({ clientId, err }, 'Client WebSocket error');
            });
            // Send welcome
            ws.send(JSON.stringify({
                channel: 'connected',
                data: { clientId, markets: this.engine.getMarkets() },
            }));
        });
    }
    handleClientMessage(session, msg) {
        switch (msg.method) {
            case 'subscribe':
                this.handleSubscribe(session, msg);
                break;
            case 'unsubscribe':
                this.handleUnsubscribe(session, msg);
                break;
            case 'auth':
                this.handleAuth(session, msg);
                break;
            case 'order':
                this.handleOrder(session, msg);
                break;
            case 'cancel':
                this.handleCancel(session, msg);
                break;
            case 'cancelAll':
                this.handleCancelAll(session, msg);
                break;
            case 'getBook':
                this.handleGetBook(session, msg);
                break;
            case 'getOrders':
                this.handleGetOrders(session, msg);
                break;
            default:
                session.ws.send(JSON.stringify({
                    error: `Unknown method: ${msg.method}`,
                    id: msg.id,
                }));
        }
    }
    handleSubscribe(session, msg) {
        const { subscription } = msg;
        if (!subscription?.type) {
            session.ws.send(JSON.stringify({ error: 'Missing subscription type', id: msg.id }));
            return;
        }
        const { type, coin, market, user } = subscription;
        const subKey = market || coin ? `${type}:${market || coin}` : type;
        session.subscriptions.add(subKey);
        // For user-specific subscriptions
        if (user && session.authenticated && session.userId === user) {
            const userSubKey = `${type}:${user}`;
            session.subscriptions.add(userSubKey);
        }
        // Send snapshot
        let snapshot = null;
        switch (type) {
            case 'l2Book':
                snapshot = this.engine.getBook(market || coin, 20);
                break;
            case 'trades':
                snapshot = this.engine.getRecentTrades(market || coin, 50);
                break;
            case 'oracle':
                snapshot = this.oracle.getPrice(market || coin);
                break;
        }
        session.ws.send(JSON.stringify({
            channel: 'subscriptionResponse',
            data: { method: 'subscribe', subscription },
        }));
        if (snapshot) {
            session.ws.send(JSON.stringify({
                channel: type,
                data: snapshot,
                isSnapshot: true,
            }));
        }
    }
    handleUnsubscribe(session, msg) {
        const { subscription } = msg;
        if (!subscription?.type)
            return;
        const { type, market, coin } = subscription;
        const subKey = market || coin ? `${type}:${market || coin}` : type;
        session.subscriptions.delete(subKey);
        session.ws.send(JSON.stringify({
            channel: 'subscriptionResponse',
            data: { method: 'unsubscribe', subscription },
        }));
    }
    handleAuth(session, msg) {
        // TODO: Verify EIP-712 signature or JWT
        const { userId, signature } = msg;
        if (!userId) {
            session.ws.send(JSON.stringify({ error: 'Missing userId', id: msg.id }));
            return;
        }
        // For now, accept any userId (add signature verification later)
        session.userId = userId;
        session.authenticated = true;
        if (!this.userClients.has(userId)) {
            this.userClients.set(userId, new Set());
        }
        this.userClients.get(userId).add(session.id);
        session.ws.send(JSON.stringify({
            channel: 'auth',
            data: { success: true, userId },
            id: msg.id,
        }));
    }
    handleOrder(session, msg) {
        if (!session.authenticated || !session.userId) {
            session.ws.send(JSON.stringify({ error: 'Not authenticated', id: msg.id }));
            return;
        }
        try {
            const result = this.engine.submitOrder({
                userId: session.userId,
                market: msg.market,
                side: msg.side,
                type: msg.type || types_1.OrderType.Limit,
                price: msg.price,
                size: msg.size,
                timeInForce: msg.timeInForce,
                reduceOnly: msg.reduceOnly,
                clientId: msg.clientId,
            });
            session.ws.send(JSON.stringify({
                channel: 'orderResponse',
                data: {
                    order: result.order,
                    trades: result.internalTrades.length,
                    externalRouted: result.externalRouted,
                },
                id: msg.id,
            }));
        }
        catch (err) {
            session.ws.send(JSON.stringify({
                error: err.message,
                id: msg.id,
            }));
        }
    }
    handleCancel(session, msg) {
        if (!session.authenticated || !session.userId) {
            session.ws.send(JSON.stringify({ error: 'Not authenticated', id: msg.id }));
            return;
        }
        const order = this.engine.cancelOrder(msg.market, msg.orderId, session.userId);
        session.ws.send(JSON.stringify({
            channel: 'cancelResponse',
            data: { success: !!order, order },
            id: msg.id,
        }));
    }
    handleCancelAll(session, msg) {
        if (!session.authenticated || !session.userId) {
            session.ws.send(JSON.stringify({ error: 'Not authenticated', id: msg.id }));
            return;
        }
        // Cancel across all markets
        const markets = msg.market ? [msg.market] : this.engine.getMarkets();
        let totalCanceled = 0;
        for (const market of markets) {
            const book = this.engine.books?.get(market);
            if (book) {
                const canceled = book.cancelAllOrders(session.userId);
                totalCanceled += canceled.length;
            }
        }
        session.ws.send(JSON.stringify({
            channel: 'cancelAllResponse',
            data: { success: true, count: totalCanceled },
            id: msg.id,
        }));
    }
    handleGetBook(session, msg) {
        const book = this.engine.getBook(msg.market, msg.depth || 20);
        session.ws.send(JSON.stringify({
            channel: 'l2Book',
            data: book,
            id: msg.id,
        }));
    }
    handleGetOrders(session, msg) {
        if (!session.authenticated || !session.userId) {
            session.ws.send(JSON.stringify({ error: 'Not authenticated', id: msg.id }));
            return;
        }
        const orders = this.engine.getUserOrders(session.userId, msg.market);
        session.ws.send(JSON.stringify({
            channel: 'openOrders',
            data: orders,
            id: msg.id,
        }));
    }
    /**
     * Get connected client count.
     */
    get clientCount() {
        return this.clients.size;
    }
}
exports.GoodPerpsWebSocketServer = GoodPerpsWebSocketServer;
//# sourceMappingURL=WebSocketServer.js.map