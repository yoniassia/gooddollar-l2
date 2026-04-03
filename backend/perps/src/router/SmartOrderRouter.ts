/**
 * Smart Order Router (SOR)
 *
 * Decides how to split orders between internal GoodPerps book and
 * external venues (Hyperliquid) for best execution.
 *
 * Strategy:
 * 1. Check internal book depth for the requested side/size
 * 2. Check external (Hyperliquid) book depth
 * 3. Compare prices and split optimally:
 *    - If internal can fill at better price → fill internally
 *    - If external is better → route externally
 *    - If split reduces average price → split across venues
 *
 * The SOR replaces the simple "route remainder" logic in MatchingEngine.
 */

import BigNumber from 'bignumber.js';
import pino from 'pino';
import { MatchingEngine } from '../orderbook/MatchingEngine';
import { HyperliquidRouter, ExternalFill, ExternalRouteRequest } from './HyperliquidRouter';
import { HyperliquidFeed, HyperliquidL2Level } from '../feeds/HyperliquidFeed';
import { Side, OrderType, Trade, L2Level } from '../orderbook/types';

const logger = pino({ name: 'smart-order-router' });

export interface SORResult {
  internalFills: Trade[];
  externalFills: ExternalFill[];
  totalFilledSize: string;
  avgPrice: string;
  totalFees: string;
  splitRatio: { internal: string; external: string };
}

export interface SORQuote {
  market: string;
  side: Side;
  size: string;
  internalAvgPrice: string | null;
  internalAvailableSize: string;
  externalAvgPrice: string | null;
  externalAvailableSize: string;
  bestRoute: 'internal' | 'external' | 'split';
  estimatedAvgPrice: string;
  estimatedFee: string;
}

// Minimum improvement required to split (in bps)
const MIN_SPLIT_IMPROVEMENT_BPS = 2; // 0.02% better to justify split complexity

// Market → Hyperliquid coin mapping
const MARKET_TO_HL_COIN: Record<string, string> = {
  'BTC-USD': 'BTC',
  'ETH-USD': 'ETH',
  'SOL-USD': 'SOL',
  'DOGE-USD': 'DOGE',
  'AVAX-USD': 'AVAX',
  'ARB-USD': 'ARB',
  'OP-USD': 'OP',
  'LINK-USD': 'LINK',
};

export class SmartOrderRouter {
  private engine: MatchingEngine;
  private hlRouter: HyperliquidRouter;
  private hlFeed: HyperliquidFeed;

  constructor(
    engine: MatchingEngine,
    hlRouter: HyperliquidRouter,
    hlFeed: HyperliquidFeed,
  ) {
    this.engine = engine;
    this.hlRouter = hlRouter;
    this.hlFeed = hlFeed;
  }

