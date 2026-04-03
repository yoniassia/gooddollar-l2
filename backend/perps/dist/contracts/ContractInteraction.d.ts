/**
 * Contract Interaction Layer
 *
 * Handles all interactions with GoodDollar L2 smart contracts:
 * - GoodPerps.sol: Position management and settlement
 * - MarginVault.sol: Margin deposits/withdrawals
 * - UBIFeeSplitter.sol: Fee routing (33% to UBI)
 * - InsuranceFund.sol: Liquidation backstop
 */
import { SettlementBatch } from '../orderbook/MatchingEngine';
export interface ContractAddresses {
    goodPerps: string;
    marginVault: string;
    ubiFeeSplitter: string;
    insuranceFund: string;
    usdc: string;
}
export declare class ContractInteraction {
    private provider;
    private signer;
    private goodPerps;
    private marginVault;
    private ubiFeeSplitter;
    private insuranceFund;
    private addresses;
    private nonce;
    constructor(rpcUrl: string, privateKey: string, addresses: ContractAddresses);
    /**
     * Initialize — sync nonce.
     */
    init(): Promise<void>;
    /**
     * Submit a settlement batch to the GoodPerps contract.
     */
    settleTrades(batch: SettlementBatch): Promise<string>;
    /**
     * Liquidate an undercollateralized position.
     */
    liquidatePosition(user: string, market: string, markPrice: string): Promise<string>;
    /**
     * Update funding rate on-chain.
     */
    updateFundingRate(market: string, rate: string, markPrice: string, indexPrice: string): Promise<string>;
    /**
     * Distribute collected fees via UBIFeeSplitter.
     */
    distributeFees(totalFees: string): Promise<string>;
    /**
     * Get user's margin balance.
     */
    getUserBalance(user: string): Promise<string>;
    /**
     * Get user's on-chain position.
     */
    getPosition(user: string, market: string): Promise<any>;
    /**
     * Get insurance fund balance.
     */
    getInsuranceFundBalance(): Promise<string>;
    /**
     * Get total fees distributed.
     */
    getTotalFeesDistributed(): Promise<string>;
}
//# sourceMappingURL=ContractInteraction.d.ts.map