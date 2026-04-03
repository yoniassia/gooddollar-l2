import { Router } from 'express';
import { OrderBookEngine } from '../engine/orderbook.js';
import { PolymarketFeed } from '../feeds/polymarket.js';
import { MarketResolverService } from '../resolver/resolver.js';
export declare function createRoutes(engine: OrderBookEngine, feed: PolymarketFeed, resolver: MarketResolverService): Router;
//# sourceMappingURL=routes.d.ts.map