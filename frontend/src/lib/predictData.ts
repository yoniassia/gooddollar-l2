export type MarketCategory = 'Crypto' | 'Politics' | 'Sports' | 'AI & Tech' | 'World Events' | 'Culture'

export interface PredictionMarket {
  id: string
  question: string
  category: MarketCategory
  yesPrice: number
  volume: number
  liquidity: number
  endDate: string
  resolved: boolean
  outcome?: 'yes' | 'no'
  resolutionSource: string
  createdAt: string
  totalShares: number
}

const MOCK_MARKETS: PredictionMarket[] = [
  { id: 'btc-100k-2025', question: 'Will Bitcoin reach $100K by end of 2025?', category: 'Crypto', yesPrice: 0.72, volume: 2_450_000, liquidity: 890_000, endDate: '2025-12-31', resolved: false, resolutionSource: 'CoinGecko BTC/USD price', createdAt: '2025-01-15', totalShares: 1_200_000 },
  { id: 'eth-etf-approval', question: 'Will an Ethereum spot ETF be approved in 2025?', category: 'Crypto', yesPrice: 0.85, volume: 1_800_000, liquidity: 650_000, endDate: '2025-12-31', resolved: false, resolutionSource: 'SEC filing records', createdAt: '2025-02-01', totalShares: 900_000 },
  { id: 'us-election-2028', question: 'Will the Democratic candidate win the 2028 US Presidential Election?', category: 'Politics', yesPrice: 0.48, volume: 5_200_000, liquidity: 2_100_000, endDate: '2028-11-05', resolved: false, resolutionSource: 'Associated Press election call', createdAt: '2025-01-01', totalShares: 3_500_000 },
  { id: 'fed-rate-cut-q2', question: 'Will the Fed cut rates in Q2 2025?', category: 'Politics', yesPrice: 0.62, volume: 980_000, liquidity: 420_000, endDate: '2025-06-30', resolved: false, resolutionSource: 'Federal Reserve press release', createdAt: '2025-03-01', totalShares: 500_000 },
  { id: 'champions-league-2025', question: 'Will Real Madrid win Champions League 2025?', category: 'Sports', yesPrice: 0.31, volume: 1_200_000, liquidity: 380_000, endDate: '2025-06-01', resolved: false, resolutionSource: 'UEFA official results', createdAt: '2025-02-15', totalShares: 650_000 },
  { id: 'nba-finals-celtics', question: 'Will the Celtics win the 2025 NBA Finals?', category: 'Sports', yesPrice: 0.44, volume: 890_000, liquidity: 310_000, endDate: '2025-06-20', resolved: false, resolutionSource: 'NBA official results', createdAt: '2025-03-10', totalShares: 420_000 },
  { id: 'gpt5-release', question: 'Will OpenAI release GPT-5 before July 2025?', category: 'AI & Tech', yesPrice: 0.38, volume: 3_100_000, liquidity: 1_200_000, endDate: '2025-07-01', resolved: false, resolutionSource: 'OpenAI official announcement', createdAt: '2025-01-20', totalShares: 1_800_000 },
  { id: 'agi-by-2030', question: 'Will AGI be achieved by 2030?', category: 'AI & Tech', yesPrice: 0.15, volume: 4_500_000, liquidity: 1_800_000, endDate: '2030-12-31', resolved: false, resolutionSource: 'Expert consensus panel', createdAt: '2025-01-01', totalShares: 2_800_000 },
  { id: 'apple-car', question: 'Will Apple announce an autonomous vehicle in 2025?', category: 'AI & Tech', yesPrice: 0.08, volume: 750_000, liquidity: 280_000, endDate: '2025-12-31', resolved: false, resolutionSource: 'Apple official announcement', createdAt: '2025-02-10', totalShares: 380_000 },
  { id: 'climate-1-5c', question: 'Will global temperature rise exceed 1.5°C in 2025?', category: 'World Events', yesPrice: 0.67, volume: 620_000, liquidity: 250_000, endDate: '2025-12-31', resolved: false, resolutionSource: 'NASA GISS temperature data', createdAt: '2025-01-05', totalShares: 290_000 },
  { id: 'who-pandemic-declaration', question: 'Will WHO declare a new pandemic before 2026?', category: 'World Events', yesPrice: 0.12, volume: 1_400_000, liquidity: 580_000, endDate: '2026-01-01', resolved: false, resolutionSource: 'WHO official declaration', createdAt: '2025-03-01', totalShares: 720_000 },
  { id: 'taylor-swift-retire', question: 'Will Taylor Swift announce retirement in 2025?', category: 'Culture', yesPrice: 0.03, volume: 920_000, liquidity: 350_000, endDate: '2025-12-31', resolved: false, resolutionSource: 'Official announcement via social media or press', createdAt: '2025-02-20', totalShares: 480_000 },
  { id: 'gd-1m-claimers', question: 'Will GoodDollar reach 1M daily claimers?', category: 'Crypto', yesPrice: 0.22, volume: 340_000, liquidity: 120_000, endDate: '2025-12-31', resolved: false, resolutionSource: 'GoodDollar dashboard data', createdAt: '2025-03-15', totalShares: 180_000 },
  { id: 'mars-mission-2026', question: 'Will SpaceX launch a crewed Mars mission by 2026?', category: 'World Events', yesPrice: 0.05, volume: 2_800_000, liquidity: 1_100_000, endDate: '2026-12-31', resolved: false, resolutionSource: 'SpaceX official announcements + NASA confirmation', createdAt: '2025-01-10', totalShares: 1_500_000 },
]

