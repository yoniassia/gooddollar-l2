export interface PerpPair {
  symbol: string
  baseAsset: string
  quoteAsset: string
  markPrice: number
  indexPrice: number
  change24h: number
  volume24h: number
  fundingRate: number
  nextFundingTime: number
  openInterest: number
  maxLeverage: number
}

const MOCK_PAIRS: PerpPair[] = [
  { symbol: 'BTC-USD', baseAsset: 'BTC', quoteAsset: 'USD', markPrice: 60125.80, indexPrice: 60118.50, change24h: 1.12, volume24h: 2_450_000_000, fundingRate: 0.0085, nextFundingTime: Date.now() + 4 * 3600 * 1000, openInterest: 890_000_000, maxLeverage: 50 },
  { symbol: 'ETH-USD', baseAsset: 'ETH', quoteAsset: 'USD', markPrice: 3012.45, indexPrice: 3010.20, change24h: 2.34, volume24h: 1_200_000_000, fundingRate: 0.0062, nextFundingTime: Date.now() + 4 * 3600 * 1000, openInterest: 450_000_000, maxLeverage: 50 },
  { symbol: 'G$-USD', baseAsset: 'G$', quoteAsset: 'USD', markPrice: 0.0102, indexPrice: 0.0102, change24h: 5.67, volume24h: 8_500_000, fundingRate: 0.0120, nextFundingTime: Date.now() + 4 * 3600 * 1000, openInterest: 3_200_000, maxLeverage: 20 },
  { symbol: 'SOL-USD', baseAsset: 'SOL', quoteAsset: 'USD', markPrice: 148.75, indexPrice: 148.60, change24h: -1.45, volume24h: 680_000_000, fundingRate: -0.0034, nextFundingTime: Date.now() + 4 * 3600 * 1000, openInterest: 280_000_000, maxLeverage: 50 },
  { symbol: 'LINK-USD', baseAsset: 'LINK', quoteAsset: 'USD', markPrice: 14.85, indexPrice: 14.82, change24h: -1.23, volume24h: 120_000_000, fundingRate: -0.0012, nextFundingTime: Date.now() + 4 * 3600 * 1000, openInterest: 85_000_000, maxLeverage: 30 },
]

export function getPairs(): PerpPair[] {
  return [...MOCK_PAIRS]
}

export function getPairBySymbol(symbol: string): PerpPair | undefined {
  return MOCK_PAIRS.find(p => p.symbol === symbol)
}

export interface AccountSummaryData {
  balance: number
  equity: number
  unrealizedPnl: number
  marginUsed: number
  availableMargin: number
  marginRatio: number
}

export function getAccountSummary(): AccountSummaryData {
  return {
    balance: 10_000,
    equity: 10_485.32,
    unrealizedPnl: 485.32,
    marginUsed: 3_200,
    availableMargin: 7_285.32,
    marginRatio: 0.305,
  }
}

export interface OpenPosition {
  pair: string
  side: 'long' | 'short'
  size: number
  leverage: number
  entryPrice: number
  markPrice: number
  liquidationPrice: number
  unrealizedPnl: number
  margin: number
  marginMode: 'cross' | 'isolated'
}

const MOCK_POSITIONS: OpenPosition[] = [
  { pair: 'BTC-USD', side: 'long', size: 0.05, leverage: 10, entryPrice: 59200, markPrice: 60125.80, liquidationPrice: 53550, unrealizedPnl: 46.29, margin: 296, marginMode: 'cross' },
  { pair: 'ETH-USD', side: 'long', size: 2.0, leverage: 5, entryPrice: 2850, markPrice: 3012.45, liquidationPrice: 2310, unrealizedPnl: 324.90, margin: 1140, marginMode: 'cross' },
  { pair: 'SOL-USD', side: 'short', size: 10, leverage: 3, entryPrice: 155.20, markPrice: 148.75, liquidationPrice: 201.50, unrealizedPnl: 64.50, margin: 517.33, marginMode: 'isolated' },
]

export function getOpenPositions(): OpenPosition[] {
  return MOCK_POSITIONS
}

export interface PendingOrder {
  id: string
  pair: string
  type: 'limit' | 'stop-limit'
  side: 'long' | 'short'
  price: number
  triggerPrice?: number
  size: number
  leverage: number
  createdAt: number
}

const MOCK_ORDERS: PendingOrder[] = [
  { id: 'o1', pair: 'BTC-USD', type: 'limit', side: 'long', price: 58500, size: 0.02, leverage: 10, createdAt: Date.now() - 3600000 },
  { id: 'o2', pair: 'ETH-USD', type: 'stop-limit', side: 'short', price: 3200, triggerPrice: 3180, size: 1.0, leverage: 5, createdAt: Date.now() - 7200000 },
]

export function getPendingOrders(): PendingOrder[] {
  return MOCK_ORDERS
}

export interface TradeHistoryRecord {
  id: string
  pair: string
  side: 'long' | 'short'
  type: 'market' | 'limit'
  size: number
  price: number
  fee: number
  pnl: number
  timestamp: number
}

