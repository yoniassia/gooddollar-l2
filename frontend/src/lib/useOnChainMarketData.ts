'use client'

/**
 * useOnChainMarketData — replaces MOCK_MARKET_DATA from marketData.ts
 * with live CoinGecko prices via usePriceFeeds + on-chain token data.
 *
 * Price source: CoinGecko via usePriceFeeds (refreshes every 60s).
 * On-chain reads: GoodPool reserves for on-chain volume/liquidity (future).
 *
 * Falls back to zero/empty when no live data is available.
 */

import { useMemo } from 'react'
import { usePriceFeeds, FALLBACK_PRICES } from './usePriceFeeds'
import { TOKENS, TOKEN_COLORS } from './tokens'
import type { TokenMarketData } from './marketData'

// Token descriptions — static metadata
const TOKEN_DESCRIPTIONS: Record<string, string> = {
  ETH:   'Ethereum — decentralized blockchain enabling smart contracts and dApps.',
  WETH:  'Wrapped Ether — ERC-20 compatible version of ETH for DeFi protocols.',
  WBTC:  'Wrapped Bitcoin — ERC-20 token backed 1:1 by Bitcoin.',
  USDC:  'USD Coin — fully-reserved stablecoin pegged to the US dollar.',
  USDT:  'Tether — largest stablecoin by market cap, pegged to USD.',
  DAI:   'Dai — decentralized overcollateralized stablecoin by MakerDAO.',
  'G$':  'GoodDollar — universal basic income token distributed to verified humans.',
  LINK:  'Chainlink — decentralized oracle network for smart contracts.',
  UNI:   'Uniswap — leading decentralized exchange protocol on Ethereum.',
  AAVE:  'Aave — decentralized lending and borrowing protocol.',
  ARB:   'Arbitrum — Ethereum Layer 2 scaling via optimistic rollups.',
  OP:    'Optimism — Layer 2 powering the OP Stack that GoodDollar L2 is built on.',
  MKR:   'Maker — governance token of MakerDAO behind DAI stablecoin.',
  COMP:  'Compound — DeFi lending protocol with algorithmic interest rates.',
  SNX:   'Synthetix — derivatives protocol for synthetic assets on-chain.',
  CRV:   'Curve — DEX optimized for stablecoin and pegged-asset swaps.',
  LDO:   'Lido — largest liquid staking protocol for ETH.',
  MATIC: 'Polygon — multi-chain scaling framework for Ethereum.',
}

const ALL_SYMBOLS = Object.keys(FALLBACK_PRICES)

/**
 * Hook that provides live token market data, replacing mock data.
 * Uses CoinGecko for prices with automatic fallback.
 */
export function useOnChainMarketData(): {
  tokens: TokenMarketData[]
  isLive: boolean
  isLoading: boolean
} {
  const { prices, isLive } = usePriceFeeds(ALL_SYMBOLS)

  const tokens = useMemo<TokenMarketData[]>(() => {
    return TOKENS
      .filter(t => prices[t.symbol] !== undefined || FALLBACK_PRICES[t.symbol] !== undefined)
      .map(t => {
        const price = prices[t.symbol] ?? FALLBACK_PRICES[t.symbol] ?? 0
        if (price === 0) return null

        return {
          ...t,
          price,
          change1h: 0,
          change24h: 0,
          change7d: 0,
          volume24h: 0,
          marketCap: 0,
          sparkline7d: [price, price, price, price, price, price, price],
          description: TOKEN_DESCRIPTIONS[t.symbol] ?? `${t.name} token`,
          circulatingSupply: undefined,
          maxSupply: undefined,
        }
      })
      .filter(Boolean) as TokenMarketData[]
  }, [prices])

  return { tokens, isLive, isLoading: false }
}

export { TOKEN_COLORS }