  /**
   * Get a quote for how an order would be routed (no execution).
   */
  getQuote(market: string, side: Side, size: string): SORQuote {
    const sizeBN = new BigNumber(size);

    // Check internal book
    const internalBook = this.engine.getBook(market, 50);
    const internalResult = internalBook
      ? this.simulateInternalFill(internalBook, side, sizeBN)
      : { avgPrice: null, availableSize: '0' };

    // Check external book
    const hlCoin = MARKET_TO_HL_COIN[market];
    const externalResult = hlCoin
      ? this.simulateExternalFill(hlCoin, side, sizeBN)
      : { avgPrice: null, availableSize: '0' };

    // Determine best route
    const intAvail = new BigNumber(internalResult.availableSize);
    const extAvail = new BigNumber(externalResult.availableSize);
    const intPrice = internalResult.avgPrice ? new BigNumber(internalResult.avgPrice) : null;
    const extPrice = externalResult.avgPrice ? new BigNumber(externalResult.avgPrice) : null;

    let bestRoute: 'internal' | 'external' | 'split';
    let estimatedAvgPrice: BigNumber;

    if (intAvail.gte(sizeBN) && intPrice) {
      // Internal can fill entirely
      if (extPrice) {
        const isBuy = side === Side.Buy;
        const internalBetter = isBuy ? intPrice.lte(extPrice) : intPrice.gte(extPrice);
        if (internalBetter) {
          bestRoute = 'internal';
          estimatedAvgPrice = intPrice;
        } else {
          // Check if split would help
          bestRoute = 'external';
          estimatedAvgPrice = extPrice;
        }
      } else {
        bestRoute = 'internal';
        estimatedAvgPrice = intPrice;
      }
    } else if (extAvail.gte(sizeBN) && extPrice) {
      if (intAvail.gt(0) && intPrice) {
        // Partial internal + rest external
        bestRoute = 'split';
        const intNotional = intPrice.times(intAvail);
        const extRemainder = sizeBN.minus(intAvail);
        const extNotional = extPrice.times(extRemainder);
        estimatedAvgPrice = intNotional.plus(extNotional).div(sizeBN);
      } else {
        bestRoute = 'external';
        estimatedAvgPrice = extPrice;
      }
    } else if (intAvail.plus(extAvail).gte(sizeBN)) {
      bestRoute = 'split';
      const intFillSize = BigNumber.min(intAvail, sizeBN);
      const extFillSize = sizeBN.minus(intFillSize);
      const intNot = intPrice ? intPrice.times(intFillSize) : new BigNumber(0);
      const extNot = extPrice ? extPrice.times(extFillSize) : new BigNumber(0);
      estimatedAvgPrice = intNot.plus(extNot).div(sizeBN);
    } else {
      // Not enough liquidity anywhere
      bestRoute = intAvail.gte(extAvail) ? 'internal' : 'external';
      estimatedAvgPrice = intPrice || extPrice || new BigNumber(0);
    }

    const estimatedFee = estimatedAvgPrice.times(sizeBN).times('0.0005'); // 5bps fee estimate

    return {
      market,
      side,
      size,
      internalAvgPrice: internalResult.avgPrice,
      internalAvailableSize: internalResult.availableSize,
      externalAvgPrice: externalResult.avgPrice,
      externalAvailableSize: externalResult.availableSize,
      bestRoute,
      estimatedAvgPrice: estimatedAvgPrice.decimalPlaces(6).toString(),
      estimatedFee: estimatedFee.decimalPlaces(6).toString(),
    };
  }

  /**
   * Execute a smart-routed order.
   * Returns combined results from internal and external fills.
   */
  async executeOrder(
    userId: string,
    market: string,
    side: Side,
    size: string,
    orderId?: string,
  ): Promise<SORResult> {
    const quote = this.getQuote(market, side, size);
    const sizeBN = new BigNumber(size);

    logger.info({
      userId,
      market,
      side,
      size,
      bestRoute: quote.bestRoute,
      internalAvail: quote.internalAvailableSize,
      externalAvail: quote.externalAvailableSize,
    }, 'SOR executing order');

    const internalFills: Trade[] = [];
    const externalFills: ExternalFill[] = [];
    let totalFilledSize = new BigNumber(0);
    let totalNotional = new BigNumber(0);
    let totalFees = new BigNumber(0);

    // Step 1: Fill internally what we can
    if (quote.bestRoute === 'internal' || quote.bestRoute === 'split') {
      const internalSize = quote.bestRoute === 'internal'
        ? size
        : BigNumber.min(sizeBN, new BigNumber(quote.internalAvailableSize)).toString();

      if (new BigNumber(internalSize).gt(0)) {
        const result = this.engine.submitOrder({
          userId,
          market,
          side,
          type: OrderType.Market,
          price: '0', // Market orders don't need price
          size: internalSize,
        });

        internalFills.push(...result.internalTrades);
        for (const trade of result.internalTrades) {
          const tradeSize = new BigNumber(trade.size);
          const tradePrice = new BigNumber(trade.price);
          totalFilledSize = totalFilledSize.plus(tradeSize);
          totalNotional = totalNotional.plus(tradePrice.times(tradeSize));
          totalFees = totalFees.plus(new BigNumber(trade.takerFee));
        }
      }
    }

    // Step 2: Route remainder to external venue
    const remainder = sizeBN.minus(totalFilledSize);
    if (remainder.gt(0) && (quote.bestRoute === 'external' || quote.bestRoute === 'split')) {
      const externalFill = await this.hlRouter.routeOrder({
        market,
        side,
        size: remainder.toString(),
        userId,
        orderId: orderId || `sor-${Date.now()}`,
      });

      if (externalFill) {
        externalFills.push(externalFill);
        const fillSize = new BigNumber(externalFill.size);
        const fillPrice = new BigNumber(externalFill.price);
        totalFilledSize = totalFilledSize.plus(fillSize);
        totalNotional = totalNotional.plus(fillPrice.times(fillSize));
        totalFees = totalFees.plus(new BigNumber(externalFill.fee));
      }
    }

    const avgPrice = totalFilledSize.gt(0)
      ? totalNotional.div(totalFilledSize)
      : new BigNumber(0);

    const internalFilledSize = internalFills.reduce(
      (sum, t) => sum.plus(t.size),
      new BigNumber(0),
    );
    const externalFilledSize = externalFills.reduce(
      (sum, f) => sum.plus(f.size),
      new BigNumber(0),
    );

    const result: SORResult = {
      internalFills,
      externalFills,
      totalFilledSize: totalFilledSize.toString(),
      avgPrice: avgPrice.decimalPlaces(6).toString(),
      totalFees: totalFees.decimalPlaces(6).toString(),
      splitRatio: {
        internal: internalFilledSize.toString(),
        external: externalFilledSize.toString(),
      },
    };

    logger.info({
      userId,
      market,
      totalFilled: result.totalFilledSize,
      avgPrice: result.avgPrice,
      internalSize: result.splitRatio.internal,
      externalSize: result.splitRatio.external,
    }, 'SOR execution complete');

    return result;
  }

