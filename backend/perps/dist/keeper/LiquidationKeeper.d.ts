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
import { OracleAggregator } from '../feeds/OracleAggregator';
import { ContractInteraction } from '../contracts/ContractInteraction';
import { Position, MarketConfig } from '../orderbook/types';
export interface AccountState {
    userId: string;
    address: string;
    positions: Position[];
    marginBalance: string;
    unrealizedPnl: string;
    accountValue: string;
    maintenanceMargin: string;
    marginRatio: string;
    isLiquidatable: boolean;
}
export declare class LiquidationKeeper {
    private oracle;
    private contracts;
    private marketConfigs;
    private interval;
    private running;
    private positions;
    private readonly CHECK_INTERVAL_MS;
    private readonly LIQUIDATION_BUFFER;
    private stats;
    constructor(oracle: OracleAggregator, contracts: ContractInteraction, marketConfigs: Map<string, MarketConfig>);
    /**
     * Start the liquidation keeper.
     */
    start(): void;
    /**
     * Stop the keeper.
     */
    stop(): void;
    /**
     * Register a position for monitoring.
     */
    trackPosition(position: Position): void;
    /**
     * Remove a closed position.
     */
    untrackPosition(userId: string, market: string): void;
    /**
     * Get account state for a user.
     */
    getAccountState(userId: string): AccountState | null;
    /**
     * Get keeper stats.
     */
    getStats(): {
        totalLiquidatedVolume: string;
        trackedAccounts: number;
        totalPositions: number;
        checksPerformed: number;
        liquidationsTriggered: number;
    };
    private checkAndLiquidate;
}
//# sourceMappingURL=LiquidationKeeper.d.ts.map