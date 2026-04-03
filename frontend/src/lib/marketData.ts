import { TOKENS, TOKEN_COLORS, type Token } from './tokens'

export interface TokenMarketData extends Token {
  price: number
  change1h: number
  change24h: number
  change7d: number
  volume24h: number
  marketCap: number
  sparkline7d: number[]
  description: string
  circulatingSupply?: number
  maxSupply?: number | null
}

interface MockEntry {
  price: number
  change24h: number
  change1h: number
  change7d: number
  volume24h: number
  marketCap: number
  description: string
  circulatingSupply?: number
  maxSupply?: number | null
}

const MOCK_MARKET_DATA: Record<string, MockEntry> = {
  'ETH': { price: 3012.45, change1h: 0.12, change24h: 2.34, change7d: 5.81, volume24h: 14_200_000_000, marketCap: 362_000_000_000, description: 'Ethereum is a decentralized blockchain platform that enables smart contracts and dApps. ETH is the native currency used to pay gas fees and secure the network via proof-of-stake.', circulatingSupply: 120_200_000, maxSupply: null },
  'WBTC': { price: 60_125.80, change1h: 0.08, change24h: 1.12, change7d: 3.45, volume24h: 850_000_000, marketCap: 11_800_000_000, description: 'Wrapped Bitcoin is an ERC-20 token backed 1:1 by Bitcoin, allowing BTC holders to participate in Ethereum DeFi protocols.', circulatingSupply: 196_300, maxSupply: null },
  'USDC': { price: 1.00, change1h: 0.00, change24h: 0.01, change7d: 0.02, volume24h: 7_400_000_000, marketCap: 32_000_000_000, description: 'USD Coin is a fully-reserved stablecoin pegged to the US dollar, issued by Circle and backed by cash and short-duration US Treasuries.', circulatingSupply: 32_000_000_000, maxSupply: null },
  'USDT': { price: 1.00, change1h: -0.01, change24h: -0.01, change7d: 0.00, volume24h: 52_000_000_000, marketCap: 110_000_000_000, description: 'Tether is the largest stablecoin by market cap, pegged to the US dollar. It is widely used as a base trading pair across centralized and decentralized exchanges.', circulatingSupply: 110_000_000_000, maxSupply: null },
  'DAI': { price: 1.00, change1h: 0.00, change24h: 0.02, change7d: 0.01, volume24h: 280_000_000, marketCap: 5_300_000_000, description: 'Dai is a decentralized, overcollateralized stablecoin governed by MakerDAO. It maintains its peg through a system of crypto-backed vaults.', circulatingSupply: 5_300_000_000, maxSupply: null },
  'G$': { price: 0.0102, change1h: 1.23, change24h: 5.67, change7d: 12.40, volume24h: 1_200_000, marketCap: 15_000_000, description: 'GoodDollar is a universal basic income protocol that distributes free digital currency to verified humans worldwide. G$ is the native token of the GoodDollar ecosystem.', circulatingSupply: 1_470_000_000, maxSupply: null },
  'LINK': { price: 14.85, change1h: -0.34, change24h: -1.23, change7d: -4.56, volume24h: 620_000_000, marketCap: 8_700_000_000, description: 'Chainlink is a decentralized oracle network that connects smart contracts to real-world data, APIs, and payment systems.', circulatingSupply: 587_000_000, maxSupply: 1_000_000_000 },
  'UNI': { price: 7.92, change1h: -0.56, change24h: -2.45, change7d: -6.12, volume24h: 210_000_000, marketCap: 4_700_000_000, description: 'Uniswap is the leading decentralized exchange protocol on Ethereum, pioneering the automated market maker (AMM) model for trustless token swaps.', circulatingSupply: 600_000_000, maxSupply: 1_000_000_000 },
  'AAVE': { price: 89.50, change1h: 0.45, change24h: 3.78, change7d: 8.90, volume24h: 180_000_000, marketCap: 1_300_000_000, description: 'Aave is a decentralized lending and borrowing protocol where users can earn interest on deposits and take overcollateralized loans.', circulatingSupply: 14_900_000, maxSupply: 16_000_000 },
  'ARB': { price: 1.18, change1h: -0.12, change24h: -0.56, change7d: -2.34, volume24h: 520_000_000, marketCap: 3_400_000_000, description: 'Arbitrum is an Ethereum Layer 2 scaling solution using optimistic rollups to deliver faster, cheaper transactions while inheriting Ethereum security.', circulatingSupply: 2_870_000_000, maxSupply: 10_000_000_000 },
  'OP': { price: 2.45, change1h: 0.67, change24h: 4.12, change7d: 9.23, volume24h: 340_000_000, marketCap: 2_800_000_000, description: 'Optimism is an Ethereum Layer 2 using optimistic rollups, powering the OP Stack framework that GoodDollar L2 is built on.', circulatingSupply: 1_140_000_000, maxSupply: 4_294_967_296 },
  'MKR': { price: 2_814.00, change1h: 0.23, change24h: 1.89, change7d: 4.56, volume24h: 95_000_000, marketCap: 2_600_000_000, description: 'Maker is the governance token of MakerDAO, the protocol behind the DAI stablecoin. MKR holders vote on risk parameters and protocol upgrades.', circulatingSupply: 920_000, maxSupply: 1_005_577 },
  'COMP': { price: 49.80, change1h: -0.78, change24h: -3.21, change7d: -7.89, volume24h: 72_000_000, marketCap: 420_000_000, description: 'Compound is a DeFi lending protocol that lets users supply and borrow crypto assets with algorithmically determined interest rates.', circulatingSupply: 8_400_000, maxSupply: 10_000_000 },
  'SNX': { price: 2.95, change1h: -0.23, change24h: -1.78, change7d: -5.34, volume24h: 45_000_000, marketCap: 930_000_000, description: 'Synthetix is a derivatives protocol that enables the creation of synthetic assets (Synths) tracking the value of real-world assets on-chain.', circulatingSupply: 316_000_000, maxSupply: null },
  'CRV': { price: 0.58, change1h: 0.89, change24h: 6.34, change7d: 14.20, volume24h: 185_000_000, marketCap: 710_000_000, description: 'Curve is a DEX optimized for stablecoin and pegged-asset swaps, offering low slippage and low fees through specialized bonding curves.', circulatingSupply: 1_220_000_000, maxSupply: 3_303_030_299 },
  'LDO': { price: 2.18, change1h: 0.15, change24h: 2.01, change7d: 5.67, volume24h: 120_000_000, marketCap: 1_900_000_000, description: 'Lido is the largest liquid staking protocol, letting users stake ETH and receive stETH — a liquid token that accrues staking rewards automatically.', circulatingSupply: 890_000_000, maxSupply: 1_000_000_000 },
  'MATIC': { price: 0.71, change1h: -0.05, change24h: -0.89, change7d: -3.45, volume24h: 390_000_000, marketCap: 6_600_000_000, description: 'Polygon is a multi-chain scaling framework for Ethereum, offering sidechains and Layer 2 solutions for faster and cheaper transactions.', circulatingSupply: 9_280_000_000, maxSupply: 10_000_000_000 },
  'WETH': { price: 3012.45, change1h: 0.12, change24h: 2.34, change7d: 5.81, volume24h: 2_100_000_000, marketCap: 10_200_000_000, description: 'Wrapped Ether is an ERC-20 compatible version of ETH, used in DeFi protocols that require a standard token interface.', circulatingSupply: 3_390_000, maxSupply: null },
}

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

