import { createPublicClient, createWalletClient, http, } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { ADDRESSES, CHAIN_CONFIG } from './addresses';
import { ERC20ABI, PerpEngineABI, MarketFactoryABI, GoodLendPoolABI, CollateralVaultABI, SyntheticAssetFactoryABI, MarginVaultABI, UBIFeeHookABI, } from './abis';
/** GoodDollar L2 chain definition for viem */
export const gooddollarL2 = {
    id: CHAIN_CONFIG.id,
    name: CHAIN_CONFIG.name,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
        default: { http: [CHAIN_CONFIG.rpcUrl] },
    },
    blockExplorers: {
        default: { name: 'Blockscout', url: CHAIN_CONFIG.explorerUrl },
    },
};
/**
 * GoodDollarSDK — unified interface for AI agents to interact with all protocols
 *
 * Usage:
 *   const sdk = new GoodDollarSDK({ privateKey: '0x...' })
 *   const balance = await sdk.getBalance('GoodDollarToken')
 *   await sdk.perps.openLong(0n, parseEther('1'))
 */
export class GoodDollarSDK {
    /** viem public client for read operations */
    publicClient;
    /** viem wallet client for write operations (null in read-only mode) */
    walletClient;
    /** Account derived from private key (null in read-only mode) */
    account;
    swap;
    perps;
    predict;
    lend;
    stocks;
    ubi;
    constructor(config = {}) {
        const rpcUrl = config.rpcUrl ?? CHAIN_CONFIG.rpcUrl;
        const transport = http(rpcUrl);
        this.publicClient = createPublicClient({
            chain: gooddollarL2,
            transport,
        });
        if (config.privateKey) {
            this.account = privateKeyToAccount(config.privateKey);
            this.walletClient = createWalletClient({
                chain: gooddollarL2,
                transport,
                account: this.account,
            });
        }
        else {
            this.account = null;
            this.walletClient = null;
        }
        // Initialize protocol modules
        this.swap = new SwapModule(this);
        this.perps = new PerpsModule(this);
        this.predict = new PredictModule(this);
        this.lend = new LendModule(this);
        this.stocks = new StocksModule(this);
        this.ubi = new UBIModule(this);
    }
    /** Get the agent's address */
    get address() {
        if (!this.account)
            throw new Error('No private key configured — read-only mode');
        return this.account.address;
    }
    /** Get ETH balance */
    async getEthBalance(address) {
        return this.publicClient.getBalance({ address: address ?? this.address });
    }
    /** Get ERC20 token balance */
    async getTokenBalance(token, address) {
        return this.publicClient.readContract({
            address: token,
            abi: ERC20ABI,
            functionName: 'balanceOf',
            args: [address ?? this.address],
        });
    }
    /** Get balance of a known token by name */
    async getBalance(tokenName, address) {
        return this.getTokenBalance(ADDRESSES[tokenName], address);
    }
    /** Approve token spending */
    async approve(token, spender, amount) {
        if (!this.walletClient || !this.account)
            throw new Error('Write operations need a private key');
        return this.walletClient.writeContract({
            address: token,
            abi: ERC20ABI,
            functionName: 'approve',
            args: [spender, amount],
        });
    }
    /** Wait for transaction confirmation */
    async waitForTx(hash) {
        return this.publicClient.waitForTransactionReceipt({ hash });
    }
}
// ─── Protocol Modules ─────────────────────────────────────────────────────────
class PerpsModule {
    sdk;
    constructor(sdk) {
        this.sdk = sdk;
    }
    async depositMargin(amount) {
        if (!this.sdk.walletClient)
            throw new Error('Read-only');
        return this.sdk.walletClient.writeContract({
            address: ADDRESSES.MarginVault,
            abi: MarginVaultABI,
            functionName: 'deposit',
            args: [amount],
        });
    }
    async openLong(marketId, size, minPrice = 0n) {
        if (!this.sdk.walletClient)
            throw new Error('Read-only');
        return this.sdk.walletClient.writeContract({
            address: ADDRESSES.PerpEngine,
            abi: PerpEngineABI,
            functionName: 'openPosition',
            args: [marketId, size, true, minPrice],
        });
    }
    async openShort(marketId, size, maxPrice = BigInt(2) ** BigInt(128)) {
        if (!this.sdk.walletClient)
            throw new Error('Read-only');
        return this.sdk.walletClient.writeContract({
            address: ADDRESSES.PerpEngine,
            abi: PerpEngineABI,
            functionName: 'openPosition',
            args: [marketId, size, false, maxPrice],
        });
    }
    async closePosition(marketId) {
        if (!this.sdk.walletClient)
            throw new Error('Read-only');
        return this.sdk.walletClient.writeContract({
            address: ADDRESSES.PerpEngine,
            abi: PerpEngineABI,
            functionName: 'closePosition',
            args: [marketId],
        });
    }
    async getPosition(marketId, user) {
        const result = await this.sdk.publicClient.readContract({
            address: ADDRESSES.PerpEngine,
            abi: PerpEngineABI,
            functionName: 'positions',
            args: [user ?? this.sdk.address, marketId],
        });
        const [size, entryPrice, isLong, collateral] = result;
        return { size, entryPrice, isLong, collateral };
    }
    async getUnrealizedPnL(marketId, user) {
        return this.sdk.publicClient.readContract({
            address: ADDRESSES.PerpEngine,
            abi: PerpEngineABI,
            functionName: 'unrealizedPnL',
            args: [user ?? this.sdk.address, marketId],
        });
    }
    async getMarketCount() {
        return this.sdk.publicClient.readContract({
            address: ADDRESSES.PerpEngine,
            abi: PerpEngineABI,
            functionName: 'marketCount',
        });
    }
    async getMarginBalance(user) {
        return this.sdk.publicClient.readContract({
            address: ADDRESSES.MarginVault,
            abi: MarginVaultABI,
            functionName: 'balances',
            args: [user ?? this.sdk.address],
        });
    }
}
class PredictModule {
    sdk;
    constructor(sdk) {
        this.sdk = sdk;
    }
    async buy(marketId, isYES, amount) {
        if (!this.sdk.walletClient)
            throw new Error('Read-only');
        return this.sdk.walletClient.writeContract({
            address: ADDRESSES.MarketFactory,
            abi: MarketFactoryABI,
            functionName: 'buy',
            args: [marketId, isYES, amount],
        });
    }
    async redeem(marketId, amount) {
        if (!this.sdk.walletClient)
            throw new Error('Read-only');
        return this.sdk.walletClient.writeContract({
            address: ADDRESSES.MarketFactory,
            abi: MarketFactoryABI,
            functionName: 'redeem',
            args: [marketId, amount],
        });
    }
    async createMarket(question, endTime, resolver) {
        if (!this.sdk.walletClient)
            throw new Error('Read-only');
        return this.sdk.walletClient.writeContract({
            address: ADDRESSES.MarketFactory,
            abi: MarketFactoryABI,
            functionName: 'createMarket',
            args: [question, endTime, resolver],
        });
    }
    async getMarket(marketId) {
        const result = await this.sdk.publicClient.readContract({
            address: ADDRESSES.MarketFactory,
            abi: MarketFactoryABI,
            functionName: 'getMarket',
            args: [marketId],
        });
        const [question, endTime, status, totalYES, totalNO, collateral] = result;
        return { question, endTime, status, totalYES, totalNO, collateral };
    }
    async getMarketCount() {
        return this.sdk.publicClient.readContract({
            address: ADDRESSES.MarketFactory,
            abi: MarketFactoryABI,
            functionName: 'marketCount',
        });
    }
    async getYesProbability(marketId) {
        return this.sdk.publicClient.readContract({
            address: ADDRESSES.MarketFactory,
            abi: MarketFactoryABI,
            functionName: 'impliedProbabilityYES',
            args: [marketId],
        });
    }
}
class LendModule {
    sdk;
    constructor(sdk) {
        this.sdk = sdk;
    }
    async supply(asset, amount) {
        if (!this.sdk.walletClient)
            throw new Error('Read-only');
        return this.sdk.walletClient.writeContract({
            address: ADDRESSES.GoodLendPool,
            abi: GoodLendPoolABI,
            functionName: 'supply',
            args: [asset, amount],
        });
    }
    async withdraw(asset, amount) {
        if (!this.sdk.walletClient)
            throw new Error('Read-only');
        return this.sdk.walletClient.writeContract({
            address: ADDRESSES.GoodLendPool,
            abi: GoodLendPoolABI,
            functionName: 'withdraw',
            args: [asset, amount],
        });
    }
    async borrow(asset, amount) {
        if (!this.sdk.walletClient)
            throw new Error('Read-only');
        return this.sdk.walletClient.writeContract({
            address: ADDRESSES.GoodLendPool,
            abi: GoodLendPoolABI,
            functionName: 'borrow',
            args: [asset, amount],
        });
    }
    async repay(asset, amount) {
        if (!this.sdk.walletClient)
            throw new Error('Read-only');
        return this.sdk.walletClient.writeContract({
            address: ADDRESSES.GoodLendPool,
            abi: GoodLendPoolABI,
            functionName: 'repay',
            args: [asset, amount],
        });
    }
    async getAccountData(user) {
        const result = await this.sdk.publicClient.readContract({
            address: ADDRESSES.GoodLendPool,
            abi: GoodLendPoolABI,
            functionName: 'getUserAccountData',
            args: [user ?? this.sdk.address],
        });
        const [healthFactor, totalCollateralUSD, totalDebtUSD] = result;
        return { healthFactor, totalCollateralUSD, totalDebtUSD };
    }
    async getReserveData(asset) {
        const result = await this.sdk.publicClient.readContract({
            address: ADDRESSES.GoodLendPool,
            abi: GoodLendPoolABI,
            functionName: 'getReserveData',
            args: [asset],
        });
        const [totalDeposits, totalBorrows, liquidityIndex, borrowIndex, supplyRate, borrowRate, accruedToTreasury] = result;
        return { totalDeposits, totalBorrows, liquidityIndex, borrowIndex, supplyRate, borrowRate, accruedToTreasury };
    }
}
class StocksModule {
    sdk;
    constructor(sdk) {
        this.sdk = sdk;
    }
    async mint(ticker, collateralAmount, syntheticAmount) {
        if (!this.sdk.walletClient)
            throw new Error('Read-only');
        return this.sdk.walletClient.writeContract({
            address: ADDRESSES.CollateralVault,
            abi: CollateralVaultABI,
            functionName: 'depositAndMint',
            args: [ticker, collateralAmount, syntheticAmount],
        });
    }
    async burn(ticker, amount) {
        if (!this.sdk.walletClient)
            throw new Error('Read-only');
        return this.sdk.walletClient.writeContract({
            address: ADDRESSES.CollateralVault,
            abi: CollateralVaultABI,
            functionName: 'burn',
            args: [ticker, amount],
        });
    }
    async getPosition(ticker, user) {
        const result = await this.sdk.publicClient.readContract({
            address: ADDRESSES.CollateralVault,
            abi: CollateralVaultABI,
            functionName: 'getPosition',
            args: [user ?? this.sdk.address, ticker],
        });
        const [userCollateral, userDebt, ratio] = result;
        return { collateral: userCollateral, debt: userDebt, ratio };
    }
    async listTickers() {
        return this.sdk.publicClient.readContract({
            address: ADDRESSES.SyntheticAssetFactory,
            abi: SyntheticAssetFactoryABI,
            functionName: 'allTickers',
        });
    }
    async getTokenAddress(ticker) {
        return this.sdk.publicClient.readContract({
            address: ADDRESSES.SyntheticAssetFactory,
            abi: SyntheticAssetFactoryABI,
            functionName: 'getAsset',
            args: [ticker],
        });
    }
}
class SwapModule {
    sdk;
    constructor(sdk) {
        this.sdk = sdk;
    }
    async getUBIFee(amount) {
        return this.sdk.publicClient.readContract({
            address: ADDRESSES.UBIFeeHook,
            abi: UBIFeeHookABI,
            functionName: 'calculateUBIFee',
            args: [amount],
        });
    }
    async getTotalSwaps() {
        return this.sdk.publicClient.readContract({
            address: ADDRESSES.UBIFeeHook,
            abi: UBIFeeHookABI,
            functionName: 'totalSwapsProcessed',
        });
    }
}
class UBIModule {
    sdk;
    constructor(sdk) {
        this.sdk = sdk;
    }
    async getTotalFees(token) {
        return this.sdk.publicClient.readContract({
            address: ADDRESSES.UBIFeeHook,
            abi: UBIFeeHookABI,
            functionName: 'totalUBIFees',
            args: [token],
        });
    }
    async getTotalSwaps() {
        return this.sdk.publicClient.readContract({
            address: ADDRESSES.UBIFeeHook,
            abi: UBIFeeHookABI,
            functionName: 'totalSwapsProcessed',
        });
    }
}
