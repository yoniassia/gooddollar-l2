/**
 * GoodPerps Backend Service
 *
 * Entry point for the perpetual futures backend.
 * Initializes all components:
 * 1. Matching Engine (order book + matching)
 * 2. Oracle Aggregator (Pyth + Hyperliquid + Chainlink)
 * 3. WebSocket Server (client-facing API)
 * 4. Contract Interaction (L2 settlement)
 * 5. Keeper Bots (liquidation + funding)
 */

import http from 'http';
import express from 'express';
import dotenv from 'dotenv';
import pino from 'pino';

import { MatchingEngine } from './orderbook/MatchingEngine';
import { HyperliquidFeed } from './feeds/HyperliquidFeed';
import { PythFeed } from './feeds/PythFeed';
import { OracleAggregator } from './feeds/OracleAggregator';
import { GoodPerpsWebSocketServer } from './ws/WebSocketServer';
import { ContractInteraction, ContractAddresses } from './contracts/ContractInteraction';
import { LiquidationKeeper } from './keeper/LiquidationKeeper';
import { FundingKeeper } from './keeper/FundingKeeper';
import { MarketConfig, Side, OrderType } from './orderbook/types';

dotenv.config();
const logger = pino({ name: 'goodperps' });

// --- Configuration ---

const PORT = parseInt(process.env.PORT ?? '8080', 10);
const RPC_URL = process.env.L2_RPC_URL ?? 'http://localhost:8545';
const OPERATOR_KEY = process.env.OPERATOR_PRIVATE_KEY ?? '';

const CONTRACT_ADDRESSES: ContractAddresses = {
  goodPerps: process.env.GOOD_PERPS_ADDRESS ?? '0x0000000000000000000000000000000000000001',
  marginVault: process.env.MARGIN_VAULT_ADDRESS ?? '0x0000000000000000000000000000000000000002',
  ubiFeeSplitter: process.env.UBI_FEE_SPLITTER_ADDRESS ?? '0x0000000000000000000000000000000000000003',
  insuranceFund: process.env.INSURANCE_FUND_ADDRESS ?? '0x0000000000000000000000000000000000000004',
  usdc: process.env.USDC_ADDRESS ?? '0x0000000000000000000000000000000000000005',
};

// Market configurations
const MARKETS: MarketConfig[] = [
  {
    symbol: 'BTC-USD',
    baseAsset: 'BTC',
    quoteAsset: 'USD',
    tickSize: '0.1',
    lotSize: '0.0001',
    minOrderSize: '0.0001',
    maxOrderSize: '100',
    maxLeverage: 50,
    maintenanceMarginRate: '0.005',
    initialMarginRate: '0.02',
    makerFeeRate: '-0.0002',
    takerFeeRate: '0.0005',
    fundingInterval: 3600000,
  },
  {
    symbol: 'ETH-USD',
    baseAsset: 'ETH',
    quoteAsset: 'USD',
    tickSize: '0.01',
    lotSize: '0.001',
    minOrderSize: '0.001',
    maxOrderSize: '1000',
    maxLeverage: 50,
    maintenanceMarginRate: '0.005',
    initialMarginRate: '0.02',
    makerFeeRate: '-0.0002',
    takerFeeRate: '0.0005',
    fundingInterval: 3600000,
  },
  {
    symbol: 'SOL-USD',
    baseAsset: 'SOL',
    quoteAsset: 'USD',
    tickSize: '0.001',
    lotSize: '0.01',
    minOrderSize: '0.01',
    maxOrderSize: '10000',
    maxLeverage: 20,
    maintenanceMarginRate: '0.01',
    initialMarginRate: '0.05',
    makerFeeRate: '-0.0002',
    takerFeeRate: '0.0005',
    fundingInterval: 3600000,
  },
];

// --- Bootstrap ---

