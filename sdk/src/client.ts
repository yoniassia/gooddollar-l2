import {
  createPublicClient,
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
  type Transport,
  type Chain,
  type Account,
  type Address,
  parseEther,
  formatEther,
  formatUnits,
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
} from './abis'

/** GoodDollar L2 chain definition for viem */
export const gooddollarL2: Chain = {
  id: CHAIN_CONFIG.id,
  name: CHAIN_CONFIG.name,
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: [CHAIN_CONFIG.rpcUrl] },
  },
  blockExplorers: {
    default: { name: 'Blockscout', url: CHAIN_CONFIG.explorerUrl },
  },
}

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
 *   await sdk.perps.openLong(0, parseEther('1'))
 */
export class GoodDollarSDK {
  public readonly publicClient: PublicClient
  public readonly walletClient: WalletClient | null
  public readonly account: Account | null

  public readonly swap: SwapModule
  public readonly perps: PerpsModule
  public readonly predict: PredictModule
  public readonly lend: LendModule
  public readonly stocks: StocksModule
  public readonly ubi: UBIModule

  constructor(config: GoodDollarSDKConfig = {}) {
    const rpcUrl = config.rpcUrl ?? CHAIN_CONFIG.rpcUrl
    const transport = http(rpcUrl)

    this.publicClient = createPublicClient({ chain: gooddollarL2, transport })

    if (config.privateKey) {
      this.account = privateKeyToAccount(config.privateKey)
      this.walletClient = createWalletClient({
        chain: gooddollarL2,
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
    }) as Promise<bigint>
  }

  /** Get balance of a known token by name */
  async getBalance(tokenName: 'GoodDollarToken' | 'MockUSDC' | 'MockWETH', address?: Address): Promise<bigint> {
    return this.getTokenBalance(ADDRESSES[tokenName] as Address, address)
  }

  /** Approve token spending */
  async approve(token: Address, spender: Address, amount: bigint): Promise<`0x${string}`> {
    if (!this.walletClient || !this.account) throw new Error('Write operations need a private key')
    const hash = await this.walletClient.writeContract({
      address: token,
      abi: ERC20ABI,
      functionName: 'approve',
      args: [spender, amount],
    })
    return hash
  }

  /** Wait for transaction confirmation */
  async waitForTx(hash: `0x${string}`) {
    return this.publicClient.waitForTransactionReceipt({ hash })
  }
}

// ─── Protocol Modules ─────────────────────────────────────────────────────────

class PerpsModule {
  constructor(private sdk: GoodDollarSDK) {}

  /** Deposit margin into MarginVault */
  async depositMargin(amount: bigint): Promise<`0x${string}`> {
    if (!this.sdk.walletClient) throw new Error('Read-only')
    return this.sdk.walletClient.writeContract({
      address: ADDRESSES.MarginVault as Address,
      abi: MarginVaultABI,
      functionName: 'deposit',
      args: [amount],
    })
  }

  /** Open a long position */
  async openLong(marketId: bigint, size: bigint, minPrice = 0n): Promise<`0x${string}`> {
    if (!this.sdk.walletClient) throw new Error('Read-only')
    return this.sdk.walletClient.writeContract({
      address: ADDRESSES.PerpEngine as Address,
      abi: PerpEngineABI,
      functionName: 'openPosition',
      args: [marketId, size, true, minPrice],
    })
  }

  /** Open a short position */
  async openShort(marketId: bigint, size: bigint, maxPrice = BigInt(2) ** BigInt(128)): Promise<`0x${string}`> {
    if (!this.sdk.walletClient) throw new Error('Read-only')
    return this.sdk.walletClient.writeContract({
      address: ADDRESSES.PerpEngine as Address,
      abi: PerpEngineABI,
      functionName: 'openPosition',
      args: [marketId, size, false, maxPrice],
    })
  }

  /** Close a position */
  async closePosition(marketId: bigint): Promise<`0x${string}`> {
    if (!this.sdk.walletClient) throw new Error('Read-only')
    return this.sdk.walletClient.writeContract({
      address: ADDRESSES.PerpEngine as Address,
      abi: PerpEngineABI,
      functionName: 'closePosition',
      args: [marketId],
    })
  }

