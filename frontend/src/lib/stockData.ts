export interface Stock {
  ticker: string
  name: string
  sector: string
  price: number
  change24h: number
  volume24h: number
  marketCap: number
  high52w: number
  low52w: number
  sparkline7d: number[]
  peRatio: number
  eps: number
  dividendYield: number
  avgVolume: number
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

function generateSparkline(price: number, change24h: number, ticker: string): number[] {
  const rng = seededRandom(hashString(ticker + '-stock'))
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

interface StockSeed {
  ticker: string
  name: string
  sector: string
  price: number
  change24h: number
  volume24h: number
  marketCap: number
  high52w: number
  low52w: number
  peRatio: number
  eps: number
  dividendYield: number
  avgVolume: number
}

const STOCK_SEEDS: StockSeed[] = [
  { ticker: 'AAPL', name: 'Apple Inc.', sector: 'Technology', price: 178.72, change24h: 1.24, volume24h: 58_300_000, marketCap: 2_780_000_000_000, high52w: 199.62, low52w: 143.88, peRatio: 29.4, eps: 6.08, dividendYield: 0.54, avgVolume: 55_200_000 },
  { ticker: 'TSLA', name: 'Tesla Inc.', sector: 'Automotive', price: 248.50, change24h: -2.18, volume24h: 112_500_000, marketCap: 790_000_000_000, high52w: 299.29, low52w: 138.80, peRatio: 67.2, eps: 3.70, dividendYield: 0, avgVolume: 108_000_000 },
  { ticker: 'NVDA', name: 'NVIDIA Corp.', sector: 'Technology', price: 875.30, change24h: 3.45, volume24h: 42_800_000, marketCap: 2_160_000_000_000, high52w: 974.00, low52w: 373.56, peRatio: 68.5, eps: 12.78, dividendYield: 0.04, avgVolume: 40_500_000 },
  { ticker: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology', price: 415.60, change24h: 0.87, volume24h: 22_100_000, marketCap: 3_090_000_000_000, high52w: 430.82, low52w: 309.45, peRatio: 36.8, eps: 11.30, dividendYield: 0.72, avgVolume: 21_400_000 },
  { ticker: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer', price: 182.15, change24h: -0.54, volume24h: 48_600_000, marketCap: 1_900_000_000_000, high52w: 191.70, low52w: 118.35, peRatio: 44.1, eps: 4.13, dividendYield: 0, avgVolume: 46_800_000 },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', price: 155.80, change24h: 1.92, volume24h: 25_300_000, marketCap: 1_940_000_000_000, high52w: 163.41, low52w: 115.83, peRatio: 25.6, eps: 6.08, dividendYield: 0, avgVolume: 24_100_000 },
  { ticker: 'META', name: 'Meta Platforms', sector: 'Technology', price: 503.25, change24h: -1.35, volume24h: 17_800_000, marketCap: 1_280_000_000_000, high52w: 542.79, low52w: 274.38, peRatio: 23.9, eps: 21.06, dividendYield: 0.40, avgVolume: 16_900_000 },
  { ticker: 'JPM', name: 'JPMorgan Chase', sector: 'Finance', price: 198.40, change24h: 0.68, volume24h: 9_200_000, marketCap: 572_000_000_000, high52w: 205.88, low52w: 144.34, peRatio: 11.4, eps: 17.41, dividendYield: 2.32, avgVolume: 9_800_000 },
  { ticker: 'V', name: 'Visa Inc.', sector: 'Finance', price: 279.90, change24h: 0.42, volume24h: 6_800_000, marketCap: 574_000_000_000, high52w: 290.96, low52w: 227.68, peRatio: 30.2, eps: 9.28, dividendYield: 0.80, avgVolume: 7_100_000 },
  { ticker: 'DIS', name: 'Walt Disney Co.', sector: 'Entertainment', price: 112.35, change24h: -0.91, volume24h: 11_400_000, marketCap: 205_000_000_000, high52w: 123.74, low52w: 78.73, peRatio: 35.8, eps: 3.14, dividendYield: 0, avgVolume: 12_300_000 },
  { ticker: 'NFLX', name: 'Netflix Inc.', sector: 'Entertainment', price: 628.90, change24h: 2.67, volume24h: 5_100_000, marketCap: 272_000_000_000, high52w: 639.00, low52w: 344.73, peRatio: 41.6, eps: 15.12, dividendYield: 0, avgVolume: 5_400_000 },
  { ticker: 'AMD', name: 'Advanced Micro Devices', sector: 'Technology', price: 164.80, change24h: -1.78, volume24h: 52_600_000, marketCap: 266_000_000_000, high52w: 227.30, low52w: 93.12, peRatio: 184.3, eps: 0.89, dividendYield: 0, avgVolume: 50_100_000 },
]

const MOCK_STOCKS: Stock[] = STOCK_SEEDS.map(s => ({
  ...s,
  sparkline7d: generateSparkline(s.price, s.change24h, s.ticker),
}))

export function getStockData(): Stock[] {
  return [...MOCK_STOCKS].sort((a, b) => b.marketCap - a.marketCap)
}

export function getStockByTicker(ticker: string): Stock | undefined {
  return MOCK_STOCKS.find(s => s.ticker === ticker.toUpperCase())
}

export function getAllTickers(): string[] {
  return MOCK_STOCKS.map(s => s.ticker)
}

export function formatStockPrice(price: number): string {
  return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatLargeNumber(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

export interface PortfolioHolding {
  ticker: string
  shares: number
  avgCost: number
  currentPrice: number
  collateralDeposited: number
  collateralRequired: number
}

export interface TradeRecord {
  id: string
  ticker: string
  side: 'buy' | 'sell'
  shares: number
  price: number
  timestamp: number
  pnl: number
}

const MOCK_HOLDINGS: PortfolioHolding[] = [
  { ticker: 'AAPL', shares: 5.5, avgCost: 172.30, currentPrice: 178.72, collateralDeposited: 1500, collateralRequired: 948.96 },
  { ticker: 'TSLA', shares: 2.0, avgCost: 260.00, currentPrice: 248.50, collateralDeposited: 800, collateralRequired: 497.00 },
  { ticker: 'NVDA', shares: 1.2, avgCost: 810.00, currentPrice: 875.30, collateralDeposited: 1600, collateralRequired: 1050.36 },
  { ticker: 'GOOGL', shares: 8.0, avgCost: 148.50, currentPrice: 155.80, collateralDeposited: 2000, collateralRequired: 1246.40 },
]

const MOCK_TRADES: TradeRecord[] = [
  { id: 't1', ticker: 'AAPL', side: 'buy', shares: 3.0, price: 170.50, timestamp: Date.now() - 86400000 * 2, pnl: 0 },
  { id: 't2', ticker: 'TSLA', side: 'buy', shares: 2.0, price: 260.00, timestamp: Date.now() - 86400000 * 3, pnl: 0 },
  { id: 't3', ticker: 'NVDA', side: 'buy', shares: 1.2, price: 810.00, timestamp: Date.now() - 86400000 * 5, pnl: 0 },
  { id: 't4', ticker: 'AAPL', side: 'buy', shares: 2.5, price: 174.50, timestamp: Date.now() - 86400000 * 1, pnl: 0 },
  { id: 't5', ticker: 'GOOGL', side: 'buy', shares: 8.0, price: 148.50, timestamp: Date.now() - 86400000 * 7, pnl: 0 },
  { id: 't6', ticker: 'AMD', side: 'buy', shares: 4.0, price: 155.20, timestamp: Date.now() - 86400000 * 10, pnl: 0 },
  { id: 't7', ticker: 'AMD', side: 'sell', shares: 4.0, price: 164.80, timestamp: Date.now() - 86400000 * 1, pnl: 38.40 },
]

export function getPortfolioHoldings(): PortfolioHolding[] {
  return MOCK_HOLDINGS
}

export function getTradeHistory(): TradeRecord[] {
  return [...MOCK_TRADES].sort((a, b) => b.timestamp - a.timestamp)
}

export function getPortfolioSummary() {
  const holdings = MOCK_HOLDINGS
  const totalValue = holdings.reduce((sum, h) => sum + h.shares * h.currentPrice, 0)
  const totalCost = holdings.reduce((sum, h) => sum + h.shares * h.avgCost, 0)
  const totalCollateral = holdings.reduce((sum, h) => sum + h.collateralDeposited, 0)
  const totalRequired = holdings.reduce((sum, h) => sum + h.collateralRequired, 0)
  const unrealizedPnl = totalValue - totalCost
  const pnlPercent = totalCost > 0 ? (unrealizedPnl / totalCost) * 100 : 0
  const healthRatio = totalRequired > 0 ? (totalCollateral / totalRequired) * 100 : 0

  return { totalValue, totalCost, totalCollateral, totalRequired, unrealizedPnl, pnlPercent, healthRatio }
}