async function main() {
  logger.info('Starting GoodPerps Backend...');

  // 1. Initialize Matching Engine
  const engine = new MatchingEngine();
  const marketConfigMap = new Map<string, MarketConfig>();
  for (const config of MARKETS) {
    engine.addMarket(config);
    marketConfigMap.set(config.symbol, config);
  }

  // 2. Initialize Oracle Feeds
  const hlFeed = new HyperliquidFeed({ testnet: process.env.TESTNET === 'true' });
  const pythFeed = new PythFeed();
  const oracle = new OracleAggregator(hlFeed, pythFeed);

  // 3. Initialize Contract Interaction
  let contracts: ContractInteraction | null = null;
  if (OPERATOR_KEY) {
    contracts = new ContractInteraction(RPC_URL, OPERATOR_KEY, CONTRACT_ADDRESSES);
    await contracts.init();
  } else {
    logger.warn('No OPERATOR_PRIVATE_KEY — running in paper trading mode');
  }

  // 4. Initialize Express + HTTP Server
  const app = express();
  app.use(express.json());

  // Health check
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      markets: engine.getMarkets(),
      clients: wsServer?.clientCount ?? 0,
    });
  });

  // REST API for market data
  app.get('/api/markets', (_req, res) => {
    res.json(MARKETS);
  });

  app.get('/api/book/:market', (req, res) => {
    const book = engine.getBook(req.params.market, parseInt(req.query.depth as string) || 20);
    if (!book) return res.status(404).json({ error: 'Market not found' });
    res.json(book);
  });

  app.get('/api/trades/:market', (req, res) => {
    const trades = engine.getRecentTrades(req.params.market, parseInt(req.query.limit as string) || 50);
    res.json(trades);
  });

  app.get('/api/oracle/:market', (req, res) => {
    const price = oracle.getPrice(req.params.market);
    if (!price) return res.status(404).json({ error: 'Price not available' });
    res.json(price);
  });

  app.get('/api/funding/:market', (req, res) => {
    const rate = fundingKeeper?.getFundingRate(req.params.market);
    if (!rate) return res.status(404).json({ error: 'Funding rate not available' });
    res.json(rate);
  });

  app.get('/api/stats', (_req, res) => {
    res.json({
      engine: {
        markets: engine.getMarkets(),
        bbo: Object.fromEntries(
          engine.getMarkets().map(m => [m, engine.getBBO(m)])
        ),
      },
      oracle: Object.fromEntries(
        engine.getMarkets().map(m => [m, oracle.getPrice(m)])
      ),
      liquidationKeeper: liquidationKeeper?.getStats(),
      fundingKeeper: fundingKeeper?.getStats(),
    });
  });

  const httpServer = http.createServer(app);

  // 5. Initialize WebSocket Server
  const wsServer = new GoodPerpsWebSocketServer(httpServer, engine, oracle);

  // 6. Initialize Keepers
  let liquidationKeeper: LiquidationKeeper | null = null;
  let fundingKeeper: FundingKeeper | null = null;

  if (contracts) {
    liquidationKeeper = new LiquidationKeeper(oracle, contracts, marketConfigMap);
    fundingKeeper = new FundingKeeper(oracle, contracts, MARKETS.map(m => m.symbol));
  }

  // 7. Wire up settlement
  if (contracts) {
    engine.on('settlement', async (batch) => {
      try {
        await contracts!.settleTrades(batch);
        // Distribute fees
        if (parseFloat(batch.totalFees) > 0) {
          await contracts!.distributeFees(batch.totalFees);
        }
      } catch (err) {
        logger.error({ err, batchId: batch.id }, 'Settlement/fee distribution failed');
      }
    });
  }

  // 8. Start everything
  const marketSymbols = MARKETS.map(m => m.symbol);

  try {
    await oracle.start(marketSymbols);
    logger.info('Oracle aggregator connected');
  } catch (err) {
    logger.warn({ err }, 'Oracle connection failed — will retry in background');
  }

  engine.start();
  liquidationKeeper?.start();
  fundingKeeper?.start();

  httpServer.listen(PORT, () => {
    logger.info(`GoodPerps backend listening on port ${PORT}`);
    logger.info(`REST API: http://localhost:${PORT}/api`);
    logger.info(`WebSocket: ws://localhost:${PORT}/ws`);
    logger.info(`Markets: ${marketSymbols.join(', ')}`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down...');
    engine.stop();
    liquidationKeeper?.stop();
    fundingKeeper?.stop();
    oracle.stop();
    httpServer.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch(err => {
  logger.fatal({ err }, 'Failed to start GoodPerps backend');
  process.exit(1);
});
