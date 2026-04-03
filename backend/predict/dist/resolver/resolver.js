// ============================================================
// GoodPredict Market Resolver Service
// ============================================================
// Manages market lifecycle: creation, resolution, voiding.
// Phase 1: Admin-only resolution
// Phase 2: Optimistic resolution with dispute period
import { v4 as uuid } from 'uuid';
export class MarketResolverService {
    markets = new Map();
    adminAddress;
    nextOnChainId = 0;
    constructor(adminAddress) {
        this.adminAddress = adminAddress;
    }
    /** Create a new market */
    createMarket(params) {
        const { question, category, endTime, resolver } = params;
        if (!question.trim())
            throw new Error('Question is required');
        if (endTime <= Date.now() / 1000)
            throw new Error('End time must be in the future');
        const market = {
            id: uuid(),
            onChainId: this.nextOnChainId++,
            question: question.trim(),
            category,
            endTime,
            status: 'OPEN',
            resolver: resolver || this.adminAddress,
            totalYES: 0n,
            totalNO: 0n,
            collateral: 0n,
            tickSize: 0.01,
            createdAt: Date.now(),
        };
        this.markets.set(market.id, market);
        console.log(`[Resolver] Market created: ${market.id} — "${question}"`);
        return market;
    }
    /** Get a market by ID */
    getMarket(id) {
        return this.markets.get(id);
    }
    /** Get all markets */
    getAllMarkets() {
        return Array.from(this.markets.values());
    }
    /** Get markets by status */
    getMarketsByStatus(status) {
        return Array.from(this.markets.values()).filter(m => m.status === status);
    }
    /** Close a market (after end time, before resolution) */
    closeMarket(id) {
        const market = this.markets.get(id);
        if (!market)
            throw new Error('Market not found');
        if (market.status !== 'OPEN')
            throw new Error(`Market is ${market.status}, cannot close`);
        if (Date.now() / 1000 < market.endTime)
            throw new Error('Market has not reached end time');
        market.status = 'CLOSED';
        console.log(`[Resolver] Market closed: ${id}`);
        return market;
    }
    /** Resolve a market as YES or NO */
    resolveMarket(id, yesWon) {
        const market = this.markets.get(id);
        if (!market)
            throw new Error('Market not found');
        // Auto-close if still open and past end time
        if (market.status === 'OPEN' && Date.now() / 1000 >= market.endTime) {
            market.status = 'CLOSED';
        }
        if (market.status !== 'CLOSED') {
            throw new Error(`Market is ${market.status}, must be CLOSED to resolve`);
        }
        market.status = yesWon ? 'RESOLVED_YES' : 'RESOLVED_NO';
        console.log(`[Resolver] Market resolved: ${id} → ${market.status}`);
        return market;
    }
    /** Void a market (refund all participants) */
    voidMarket(id) {
        const market = this.markets.get(id);
        if (!market)
            throw new Error('Market not found');
        if (market.status !== 'OPEN' && market.status !== 'CLOSED') {
            throw new Error(`Market is ${market.status}, cannot void`);
        }
        market.status = 'VOIDED';
        console.log(`[Resolver] Market voided: ${id}`);
        return market;
    }
    /** Check and auto-close expired markets */
    checkExpiredMarkets() {
        const now = Date.now() / 1000;
        const closed = [];
        for (const market of this.markets.values()) {
            if (market.status === 'OPEN' && now >= market.endTime) {
                market.status = 'CLOSED';
                closed.push(market);
                console.log(`[Resolver] Auto-closed expired market: ${market.id}`);
            }
        }
        return closed;
    }
}
//# sourceMappingURL=resolver.js.map