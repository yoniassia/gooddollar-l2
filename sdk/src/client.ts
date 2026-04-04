import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { ADDRESSES, CHAIN_CONFIG } from './addresses'
import {
  ERC20ABI,
  PerpEngineABI,
  MarketFactoryABI,
  GoodLendPoolABI,
  CollateralVaultABI,
  SyntheticAssetFactoryABI,
  MarginVaultABI,
  UBIFeeHookABI,
  UBIRevenueTrackerABI,
} from './abis'

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
} as const

export interface GoodDollarSDKConfig {
  /** RPC URL (default: http://localhost:8545) */
  rpcUrl?: string
  /** Private key for write operations (hex with 0x prefix) */
  privateKey?: `0x${string}`
}

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
  public readonly publicClient: any
  /** viem wallet client for write operations (null in read-only mode) */
  public readonly walletClient: any
  /** Account derived from private key (null in read-only mode) */
  public readonly account: any

  public readonly swap: SwapModule
  public readonly perps: PerpsModule
  public readonly predict: PredictModule
  public readonly lend: LendModule
  public readonly stocks: StocksModule
  public readonly ubi: UBIModule

  constructor(config: GoodDollarSDKConfig = {}) {
    const rpcUrl = config.rpcUrl ?? CHAIN_CONFIG.rpcUrl
    const transport = http(rpcUrl)

    this.publicClient = createPublicClient({
      chain: gooddollarL2 as any,
      transport,
    })

    if (config.privateKey) {
      this.account = privateKeyToAccount(config.privateKey)
      this.walletClient = createWalletClient({
        chain: gooddollarL2 as any,
        transport,
        account: this.account,
      })
    } else {
      this.account = null
      this.walletClient = null
    }

    // Initialize protocol modules
    this.swap = new SwapModule(this)
    this.perps = new PerpsModule(this)
    this.predict = new PredictModule(this)
    this.lend = new LendModule(this)
    this.stocks = new StocksModule(this)
    this.ubi = new UBIModule(this)
  }

  /** Get the agent's address */
  get address(): Address {
    if (!this.account) throw new Error('No private key configured — read-only mode')
    return this.account.address
  }

  /** Get ETH balance */
  async getEthBalance(address?: Address): Promise<bigint> {
    return this.publicClient.getBalance({ address: address ?? this.address })
  }

  /** Get ERC20 token balance */
  async getTokenBalance(token: Address, address?: Address): Promise<bigint> {
    return this.publicClient.readContract({
      address: token,
      abi: ERC20ABI,
      functionName: 'balanceOf',
      args: [address ?? this.address],
    })
  }

  /** Get balance of a known token by name */
  async getBalance(tokenName: 'GoodDollarToken' | 'MockUSDC' | 'MockWETH', address?: Address): Promise<bigint> {
    return this.getTokenBalance(ADDRESSES[tokenName] as Address, address)
  }

  /** Approve token spending */
  async approve(token: Address, spender: Address, amount: bigint): Promise<`0x${string}`> {
    if (!this.walletClient || !this.account) throw new Error('Write operations need a private key')
    return this.walletClient.writeContract({
      address: token,
      abi: ERC20ABI,
      functionName: 'approve',
      args: [spender, amount],
    })
  }

  /** Wait for transaction confirmation */
  async waitForTx(hash: `0x${string}`) {
    return this.publicClient.waitForTransactionReceipt({ hash })
  }
}

// ─── Protocol Modules ─────────────────────────────────────────────────────────

class PerpsModule {
  constructor(private sdk: GoodDollarSDK) {}

  async depositMargin(amount: bigint): Promise<`0x${string}`> {
    if (!this.sdk.walletClient) throw new Error('Read-only')
    return this.sdk.walletClient.writeContract({
      address: ADDRESSES.MarginVault as Address,
      abi: MarginVaultABI,
      functionName: 'deposit',
      args: [amount],
    })
  }