  /** Get position details */
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

  /** Get unrealized PnL */
  async getUnrealizedPnL(marketId: bigint, user?: Address): Promise<bigint> {
    return this.sdk.publicClient.readContract({
      address: ADDRESSES.PerpEngine as Address,
      abi: PerpEngineABI,
      functionName: 'unrealizedPnL',
      args: [user ?? this.sdk.address, marketId],
    }) as Promise<bigint>
  }

  /** Get market count */
  async getMarketCount(): Promise<bigint> {
    return this.sdk.publicClient.readContract({
      address: ADDRESSES.PerpEngine as Address,
      abi: PerpEngineABI,
      functionName: 'marketCount',
    }) as Promise<bigint>
  }

  /** Get margin balance */
  async getMarginBalance(user?: Address): Promise<bigint> {
    return this.sdk.publicClient.readContract({
      address: ADDRESSES.MarginVault as Address,
      abi: MarginVaultABI,
      functionName: 'balances',
      args: [user ?? this.sdk.address],
    }) as Promise<bigint>
  }
}

class PredictModule {
  constructor(private sdk: GoodDollarSDK) {}

  /** Buy YES or NO tokens */
  async buy(marketId: bigint, isYES: boolean, amount: bigint): Promise<`0x${string}`> {
    if (!this.sdk.walletClient) throw new Error('Read-only')
    return this.sdk.walletClient.writeContract({
      address: ADDRESSES.MarketFactory as Address,
      abi: MarketFactoryABI,
      functionName: 'buy',
      args: [marketId, isYES, amount],
    })
  }

  /** Redeem tokens after resolution */
  async redeem(marketId: bigint, amount: bigint): Promise<`0x${string}`> {
    if (!this.sdk.walletClient) throw new Error('Read-only')
    return this.sdk.walletClient.writeContract({
      address: ADDRESSES.MarketFactory as Address,
      abi: MarketFactoryABI,
      functionName: 'redeem',
      args: [marketId, amount],
    })
  }

  /** Create a prediction market */
  async createMarket(question: string, endTime: bigint, resolver: Address): Promise<`0x${string}`> {
    if (!this.sdk.walletClient) throw new Error('Read-only')
    return this.sdk.walletClient.writeContract({
      address: ADDRESSES.MarketFactory as Address,
      abi: MarketFactoryABI,
      functionName: 'createMarket',
      args: [question, endTime, resolver],
    })
  }

  /** Get market details */
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

  /** Get total market count */
  async getMarketCount(): Promise<bigint> {
    return this.sdk.publicClient.readContract({
      address: ADDRESSES.MarketFactory as Address,
      abi: MarketFactoryABI,
      functionName: 'marketCount',
    }) as Promise<bigint>
  }

  /** Get implied YES probability (basis points) */
  async getYesProbability(marketId: bigint): Promise<bigint> {
    return this.sdk.publicClient.readContract({
      address: ADDRESSES.MarketFactory as Address,
      abi: MarketFactoryABI,
      functionName: 'impliedProbabilityYES',
      args: [marketId],
    }) as Promise<bigint>
  }
}

class LendModule {
  constructor(private sdk: GoodDollarSDK) {}

  /** Supply an asset to the lending pool */
  async supply(asset: Address, amount: bigint): Promise<`0x${string}`> {
    if (!this.sdk.walletClient) throw new Error('Read-only')
    return this.sdk.walletClient.writeContract({
      address: ADDRESSES.GoodLendPool as Address,
      abi: GoodLendPoolABI,
      functionName: 'supply',
      args: [asset, amount],
    })
  }

  /** Withdraw from lending pool */
  async withdraw(asset: Address, amount: bigint): Promise<`0x${string}`> {
    if (!this.sdk.walletClient) throw new Error('Read-only')
    return this.sdk.walletClient.writeContract({
      address: ADDRESSES.GoodLendPool as Address,
      abi: GoodLendPoolABI,
      functionName: 'withdraw',
      args: [asset, amount],
    })
  }

