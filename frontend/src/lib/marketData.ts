import { TOKENS, TOKEN_COLORS, type Token } from './tokens'

export interface TokenMarketData extends Token {
  price: number
  change1h: number
  change24h: number
  change7d: number
  volume24h: number
  marketCap: number
  sparkline7d: number[]
}

interface MockEntry {
  price: number
  change24h: number
  change1h: number
  change7d: number
  volume24h: number
  marketCap: number
}

const MOCK_MARKET_DATA: Record<string, MockEntry> = {
  'ETH': { price: 3012.45, change1h: 0.12, change24h: 2.34, change7d: 5.81, volume24h: 14_200_000_000, marketCap: 362_000_000_000 },
  'WBTC': { price: 60_125.80, change1h: 0.08, change24h: 1.12, change7d: 3.45, volume24h: 850_000_000, marketCap: 11_800_000_000 },
  'USDC': { price: 1.00, change1h: 0.00, change24h: 0.01, change7d: 0.02, volume24h: 7_400_000_000, marketCap: 32_000_000_000 },
  'USDT': { price: 1.00, change1h: -0.01, change24h: -0.01, change7d: 0.00, volume24h: 52_000_000_000, marketCap: 110_000_000_000 },
  'DAI': { price: 1.00, change1h: 0.00, change24h: 0.02, change7d: 0.01, volume24h: 280_000_000, marketCap: 5_300_000_000 },
  'G$': { price: 0.0102, change1h: 1.23, change24h: 5.67, change7d: 12.40, volume24h: 1_200_000, marketCap: 15_000_000 },
  'LINK': { price: 14.85, change1h: -0.34, change24h: -1.23, change7d: -4.56, volume24h: 620_000_000, marketCap: 8_700_000_000 },
  'UNI': { price: 7.92, change1h: -0.56, change24h: -2.45, change7d: -6.12, volume24h: 210_000_000, marketCap: 4_700_000_000 },
  'AAVE': { price: 89.50, change1h: 0.45, change24h: 3.78, change7d: 8.90, volume24h: 180_000_000, marketCap: 1_300_000_000 },
  'ARB': { price: 1.18, change1h: -0.12, change24h: -0.56, change7d: -2.34, volume24h: 520_000_000, marketCap: 3_400_000_000 },
  'OP': { price: 2.45, change1h: 0.67, change24h: 4.12, change7d: 9.23, volume24h: 340_000_000, marketCap: 2_800_000_000 },
  'MKR': { price: 2_814.00, change1h: 0.23, change24h: 1.89, change7d: 4.56, volume24h: 95_000_000, marketCap: 2_600_000_000 },
  'COMP': { price: 49.80, change1h: -0.78, change24h: -3.21, change7d: -7.89, volume24h: 72_000_000, marketCap: 420_000_000 },
  'SNX': { price: 2.95, change1h: -0.23, change24h: -1.78, change7d: -5.34, volume24h: 45_000_000, marketCap: 930_000_000 },
  'CRV': { price: 0.58, change1h: 0.89, change24h: 6.34, change7d: 14.20, volume24h: 185_000_000, marketCap: 710_000_000 },
  'LDO': { price: 2.18, change1h: 0.15, change24h: 2.01, change7d: 5.67, volume24h: 120_000_000, marketCap: 1_900_000_000 },
  'MATIC': { price: 0.71, change1h: -0.05, change24h: -0.89, change7d: -3.45, volume24h: 390_000_000, marketCap: 6_600_000_000 },
  'WETH': { price: 3012.45, change1h: 0.12, change24h: 2.34, change7d: 5.81, volume24h: 2_100_000_000, marketCap: 10_200_000_000 },
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
      }
    })
    .sort((a, b) => b.marketCap - a.marketCap)
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