  async openLong(marketId: bigint, size: bigint, minPrice = 0n): Promise<`0x${string}`> {
    if (!this.sdk.walletClient) throw new Error('Read-only')
    return this.sdk.walletClient.writeContract({
      address: ADDRESSES.PerpEngine as Address,
      abi: PerpEngineABI,
      functionName: 'openPosition',
      args: [marketId, size, true, minPrice],
    })
  }

  async openShort(marketId: bigint, size: bigint, maxPrice = BigInt(2) ** BigInt(128)): Promise<`0x${string}`> {
    if (!this.sdk.walletClient) throw new Error('Read-only')
    return this.sdk.walletClient.writeContract({
      address: ADDRESSES.PerpEngine as Address,
      abi: PerpEngineABI,
      functionName: 'openPosition',
      args: [marketId, size, false, maxPrice],
    })
  }

  async closePosition(marketId: bigint): Promise<`0x${string}`> {
    if (!this.sdk.walletClient) throw new Error('Read-only')
    return this.sdk.walletClient.writeContract({
      address: ADDRESSES.PerpEngine as Address,
      abi: PerpEngineABI,
      functionName: 'closePosition',
      args: [marketId],
    })
  }

  async getPosition(marketId: bigint, user?: Address) {
    const result = await this.sdk.publicClient.readContract({
      address: ADDRESSES.PerpEngine as Address,
      abi: PerpEngineABI,
      functionName: 'positions',
      args: [user ?? this.sdk.address, marketId],
    })
    const [size, entryPrice, isLong, collateral] = result as [bigint, bigint, boolean, bigint]
    return { size, entryPrice, isLong, collateral }
  }

  async getUnrealizedPnL(marketId: bigint, user?: Address): Promise<bigint> {
    return this.sdk.publicClient.readContract({
      address: ADDRESSES.PerpEngine as Address,
      abi: PerpEngineABI,
      functionName: 'unrealizedPnL',
      args: [user ?? this.sdk.address, marketId],
    })
  }

  async getMarketCount(): Promise<bigint> {
    return this.sdk.publicClient.readContract({
      address: ADDRESSES.PerpEngine as Address,
      abi: PerpEngineABI,
      functionName: 'marketCount',
    })
  }

  async getMarginBalance(user?: Address): Promise<bigint> {
    return this.sdk.publicClient.readContract({
      address: ADDRESSES.MarginVault as Address,
      abi: MarginVaultABI,
      functionName: 'balances',
      args: [user ?? this.sdk.address],
    })
  }
}

class PredictModule {
  constructor(private sdk: GoodDollarSDK) {}

  async buy(marketId: bigint, isYES: boolean, amount: bigint): Promise<`0x${string}`> {
    if (!this.sdk.walletClient) throw new Error('Read-only')
    return this.sdk.walletClient.writeContract({
      address: ADDRESSES.MarketFactory as Address,
      abi: MarketFactoryABI,
      functionName: 'buy',
      args: [marketId, isYES, amount],
    })
  }

  async redeem(marketId: bigint, amount: bigint): Promise<`0x${string}`> {
    if (!this.sdk.walletClient) throw new Error('Read-only')
    return this.sdk.walletClient.writeContract({
      address: ADDRESSES.MarketFactory as Address,
      abi: MarketFactoryABI,
      functionName: 'redeem',
      args: [marketId, amount],
    })
  }

  async createMarket(question: string, endTime: bigint, resolver: Address): Promise<`0x${string}`> {
    if (!this.sdk.walletClient) throw new Error('Read-only')
    return this.sdk.walletClient.writeContract({
      address: ADDRESSES.MarketFactory as Address,
      abi: MarketFactoryABI,
      functionName: 'createMarket',
      args: [question, endTime, resolver],
    })
  }

  async getMarket(marketId: bigint) {
    const result = await this.sdk.publicClient.readContract({
      address: ADDRESSES.MarketFactory as Address,
      abi: MarketFactoryABI,
      functionName: 'getMarket',
      args: [marketId],
    })
    const [question, endTime, status, totalYES, totalNO, collateral] = result as [string, bigint, number, bigint, bigint, bigint]
    return { question, endTime, status, totalYES, totalNO, collateral }
  }

