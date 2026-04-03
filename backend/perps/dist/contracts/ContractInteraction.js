"use strict";
/**
 * Contract Interaction Layer
 *
 * Handles all interactions with GoodDollar L2 smart contracts:
 * - GoodPerps.sol: Position management and settlement
 * - MarginVault.sol: Margin deposits/withdrawals
 * - UBIFeeSplitter.sol: Fee routing (33% to UBI)
 * - InsuranceFund.sol: Liquidation backstop
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractInteraction = void 0;
const ethers_1 = require("ethers");
const pino_1 = __importDefault(require("pino"));
const logger = (0, pino_1.default)({ name: 'contracts' });
// ABI fragments for the contracts we interact with
const GOOD_PERPS_ABI = [
    'function settleTrades(tuple(bytes32 id, string market, uint256 price, uint256 size, bool isBuy, address maker, address taker, uint256 makerFee, uint256 takerFee, uint256 timestamp)[] trades) external',
    'function getPosition(address user, string market) external view returns (tuple(address user, string market, bool isLong, uint256 size, uint256 entryPrice, uint256 margin, uint256 leverage, uint256 timestamp))',
    'function liquidatePosition(address user, string market, uint256 markPrice) external',
    'function updateFundingRate(string market, int256 rate, uint256 markPrice, uint256 indexPrice) external',
    'event TradeSettled(bytes32 indexed tradeId, string market, address maker, address taker, uint256 price, uint256 size)',
    'event PositionLiquidated(address indexed user, string market, uint256 size, uint256 markPrice)',
    'event FundingRateUpdated(string market, int256 rate, uint256 timestamp)',
];
const MARGIN_VAULT_ABI = [
    'function deposit(uint256 amount) external',
    'function withdraw(uint256 amount) external',
    'function getBalance(address user) external view returns (uint256)',
    'function getWithdrawableBalance(address user) external view returns (uint256)',
    'event Deposited(address indexed user, uint256 amount)',
    'event Withdrawn(address indexed user, uint256 amount)',
];
const UBI_FEE_SPLITTER_ABI = [
    'function splitFees(uint256 totalFees) external',
    'function pendingFees() external view returns (uint256)',
    'function totalFeesDistributed() external view returns (uint256)',
    'event FeesSplit(uint256 ubiAmount, uint256 treasuryAmount, uint256 lpAmount)',
];
const INSURANCE_FUND_ABI = [
    'function balance() external view returns (uint256)',
    'function coverLoss(uint256 amount) external',
    'event LossCovered(uint256 amount, uint256 remainingBalance)',
];
class ContractInteraction {
    provider;
    signer;
    goodPerps;
    marginVault;
    ubiFeeSplitter;
    insuranceFund;
    addresses;
    nonce = 0;
    constructor(rpcUrl, privateKey, addresses) {
        this.addresses = addresses;
        this.provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
        this.signer = new ethers_1.ethers.Wallet(privateKey, this.provider);
        this.goodPerps = new ethers_1.ethers.Contract(addresses.goodPerps, GOOD_PERPS_ABI, this.signer);
        this.marginVault = new ethers_1.ethers.Contract(addresses.marginVault, MARGIN_VAULT_ABI, this.signer);
        this.ubiFeeSplitter = new ethers_1.ethers.Contract(addresses.ubiFeeSplitter, UBI_FEE_SPLITTER_ABI, this.signer);
        this.insuranceFund = new ethers_1.ethers.Contract(addresses.insuranceFund, INSURANCE_FUND_ABI, this.signer);
    }
    /**
     * Initialize — sync nonce.
     */
    async init() {
        this.nonce = await this.provider.getTransactionCount(this.signer.address);
        logger.info({ address: this.signer.address, nonce: this.nonce }, 'Contract interaction initialized');
    }
    /**
     * Submit a settlement batch to the GoodPerps contract.
     */
    async settleTrades(batch) {
        const tradeStructs = batch.trades.map(t => ({
            id: ethers_1.ethers.id(t.id),
            market: t.market,
            price: ethers_1.ethers.parseUnits(t.price, 18),
            size: ethers_1.ethers.parseUnits(t.size, 18),
            isBuy: t.side === 'buy',
            maker: t.makerUserId, // In production, this maps to on-chain addresses
            taker: t.takerUserId,
            makerFee: ethers_1.ethers.parseUnits(Math.abs(parseFloat(t.makerFee)).toString(), 6), // USDC decimals
            takerFee: ethers_1.ethers.parseUnits(t.takerFee, 6),
            timestamp: BigInt(t.timestamp),
        }));
        try {
            const tx = await this.goodPerps.settleTrades(tradeStructs, {
                nonce: this.nonce++,
                gasLimit: 500000n + 50000n * BigInt(tradeStructs.length),
            });
            logger.info({
                batchId: batch.id,
                txHash: tx.hash,
                tradeCount: tradeStructs.length,
            }, 'Settlement tx submitted');
            // Wait for confirmation
            const receipt = await tx.wait(1);
            logger.info({
                batchId: batch.id,
                txHash: tx.hash,
                gasUsed: receipt.gasUsed.toString(),
                block: receipt.blockNumber,
            }, 'Settlement confirmed');
            return tx.hash;
        }
        catch (err) {
            logger.error({ err, batchId: batch.id }, 'Settlement failed');
            // Re-sync nonce
            this.nonce = await this.provider.getTransactionCount(this.signer.address);
            throw err;
        }
    }
    /**
     * Liquidate an undercollateralized position.
     */
    async liquidatePosition(user, market, markPrice) {
        try {
            const tx = await this.goodPerps.liquidatePosition(user, market, ethers_1.ethers.parseUnits(markPrice, 18), { nonce: this.nonce++, gasLimit: 300000n });
            logger.info({ user, market, markPrice, txHash: tx.hash }, 'Liquidation tx submitted');
            const receipt = await tx.wait(1);
            logger.info({ txHash: tx.hash, gasUsed: receipt.gasUsed.toString() }, 'Liquidation confirmed');
            return tx.hash;
        }
        catch (err) {
            logger.error({ err, user, market }, 'Liquidation failed');
            this.nonce = await this.provider.getTransactionCount(this.signer.address);
            throw err;
        }
    }
    /**
     * Update funding rate on-chain.
     */
    async updateFundingRate(market, rate, markPrice, indexPrice) {
        try {
            // Convert rate to fixed-point (1e18 precision)
            const rateInt = ethers_1.ethers.parseUnits(rate, 18);
            const tx = await this.goodPerps.updateFundingRate(market, rateInt, ethers_1.ethers.parseUnits(markPrice, 18), ethers_1.ethers.parseUnits(indexPrice, 18), { nonce: this.nonce++, gasLimit: 200000n });
            logger.info({ market, rate, txHash: tx.hash }, 'Funding rate update submitted');
            await tx.wait(1);
            return tx.hash;
        }
        catch (err) {
            logger.error({ err, market }, 'Funding rate update failed');
            this.nonce = await this.provider.getTransactionCount(this.signer.address);
            throw err;
        }
    }
    /**
     * Distribute collected fees via UBIFeeSplitter.
     */
    async distributeFees(totalFees) {
        try {
            const tx = await this.ubiFeeSplitter.splitFees(ethers_1.ethers.parseUnits(totalFees, 6), // USDC 6 decimals
            { nonce: this.nonce++, gasLimit: 200000n });
            logger.info({ totalFees, txHash: tx.hash }, 'Fee distribution submitted');
            await tx.wait(1);
            return tx.hash;
        }
        catch (err) {
            logger.error({ err }, 'Fee distribution failed');
            this.nonce = await this.provider.getTransactionCount(this.signer.address);
            throw err;
        }
    }
    /**
     * Get user's margin balance.
     */
    async getUserBalance(user) {
        const balance = await this.marginVault.getBalance(user);
        return ethers_1.ethers.formatUnits(balance, 6);
    }
    /**
     * Get user's on-chain position.
     */
    async getPosition(user, market) {
        return this.goodPerps.getPosition(user, market);
    }
    /**
     * Get insurance fund balance.
     */
    async getInsuranceFundBalance() {
        const balance = await this.insuranceFund.balance();
        return ethers_1.ethers.formatUnits(balance, 6);
    }
    /**
     * Get total fees distributed.
     */
    async getTotalFeesDistributed() {
        const total = await this.ubiFeeSplitter.totalFeesDistributed();
        return ethers_1.ethers.formatUnits(total, 6);
    }
}
exports.ContractInteraction = ContractInteraction;
//# sourceMappingURL=ContractInteraction.js.map