export const ALL_CATEGORIES: MarketCategory[] = ['Crypto', 'Politics', 'Sports', 'AI & Tech', 'World Events', 'Culture']

export type SortOption = 'trending' | 'newest' | 'volume' | 'ending'

export function getMarkets(): PredictionMarket[] {
  return [...MOCK_MARKETS]
}

export function getMarketById(id: string): PredictionMarket | undefined {
  return MOCK_MARKETS.find(m => m.id === id)
}

export function filterAndSortMarkets(
  markets: PredictionMarket[],
  category: MarketCategory | 'All',
  sort: SortOption,
  query: string,
): PredictionMarket[] {
  let result = [...markets]

  if (category !== 'All') {
    result = result.filter(m => m.category === category)
  }

  if (query.trim()) {
    const q = query.trim().toLowerCase()
    result = result.filter(m => m.question.toLowerCase().includes(q))
  }

  switch (sort) {
    case 'trending':
      result.sort((a, b) => b.volume - a.volume)
      break
    case 'newest':
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      break
    case 'volume':
      result.sort((a, b) => b.volume - a.volume)
      break
    case 'ending':
      result.sort((a, b) => {
        const aExpired = getMarketStatus(a.endDate) === 'expired'
        const bExpired = getMarketStatus(b.endDate) === 'expired'
        if (aExpired && !bExpired) return 1
        if (!aExpired && bExpired) return -1
        return new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
      })
      break
  }

  return result
}

export type MarketStatus = 'active' | 'ending-today' | 'expired'

export function getMarketStatus(endDate: string): MarketStatus {
  const end = new Date(endDate)
  const now = new Date()
  const msLeft = end.getTime() - now.getTime()
  if (msLeft < 0) return 'expired'
  if (msLeft < 24 * 60 * 60 * 1000) return 'ending-today'
  return 'active'
}

export function getDaysLeftLabel(endDate: string): string {
  const status = getMarketStatus(endDate)
  if (status === 'expired') return 'Expired'
  if (status === 'ending-today') return 'Ending today'
  const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return `${days}d left`
}

export function formatVolume(vol: number): string {
  if (vol >= 1e6) return `$${(vol / 1e6).toFixed(1)}M`
  if (vol >= 1e3) return `$${(vol / 1e3).toFixed(0)}K`
  return `$${vol.toFixed(0)}`
}

export interface UserPosition {
  marketId: string
  side: 'yes' | 'no'
  shares: number
  avgPrice: number
  currentPrice: number
}

export interface ResolvedPosition {
  marketId: string
  side: 'yes' | 'no'
  shares: number
  avgPrice: number
  outcome: 'yes' | 'no'
  payout: number
}

const MOCK_POSITIONS: UserPosition[] = [
  { marketId: 'btc-100k-2025', side: 'yes', shares: 500, avgPrice: 0.58, currentPrice: 0.72 },
  { marketId: 'gpt5-release', side: 'no', shares: 300, avgPrice: 0.55, currentPrice: 0.62 },
  { marketId: 'us-election-2028', side: 'yes', shares: 200, avgPrice: 0.42, currentPrice: 0.48 },
  { marketId: 'champions-league-2025', side: 'yes', shares: 150, avgPrice: 0.25, currentPrice: 0.31 },
]

const MOCK_RESOLVED: ResolvedPosition[] = [
  { marketId: 'eth-etf-approval', side: 'yes', shares: 400, avgPrice: 0.65, outcome: 'yes', payout: 400 },
]

export function getUserPositions(): UserPosition[] {
  return MOCK_POSITIONS
}

export function getResolvedPositions(): ResolvedPosition[] {
  return MOCK_RESOLVED
}

export function getPortfolioSummary() {
  const positions = MOCK_POSITIONS
  const totalInvested = positions.reduce((sum, p) => sum + p.shares * p.avgPrice, 0)
  const currentValue = positions.reduce((sum, p) => {
    const price = p.side === 'yes' ? p.currentPrice : 1 - p.currentPrice
    const cost = p.avgPrice
    return sum + p.shares * price + (price - cost) * 0
  }, 0)
  const unrealizedPnl = positions.reduce((sum, p) => {
    const current = p.side === 'yes' ? p.currentPrice : 1 - p.currentPrice
    return sum + p.shares * (current - p.avgPrice)
  }, 0)

  return { totalInvested, currentValue: totalInvested + unrealizedPnl, unrealizedPnl }
}