  async getMarketCount(): Promise<bigint> {
    return this.sdk.publicClient.readContract({
      address: ADDRESSES.MarketFactory as Address,
      abi: MarketFactoryABI,
      functionName: 'marketCount',
    })
  }

  async getYesProbability(marketId: bigint): Promise<bigint> {
    return this.sdk.publicClient.readContract({
      address: ADDRESSES.MarketFactory as Address,
      abi: MarketFactoryABI,
      functionName: 'impliedProbabilityYES',
      args: [marketId],
    })
  }
}

class LendModule {
  constructor(private sdk: GoodDollarSDK) {}

  async supply(asset: Address, amount: bigint): Promise<`0x${string}`> {
    if (!this.sdk.walletClient) throw new Error('Read-only')
    return this.sdk.walletClient.writeContract({
      address: ADDRESSES.GoodLendPool as Address,
      abi: GoodLendPoolABI,
      functionName: 'supply',
      args: [asset, amount],
    })
  }

  async withdraw(asset: Address, amount: bigint): Promise<`0x${string}`> {
    if (!this.sdk.walletClient) throw new Error('Read-only')
    return this.sdk.walletClient.writeContract({
      address: ADDRESSES.GoodLendPool as Address,
      abi: GoodLendPoolABI,
      functionName: 'withdraw',
      args: [asset, amount],
    })
  }

  async borrow(asset: Address, amount: bigint): Promise<`0x${string}`> {
    if (!this.sdk.walletClient) throw new Error('Read-only')
    return this.sdk.walletClient.writeContract({
      address: ADDRESSES.GoodLendPool as Address,
      abi: GoodLendPoolABI,
      functionName: 'borrow',
      args: [asset, amount],
    })
  }

  async repay(asset: Address, amount: bigint): Promise<`0x${string}`> {
    if (!this.sdk.walletClient) throw new Error('Read-only')
    return this.sdk.walletClient.writeContract({
      address: ADDRESSES.GoodLendPool as Address,
      abi: GoodLendPoolABI,
      functionName: 'repay',
      args: [asset, amount],
    })
  }

  async getAccountData(user?: Address) {
    const result = await this.sdk.publicClient.readContract({
      address: ADDRESSES.GoodLendPool as Address,
      abi: GoodLendPoolABI,
      functionName: 'getUserAccountData',
      args: [user ?? this.sdk.address],
    })
    const [healthFactor, totalCollateralUSD, totalDebtUSD] = result as [bigint, bigint, bigint]
    return { healthFactor, totalCollateralUSD, totalDebtUSD }
  }

  async getReserveData(asset: Address) {
    const result = await this.sdk.publicClient.readContract({
      address: ADDRESSES.GoodLendPool as Address,
      abi: GoodLendPoolABI,
      functionName: 'getReserveData',
      args: [asset],
    })
    const [totalDeposits, totalBorrows, liquidityIndex, borrowIndex, supplyRate, borrowRate, accruedToTreasury] = result as [bigint, bigint, bigint, bigint, bigint, bigint, bigint]
    return { totalDeposits, totalBorrows, liquidityIndex, borrowIndex, supplyRate, borrowRate, accruedToTreasury }
  }
}

class StocksModule {
  constructor(private sdk: GoodDollarSDK) {}

  async mint(ticker: string, collateralAmount: bigint, syntheticAmount: bigint): Promise<`0x${string}`> {
    if (!this.sdk.walletClient) throw new Error('Read-only')
    return this.sdk.walletClient.writeContract({
      address: ADDRESSES.CollateralVault as Address,
      abi: CollateralVaultABI,
      functionName: 'depositAndMint',
      args: [ticker, collateralAmount, syntheticAmount],
    })
  }

  async burn(ticker: string, amount: bigint): Promise<`0x${string}`> {
    if (!this.sdk.walletClient) throw new Error('Read-only')
    return this.sdk.walletClient.writeContract({
      address: ADDRESSES.CollateralVault as Address,
      abi: CollateralVaultABI,
      functionName: 'burn',
      args: [ticker, amount],
    })
  }