  /**
   * Simulate filling against internal book (no execution).
   */
  private simulateInternalFill(
    book: { bids: L2Level[]; asks: L2Level[] },
    side: Side,
    size: BigNumber,
  ): { avgPrice: string | null; availableSize: string } {
    // Buy fills against asks, sell fills against bids
    const levels = side === Side.Buy ? book.asks : book.bids;
    if (!levels || levels.length === 0) return { avgPrice: null, availableSize: '0' };

    let remaining = size;
    let totalCost = new BigNumber(0);
    let totalFilled = new BigNumber(0);

    for (const level of levels) {
      if (remaining.lte(0)) break;
      const levelSize = new BigNumber(level.size);
      const levelPrice = new BigNumber(level.price);
      const fillSize = BigNumber.min(remaining, levelSize);

      totalCost = totalCost.plus(levelPrice.times(fillSize));
      totalFilled = totalFilled.plus(fillSize);
      remaining = remaining.minus(fillSize);
    }

    const avgPrice = totalFilled.gt(0)
      ? totalCost.div(totalFilled).decimalPlaces(6).toString()
      : null;

    return { avgPrice, availableSize: totalFilled.toString() };
  }

  /**
   * Simulate filling against Hyperliquid book (no execution).
   */
  private simulateExternalFill(
    hlCoin: string,
    side: Side,
    size: BigNumber,
  ): { avgPrice: string | null; availableSize: string } {
    const book = this.hlFeed.getBook(hlCoin);
    if (!book || !book.levels) return { avgPrice: null, availableSize: '0' };

    // Buy fills against asks, sell fills against bids
    const levels = side === Side.Buy ? book.levels[1] : book.levels[0];
    if (!levels || levels.length === 0) return { avgPrice: null, availableSize: '0' };

    let remaining = size;
    let totalCost = new BigNumber(0);
    let totalFilled = new BigNumber(0);

    for (const level of levels) {
      if (remaining.lte(0)) break;
      const levelSize = new BigNumber(level.sz);
      const levelPrice = new BigNumber(level.px);
      const fillSize = BigNumber.min(remaining, levelSize);

      totalCost = totalCost.plus(levelPrice.times(fillSize));
      totalFilled = totalFilled.plus(fillSize);
      remaining = remaining.minus(fillSize);
    }

    const avgPrice = totalFilled.gt(0)
      ? totalCost.div(totalFilled).decimalPlaces(6).toString()
      : null;

    return { avgPrice, availableSize: totalFilled.toString() };
  }
}
