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
import http from 'http';
import { EventEmitter } from 'events';
import { MatchingEngine } from '../orderbook/MatchingEngine';
import { OracleAggregator } from '../feeds/OracleAggregator';
export declare class GoodPerpsWebSocketServer extends EventEmitter {
    private wss;
    private clients;
    private userClients;
    private engine;
    private oracle;
    private httpServer;
    constructor(httpServer: http.Server, engine: MatchingEngine, oracle: OracleAggregator);
    /**
     * Broadcast to all clients subscribed to a channel.
     */
    private broadcast;
    /**
     * Send to specific user's connected clients.
     */
    private sendToUser;
    private setupEventForwarding;
    private setupConnectionHandler;
    private handleClientMessage;
    private handleSubscribe;
    private handleUnsubscribe;
    private handleAuth;
    private handleOrder;
    private handleCancel;
    private handleCancelAll;
    private handleGetBook;
    private handleGetOrders;
    /**
     * Get connected client count.
     */
    get clientCount(): number;
}
//# sourceMappingURL=WebSocketServer.d.ts.map