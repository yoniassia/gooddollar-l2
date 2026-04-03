"use strict";
/**
 * Liquidation Keeper Bot
 *
 * Monitors all open positions and liquidates undercollateralized accounts.
 * Runs on a fixed interval (every 1 second) and checks margin ratios.
 *
 * Liquidation logic:
 * 1. For each position, calculate current margin ratio
 * 2. If maintenance margin > account value, position is liquidable
 * 3. Submit liquidation transaction to GoodPerps contract
 * 4. Insurance fund covers any negative PnL
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiquidationKeeper = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const pino_1 = __importDefault(require("pino"));
const types_1 = require("../orderbook/types");
const logger = (0, pino_1.default)({ name: 'liquidation-keeper' });
class LiquidationKeeper {
    oracle;
    contracts;
    marketConfigs;
    interval = null;
    running = false;
    // All tracked positions (in production, load from DB/chain)
    positions = new Map(); // userId → positions
    CHECK_INTERVAL_MS = 1000; // Check every second
    LIQUIDATION_BUFFER = '1.05'; // 5% buffer above maintenance
    stats = {
        checksPerformed: 0,
        liquidationsTriggered: 0,
        totalLiquidatedVolume: new bignumber_js_1.default(0),
    };
    constructor(oracle, contracts, marketConfigs) {
        this.oracle = oracle;
        this.contracts = contracts;
        this.marketConfigs = marketConfigs;
    }
    /**
     * Start the liquidation keeper.
     */
    start() {
        if (this.running)
            return;
        this.running = true;
        this.interval = setInterval(() => {
            this.checkAndLiquidate().catch(err => {
                logger.error({ err }, 'Liquidation check failed');
            });
        }, this.CHECK_INTERVAL_MS);
        logger.info('Liquidation keeper started');
    }
    /**
     * Stop the keeper.
     */
    stop() {
        this.running = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        logger.info({ stats: this.stats }, 'Liquidation keeper stopped');
    }
    /**
     * Register a position for monitoring.
     */
    trackPosition(position) {
        if (!this.positions.has(position.userId)) {
            this.positions.set(position.userId, []);
        }
        const userPositions = this.positions.get(position.userId);
        // Update existing or add new
        const idx = userPositions.findIndex(p => p.market === position.market);
        if (idx >= 0) {
            userPositions[idx] = position;
        }
        else {
            userPositions.push(position);
        }
    }
    /**
     * Remove a closed position.
     */
    untrackPosition(userId, market) {
        const userPositions = this.positions.get(userId);
        if (!userPositions)
            return;
        const idx = userPositions.findIndex(p => p.market === market);
        if (idx >= 0)
            userPositions.splice(idx, 1);
        if (userPositions.length === 0)
            this.positions.delete(userId);
    }
    /**
     * Get account state for a user.
     */
    getAccountState(userId) {
        const userPositions = this.positions.get(userId);
        if (!userPositions || userPositions.length === 0)
            return null;
        let totalUnrealizedPnl = new bignumber_js_1.default(0);
        let totalMaintenanceMargin = new bignumber_js_1.default(0);
        const marginBalance = new bignumber_js_1.default(userPositions[0]?.margin ?? '0'); // Simplified
        for (const pos of userPositions) {
            const markPrice = this.oracle.getMarkPrice(pos.market);
            if (!markPrice)
                continue;
            const mark = new bignumber_js_1.default(markPrice);
            const entry = new bignumber_js_1.default(pos.entryPrice);
            const size = new bignumber_js_1.default(pos.size);
            // Calculate unrealized PnL
            const pnl = pos.side === types_1.Side.Buy
                ? size.times(mark.minus(entry))
                : size.times(entry.minus(mark));
            totalUnrealizedPnl = totalUnrealizedPnl.plus(pnl);
            // Calculate maintenance margin
            const config = this.marketConfigs.get(pos.market);
            const mmRate = new bignumber_js_1.default(config?.maintenanceMarginRate ?? '0.005');
            const posNotional = size.times(mark);
            totalMaintenanceMargin = totalMaintenanceMargin.plus(posNotional.times(mmRate));
        }
        const accountValue = marginBalance.plus(totalUnrealizedPnl);
        const marginRatio = accountValue.gt(0)
            ? totalMaintenanceMargin.div(accountValue)
            : new bignumber_js_1.default(Infinity);
        const isLiquidatable = marginRatio.gte(1);
        return {
            userId,
            address: userId, // In production, map to on-chain address
            positions: userPositions,
            marginBalance: marginBalance.toString(),
            unrealizedPnl: totalUnrealizedPnl.toString(),
            accountValue: accountValue.toString(),
            maintenanceMargin: totalMaintenanceMargin.toString(),
            marginRatio: marginRatio.toString(),
            isLiquidatable,
        };
    }
    /**
     * Get keeper stats.
     */
    getStats() {
        return {
            ...this.stats,
            totalLiquidatedVolume: this.stats.totalLiquidatedVolume.toString(),
            trackedAccounts: this.positions.size,
            totalPositions: Array.from(this.positions.values()).reduce((sum, positions) => sum + positions.length, 0),
        };
    }
    // --- Private ---
    async checkAndLiquidate() {
        this.stats.checksPerformed++;
        for (const [userId, userPositions] of this.positions) {
            const state = this.getAccountState(userId);
            if (!state || !state.isLiquidatable)
                continue;
            logger.warn({
                userId,
                marginRatio: state.marginRatio,
                accountValue: state.accountValue,
                maintenanceMargin: state.maintenanceMargin,
            }, 'Account liquidatable!');
            // Liquidate positions (largest first)
            const sortedPositions = [...userPositions].sort((a, b) => {
                const aNotional = new bignumber_js_1.default(a.size).times(a.markPrice || a.entryPrice);
                const bNotional = new bignumber_js_1.default(b.size).times(b.markPrice || b.entryPrice);
                return bNotional.comparedTo(aNotional) ?? 0;
            });
            for (const pos of sortedPositions) {
                const markPrice = this.oracle.getMarkPrice(pos.market);
                if (!markPrice)
                    continue;
                try {
                    const txHash = await this.contracts.liquidatePosition(userId, pos.market, markPrice);
                    this.stats.liquidationsTriggered++;
                    const notional = new bignumber_js_1.default(pos.size).times(markPrice);
                    this.stats.totalLiquidatedVolume = this.stats.totalLiquidatedVolume.plus(notional);
                    logger.info({
                        userId,
                        market: pos.market,
                        size: pos.size,
                        markPrice,
                        txHash,
                    }, 'Position liquidated');
                    // Remove from tracking
                    this.untrackPosition(userId, pos.market);
                }
                catch (err) {
                    logger.error({ err, userId, market: pos.market }, 'Liquidation tx failed');
                }
            }
        }
    }
}
exports.LiquidationKeeper = LiquidationKeeper;
//# sourceMappingURL=LiquidationKeeper.js.map