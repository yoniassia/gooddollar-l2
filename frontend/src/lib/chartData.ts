export interface OHLCData {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

function generateOHLC(basePrice: number, days: number, volatility: number = 0.02): OHLCData[] {
  const data: OHLCData[] = []
  let price = basePrice * (0.85 + Math.random() * 0.15)
  const now = new Date()

  for (let i = days; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    const change = (Math.random() - 0.48) * volatility * price
    const open = price
    const close = price + change
    const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5)
    const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5)
    const volume = Math.floor(1_000_000 + Math.random() * 50_000_000)

    data.push({ time: dateStr, open, high, low, close, volume })
    price = close
  }

  return data
}

const CHART_CACHE = new Map<string, Map<string, OHLCData[]>>()

export type Timeframe = '1D' | '1W' | '1M' | '3M' | '1Y'

const TIMEFRAME_DAYS: Record<Timeframe, number> = {
  '1D': 1,
  '1W': 7,
  '1M': 30,
  '3M': 90,
  '1Y': 365,
}

export function getChartData(symbol: string, timeframe: Timeframe, basePrice: number): OHLCData[] {
  if (!CHART_CACHE.has(symbol)) {
    CHART_CACHE.set(symbol, new Map())
  }
  const symbolCache = CHART_CACHE.get(symbol)!
  if (!symbolCache.has(timeframe)) {
    symbolCache.set(timeframe, generateOHLC(basePrice, TIMEFRAME_DAYS[timeframe]))
  }
  return symbolCache.get(timeframe)!
}

export interface ProbabilityPoint {
  time: string
  value: number
}

export function generateProbabilityHistory(currentProb: number, days: number): ProbabilityPoint[] {
  const data: ProbabilityPoint[] = []
  let prob = 0.3 + Math.random() * 0.4
  const now = new Date()

  for (let i = days; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    const drift = (currentProb - prob) * 0.02
    const noise = (Math.random() - 0.5) * 0.06
    prob = Math.max(0.01, Math.min(0.99, prob + drift + noise))

    data.push({ time: dateStr, value: prob })
  }

  if (data.length > 0) {
    data[data.length - 1].value = currentProb
  }

  return data
}