const MOCK_TRADE_HISTORY: TradeHistoryRecord[] = [
  { id: 'th1', pair: 'BTC-USD', side: 'long', type: 'market', size: 0.05, price: 59200, fee: 1.48, pnl: 0, timestamp: Date.now() - 86400000 * 2 },
  { id: 'th2', pair: 'ETH-USD', side: 'long', type: 'limit', size: 2.0, price: 2850, fee: 1.14, pnl: 0, timestamp: Date.now() - 86400000 * 3 },
  { id: 'th3', pair: 'SOL-USD', side: 'short', type: 'market', size: 10, price: 155.20, fee: 0.78, pnl: 0, timestamp: Date.now() - 86400000 * 1 },
  { id: 'th4', pair: 'LINK-USD', side: 'long', type: 'market', size: 50, price: 13.20, fee: 0.33, pnl: 82.50, timestamp: Date.now() - 86400000 * 5 },
  { id: 'th5', pair: 'LINK-USD', side: 'long', type: 'limit', size: 50, price: 14.85, fee: 0.15, pnl: 0, timestamp: Date.now() - 86400000 * 5 },
]

export function getTradeHistory(): TradeHistoryRecord[] {
  return [...MOCK_TRADE_HISTORY].sort((a, b) => b.timestamp - a.timestamp)
}

export interface FundingPayment {
  pair: string
  amount: number
  rate: number
  timestamp: number
}

const MOCK_FUNDING: FundingPayment[] = [
  { pair: 'BTC-USD', amount: -2.55, rate: 0.0085, timestamp: Date.now() - 8 * 3600000 },
  { pair: 'ETH-USD', amount: -1.87, rate: 0.0062, timestamp: Date.now() - 8 * 3600000 },
  { pair: 'SOL-USD', amount: 0.51, rate: -0.0034, timestamp: Date.now() - 8 * 3600000 },
  { pair: 'BTC-USD', amount: -2.42, rate: 0.0081, timestamp: Date.now() - 16 * 3600000 },
  { pair: 'ETH-USD', amount: -1.73, rate: 0.0058, timestamp: Date.now() - 16 * 3600000 },
]

export function getFundingPayments(): FundingPayment[] {
  return [...MOCK_FUNDING].sort((a, b) => b.timestamp - a.timestamp)
}

export interface LeaderboardEntry {
  rank: number
  address: string
  pnl: number
  winRate: number
  totalTrades: number
  topPair: string
}

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, address: '0x1a2b...3c4d', pnl: 128_450, winRate: 0.72, totalTrades: 342, topPair: 'BTC-USD' },
  { rank: 2, address: '0x5e6f...7g8h', pnl: 95_200, winRate: 0.68, totalTrades: 518, topPair: 'ETH-USD' },
  { rank: 3, address: '0x9i0j...1k2l', pnl: 78_900, winRate: 0.65, totalTrades: 289, topPair: 'BTC-USD' },
  { rank: 4, address: '0x3m4n...5o6p', pnl: 62_100, winRate: 0.61, totalTrades: 421, topPair: 'SOL-USD' },
  { rank: 5, address: '0x7q8r...9s0t', pnl: 54_800, winRate: 0.59, totalTrades: 197, topPair: 'ETH-USD' },
  { rank: 6, address: '0xab12...cd34', pnl: 43_250, winRate: 0.63, totalTrades: 312, topPair: 'BTC-USD' },
  { rank: 7, address: '0xef56...gh78', pnl: 38_900, winRate: 0.57, totalTrades: 456, topPair: 'LINK-USD' },
  { rank: 8, address: '0xij90...kl12', pnl: 31_400, winRate: 0.55, totalTrades: 178, topPair: 'SOL-USD' },
  { rank: 9, address: '0xmn34...op56', pnl: 25_800, winRate: 0.52, totalTrades: 623, topPair: 'G$-USD' },
  { rank: 10, address: '0xqr78...st90', pnl: 19_200, winRate: 0.54, totalTrades: 145, topPair: 'BTC-USD' },
]

export function getLeaderboard(): LeaderboardEntry[] {
  return MOCK_LEADERBOARD
}

const PRICE_TIERS: [number, string][] = [
  [1e15, 'Q'],
  [1e12, 'T'],
  [1e9, 'B'],
  [1e6, 'M'],
]

export function formatPerpsPrice(price: number): string {
  const abs = Math.abs(price)
  const sign = price < 0 ? '-' : ''
  for (const [threshold, suffix] of PRICE_TIERS) {
    if (abs >= threshold) {
      const abbr = abs / threshold
      const decimals = abbr >= 100 ? 0 : abbr >= 10 ? 1 : 2
      return `${sign}$${abbr.toFixed(decimals)}${suffix}`
    }
  }
  if (abs >= 1000) return `${sign}$${abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  if (abs >= 1) return `${sign}$${abs.toFixed(2)}`
  if (abs >= 0.01) return `${sign}$${abs.toFixed(4)}`
  return `${sign}$${abs.toFixed(6)}`
}

export function formatLargeValue(n: number): string {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  for (const [threshold, suffix] of PRICE_TIERS) {
    if (abs >= threshold) {
      const abbr = abs / threshold
      const decimals = abbr >= 100 ? 0 : abbr >= 10 ? 1 : 2
      return `${sign}$${abbr.toFixed(decimals)}${suffix}`
    }
  }
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(0)}K`
  return `${sign}$${abs.toFixed(2)}`
}

export function formatFundingRate(rate: number): string {
  return `${rate >= 0 ? '+' : ''}${(rate * 100).toFixed(4)}%`
}

export function getFundingCountdown(nextTime: number): string {
  const diff = Math.max(0, nextTime - Date.now())
  const hours = Math.floor(diff / (3600 * 1000))
  const minutes = Math.floor((diff % (3600 * 1000)) / (60 * 1000))
  return `${hours}h ${minutes}m`
}