  async getPosition(ticker: string, user?: Address) {
    const result = await this.sdk.publicClient.readContract({
      address: ADDRESSES.CollateralVault as Address,
      abi: CollateralVaultABI,
      functionName: 'getPosition',
      args: [user ?? this.sdk.address, ticker],
    })
    const [userCollateral, userDebt, ratio] = result as [bigint, bigint, bigint]
    return { collateral: userCollateral, debt: userDebt, ratio }
  }

  async listTickers(): Promise<string[]> {
    return this.sdk.publicClient.readContract({
      address: ADDRESSES.SyntheticAssetFactory as Address,
      abi: SyntheticAssetFactoryABI,
      functionName: 'allTickers',
    })
  }

  async getTokenAddress(ticker: string): Promise<Address> {
    return this.sdk.publicClient.readContract({
      address: ADDRESSES.SyntheticAssetFactory as Address,
      abi: SyntheticAssetFactoryABI,
      functionName: 'getAsset',
      args: [ticker],
    })
  }
}

class SwapModule {
  constructor(private sdk: GoodDollarSDK) {}

  async getUBIFee(amount: bigint): Promise<bigint> {
    return this.sdk.publicClient.readContract({
      address: ADDRESSES.UBIFeeHook as Address,
      abi: UBIFeeHookABI,
      functionName: 'calculateUBIFee',
      args: [amount],
    })
  }

  async getTotalSwaps(): Promise<bigint> {
    return this.sdk.publicClient.readContract({
      address: ADDRESSES.UBIFeeHook as Address,
      abi: UBIFeeHookABI,
      functionName: 'totalSwapsProcessed',
    })
  }
}

class UBIModule {
  constructor(private sdk: GoodDollarSDK) {}

  async getTotalFees(token: Address): Promise<bigint> {
    return this.sdk.publicClient.readContract({
      address: ADDRESSES.UBIFeeHook as Address,
      abi: UBIFeeHookABI,
      functionName: 'totalUBIFees',
      args: [token],
    })
  }

  async getTotalSwaps(): Promise<bigint> {
    return this.sdk.publicClient.readContract({
      address: ADDRESSES.UBIFeeHook as Address,
      abi: UBIFeeHookABI,
      functionName: 'totalSwapsProcessed',
    })
  }

  /**
   * Get aggregate dashboard data from UBIRevenueTracker.
   * Returns total fees, UBI funded, tx count, protocol counts, splitter stats.
   */
  async getDashboard(): Promise<{
    totalFees: bigint
    totalUBI: bigint
    totalTx: bigint
    protocolCount: bigint
    activeProtocols: bigint
    splitterFees: bigint
    splitterUBI: bigint
    snapshotCount: bigint
  }> {
    const result = await this.sdk.publicClient.readContract({
      address: ADDRESSES.UBIRevenueTracker as Address,
      abi: UBIRevenueTrackerABI,
      functionName: 'getDashboardData',
    })
    const [totalFees, totalUBI, totalTx, protocolCount, activeProtocols, splitterFees, splitterUBI, snapshotCount] = result as bigint[]
    return { totalFees, totalUBI, totalTx, protocolCount, activeProtocols, splitterFees, splitterUBI, snapshotCount }
  }

  /**
   * Get per-protocol fee breakdown from UBIRevenueTracker.
   */
  async getProtocolBreakdown(): Promise<Array<{
    name: string
    category: string
    feeSource: string
    totalFees: bigint
    ubiContribution: bigint
    txCount: bigint
    lastUpdateBlock: bigint
    active: boolean
  }>> {
    const result = await this.sdk.publicClient.readContract({
      address: ADDRESSES.UBIRevenueTracker as Address,
      abi: UBIRevenueTrackerABI,
      functionName: 'getAllProtocols',
    })
    return (result as any[]).map((p: any) => ({
      name: p.name,
      category: p.category,
      feeSource: p.feeSource,
      totalFees: p.totalFees,
      ubiContribution: p.ubiContribution,
      txCount: p.txCount,
      lastUpdateBlock: p.lastUpdateBlock,
      active: p.active,
    }))
  }
}