function generateSparkline(price: number, change24h: number, symbol: string): number[] {
  const rng = seededRandom(hashString(symbol))
  const weeklyChange = change24h * 3
  const startPrice = price / (1 + weeklyChange / 100)
  const points: number[] = [startPrice]
  for (let i = 1; i <= 6; i++) {
    const progress = i / 6
    const trend = startPrice + (price - startPrice) * progress
    const noise = (rng() - 0.5) * price * 0.03
    points.push(Math.max(trend + noise, price * 0.01))
  }
  return points
}

export function getTokenMarketData(): TokenMarketData[] {
  return TOKENS
    .filter(t => MOCK_MARKET_DATA[t.symbol])
    .map(t => {
      const d = MOCK_MARKET_DATA[t.symbol]
      return {
        ...t,
        price: d.price,
        change1h: d.change1h,
        change24h: d.change24h,
        change7d: d.change7d,
        volume24h: d.volume24h,
        marketCap: d.marketCap,
        sparkline7d: generateSparkline(d.price, d.change24h, t.symbol),
        description: d.description,
        circulatingSupply: d.circulatingSupply,
        maxSupply: d.maxSupply,
      }
    })
    .sort((a, b) => b.marketCap - a.marketCap)
}

export function getTokenBySymbol(symbol: string): TokenMarketData | undefined {
  const all = getTokenMarketData()
  return all.find(t => t.symbol.toLowerCase() === symbol.toLowerCase())
}

export function formatPrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
  if (price >= 1) return `$${price.toFixed(2)}`
  if (price >= 0.01) return `$${price.toFixed(4)}`
  return `$${price.toFixed(6)}`
}

export function formatVolume(vol: number): string {
  if (vol >= 1e12) return `$${(vol / 1e12).toFixed(2)}T`
  if (vol >= 1e9) return `$${(vol / 1e9).toFixed(2)}B`
  if (vol >= 1e6) return `$${(vol / 1e6).toFixed(1)}M`
  if (vol >= 1e3) return `$${(vol / 1e3).toFixed(0)}K`
  return `$${vol.toFixed(0)}`
}

export function formatMarketCap(cap: number): string {
  return formatVolume(cap)
}

export { TOKEN_COLORS }