  /** Borrow from lending pool */
  async borrow(asset: Address, amount: bigint): Promise<`0x${string}`> {
    if (!this.sdk.walletClient) throw new Error('Read-only')
    return this.sdk.walletClient.writeContract({
      address: ADDRESSES.GoodLendPool as Address,
      abi: GoodLendPoolABI,
      functionName: 'borrow',
      args: [asset, amount],
    })
  }

  /** Repay a loan */
  async repay(asset: Address, amount: bigint): Promise<`0x${string}`> {
    if (!this.sdk.walletClient) throw new Error('Read-only')
    return this.sdk.walletClient.writeContract({
      address: ADDRESSES.GoodLendPool as Address,
      abi: GoodLendPoolABI,
      functionName: 'repay',
      args: [asset, amount],
    })
  }

  /** Get user's lending account data */
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

  /** Get reserve data for an asset */
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

  /** Mint synthetic stock (deposit collateral + mint) */
  async mint(ticker: string, collateralAmount: bigint, syntheticAmount: bigint): Promise<`0x${string}`> {
    if (!this.sdk.walletClient) throw new Error('Read-only')
    return this.sdk.walletClient.writeContract({
      address: ADDRESSES.CollateralVault as Address,
      abi: CollateralVaultABI,
      functionName: 'depositAndMint',
      args: [ticker, collateralAmount, syntheticAmount],
    })
  }

  /** Burn synthetic stock and reclaim collateral */
  async burn(ticker: string, amount: bigint): Promise<`0x${string}`> {
    if (!this.sdk.walletClient) throw new Error('Read-only')
    return this.sdk.walletClient.writeContract({
      address: ADDRESSES.CollateralVault as Address,
      abi: CollateralVaultABI,
      functionName: 'burn',
      args: [ticker, amount],
    })
  }

  /** Get position for a synthetic stock */
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

  /** List all available synthetic tickers */
  async listTickers(): Promise<string[]> {
    return this.sdk.publicClient.readContract({
      address: ADDRESSES.SyntheticAssetFactory as Address,
      abi: SyntheticAssetFactoryABI,
      functionName: 'allTickers',
    }) as Promise<string[]>
  }

  /** Get token address for a ticker */
  async getTokenAddress(ticker: string): Promise<Address> {
    return this.sdk.publicClient.readContract({
      address: ADDRESSES.SyntheticAssetFactory as Address,
      abi: SyntheticAssetFactoryABI,
      functionName: 'getAsset',
      args: [ticker],
    }) as Promise<Address>
  }
}

class SwapModule {
  constructor(private sdk: GoodDollarSDK) {}

  /** Get UBI fee for a swap amount */
  async getUBIFee(amount: bigint): Promise<bigint> {
    return this.sdk.publicClient.readContract({
      address: ADDRESSES.UBIFeeHook as Address,
      abi: UBIFeeHookABI,
      functionName: 'calculateUBIFee',
      args: [amount],
    }) as Promise<bigint>
  }

  /** Get total swaps processed */
  async getTotalSwaps(): Promise<bigint> {
    return this.sdk.publicClient.readContract({
      address: ADDRESSES.UBIFeeHook as Address,
      abi: UBIFeeHookABI,
      functionName: 'totalSwapsProcessed',
    }) as Promise<bigint>
  }
}

class UBIModule {
  constructor(private sdk: GoodDollarSDK) {}

  /** Get total UBI fees collected for a token */
  async getTotalFees(token: Address): Promise<bigint> {
    return this.sdk.publicClient.readContract({
      address: ADDRESSES.UBIFeeHook as Address,
      abi: UBIFeeHookABI,
      functionName: 'totalUBIFees',
      args: [token],
    }) as Promise<bigint>
  }

  /** Get total swaps processed through UBI hook */
  async getTotalSwaps(): Promise<bigint> {
    return this.sdk.publicClient.readContract({
      address: ADDRESSES.UBIFeeHook as Address,
      abi: UBIFeeHookABI,
      functionName: 'totalSwapsProcessed',
    }) as Promise<bigint>
  }
}
