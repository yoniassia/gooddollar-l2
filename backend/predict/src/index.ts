// ============================================================
// GoodPredict Backend — Entry Point
// ============================================================
// Starts the HTTP server, WebSocket server, CLOB engine,
// Polymarket feed, and market resolver.

import express from 'express';
import { createServer } from 'http';
import { OrderBookEngine } from './engine/orderbook.js';
import { PolymarketFeed } from './feeds/polymarket.js';
import { PredictWebSocketServer } from './api/websocket.js';
import { MarketResolverService } from './resolver/resolver.js';
import { createRoutes } from './api/routes.js';

const PORT = parseInt(process.env.PORT || '3040', 10);
const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS || '0x0000000000000000000000000000000000000000';
const POLYMARKET_POLL_MS = parseInt(process.env.POLYMARKET_POLL_MS || '5000', 10);

async function main() {
  console.log('==============================================');
  console.log('  GoodPredict Backend v0.1.0');
  console.log('  Prediction Markets on GoodDollar L2');
  console.log('==============================================\n');

  // Initialize services
  const resolver = new MarketResolverService(ADMIN_ADDRESS);
  const polyFeed = new PolymarketFeed(POLYMARKET_POLL_MS);

  // Initialize CLOB engine with WebSocket broadcasting
  let wsServer: PredictWebSocketServer;

  const engine = new OrderBookEngine({
    onTrade: (trade) => {
      console.log(`[Trade] ${trade.token} ${trade.size}@${trade.price} in market ${trade.marketId}`);
      wsServer?.broadcastTrade(trade);

      // Also broadcast updated orderbook
      const yesBook = engine.getOrderBook(trade.marketId, 'YES');
      const noBook = engine.getOrderBook(trade.marketId, 'NO');
      if (yesBook) wsServer?.broadcastOrderBook(yesBook);
      if (noBook) wsServer?.broadcastOrderBook(noBook);
    },
    onOrderUpdate: (order) => {
      wsServer?.broadcastOrderUpdate(order);
    },
  });

  // Create Express app
  const app = express();
  app.use(express.json());

  // CORS
  app.use((_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (_req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  // Health check
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'goodpredict',
      version: '0.1.0',
      uptime: process.uptime(),
      timestamp: Date.now(),
    });
  });

  // API routes
  app.use('/api/v1', createRoutes(engine, polyFeed, resolver));

  // Create HTTP server
  const server = createServer(app);

  // Initialize WebSocket server
  wsServer = new PredictWebSocketServer(server);

  // Start Polymarket feed
  polyFeed.start();

  // Periodic market expiry check (every 60s)
  setInterval(() => {
    const closed = resolver.checkExpiredMarkets();
    for (const market of closed) {
      wsServer.broadcastMarketUpdate(market.id, {
        status: 'CLOSED',
        message: 'Market expired and closed for trading',
      });
    }
  }, 60_000);

  // Start server
  server.listen(PORT, () => {
    console.log(`[Server] HTTP + WebSocket listening on port ${PORT}`);
    console.log(`[Server] REST API:    http://localhost:${PORT}/api/v1`);
    console.log(`[Server] WebSocket:   ws://localhost:${PORT}/ws`);
    console.log(`[Server] Health:      http://localhost:${PORT}/health`);
    console.log('');
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('\n[Server] Shutting down...');
    polyFeed.stop();
    wsServer.close();
    server.close(() => {
      console.log('[Server] Goodbye.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
