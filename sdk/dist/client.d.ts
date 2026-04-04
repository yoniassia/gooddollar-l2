import { type Address } from 'viem';
/** GoodDollar L2 chain definition for viem */
export declare const gooddollarL2: {
    readonly id: 42069;
    readonly name: "GoodDollar L2";
    readonly nativeCurrency: {
        readonly name: "Ether";
        readonly symbol: "ETH";
        readonly decimals: 18;
    };
    readonly rpcUrls: {
        readonly default: {
            readonly http: readonly ["http://localhost:8545"];
        };
    };
    readonly blockExplorers: {
        readonly default: {
            readonly name: "Blockscout";
            readonly url: "https://explorer.goodclaw.org";
        };
    };
};
export interface GoodDollarSDKConfig {
    /** RPC URL (default: http://localhost:8545) */
    rpcUrl?: string;
    /** Private key for write operations (hex with 0x prefix) */
    privateKey?: `0x${string}`;
}
/**
 * GoodDollarSDK — unified interface for AI agents to interact with all protocols
 *
 * Usage:
 *   const sdk = new GoodDollarSDK({ privateKey: '0x...' })
 *   const balance = await sdk.getBalance('GoodDollarToken')
 *   await sdk.perps.openLong(0n, parseEther('1'))
 */
export declare class GoodDollarSDK {
    /** viem public client for read operations */
    readonly publicClient: any;
    /** viem wallet client for write operations (null in read-only mode) */
    readonly walletClient: any;
    /** Account derived from private key (null in read-only mode) */
    readonly account: any;
    readonly swap: SwapModule;
    readonly perps: PerpsModule;
    readonly predict: PredictModule;
    readonly lend: LendModule;
    readonly stocks: StocksModule;
    readonly ubi: UBIModule;
    constructor(config?: GoodDollarSDKConfig);
    /** Get the agent's address */
    get address(): Address;
    /** Get ETH balance */
    getEthBalance(address?: Address): Promise<bigint>;
    /** Get ERC20 token balance */
    getTokenBalance(token: Address, address?: Address): Promise<bigint>;
    /** Get balance of a known token by name */
    getBalance(tokenName: 'GoodDollarToken' | 'MockUSDC' | 'MockWETH', address?: Address): Promise<bigint>;
    /** Approve token spending */
    approve(token: Address, spender: Address, amount: bigint): Promise<`0x${string}`>;
    /** Wait for transaction confirmation */
    waitForTx(hash: `0x${string}`): Promise<any>;
}
declare class PerpsModule {
    private sdk;
    constructor(sdk: GoodDollarSDK);
    depositMargin(amount: bigint): Promise<`0x${string}`>;
    openLong(marketId: bigint, size: bigint, minPrice?: bigint): Promise<`0x${string}`>;
    openShort(marketId: bigint, size: bigint, maxPrice?: bigint): Promise<`0x${string}`>;
    closePosition(marketId: bigint): Promise<`0x${string}`>;
    getPosition(marketId: bigint, user?: Address): Promise<{
        size: bigint;
        entryPrice: bigint;
        isLong: boolean;
        collateral: bigint;
    }>;
    getUnrealizedPnL(marketId: bigint, user?: Address): Promise<bigint>;
    getMarketCount(): Promise<bigint>;
    getMarginBalance(user?: Address): Promise<bigint>;
}
declare class PredictModule {
    private sdk;
    constructor(sdk: GoodDollarSDK);
    buy(marketId: bigint, isYES: boolean, amount: bigint): Promise<`0x${string}`>;
    redeem(marketId: bigint, amount: bigint): Promise<`0x${string}`>;
    createMarket(question: string, endTime: bigint, resolver: Address): Promise<`0x${string}`>;
    getMarket(marketId: bigint): Promise<{
        question: string;
        endTime: bigint;
        status: number;
        totalYES: bigint;
        totalNO: bigint;
        collateral: bigint;
    }>;
    getMarketCount(): Promise<bigint>;
    getYesProbability(marketId: bigint): Promise<bigint>;
}
declare class LendModule {
    private sdk;
    constructor(sdk: GoodDollarSDK);
    supply(asset: Address, amount: bigint): Promise<`0x${string}`>;
    withdraw(asset: Address, amount: bigint): Promise<`0x${string}`>;
    borrow(asset: Address, amount: bigint): Promise<`0x${string}`>;
    repay(asset: Address, amount: bigint): Promise<`0x${string}`>;
    getAccountData(user?: Address): Promise<{
        healthFactor: bigint;
        totalCollateralUSD: bigint;
        totalDebtUSD: bigint;
    }>;
    getReserveData(asset: Address): Promise<{
        totalDeposits: bigint;
        totalBorrows: bigint;
        liquidityIndex: bigint;
        borrowIndex: bigint;
        supplyRate: bigint;
        borrowRate: bigint;
        accruedToTreasury: bigint;
    }>;
}
declare class StocksModule {
    private sdk;
    constructor(sdk: GoodDollarSDK);
    mint(ticker: string, collateralAmount: bigint, syntheticAmount: bigint): Promise<`0x${string}`>;
    burn(ticker: string, amount: bigint): Promise<`0x${string}`>;
    getPosition(ticker: string, user?: Address): Promise<{
        collateral: bigint;
        debt: bigint;
        ratio: bigint;
    }>;
    listTickers(): Promise<string[]>;
    getTokenAddress(ticker: string): Promise<Address>;
}
declare class SwapModule {
    private sdk;
    constructor(sdk: GoodDollarSDK);
    getUBIFee(amount: bigint): Promise<bigint>;
    getTotalSwaps(): Promise<bigint>;
}
declare class UBIModule {
    private sdk;
    constructor(sdk: GoodDollarSDK);
    getTotalFees(token: Address): Promise<bigint>;
    getTotalSwaps(): Promise<bigint>;
}
export {};
