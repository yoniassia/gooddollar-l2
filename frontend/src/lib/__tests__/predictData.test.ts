import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getMarketStatus, getDaysLeftLabel, filterAndSortMarkets, getMarkets } from '../predictData'

describe('getMarketStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-02T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "expired" for past dates', () => {
    expect(getMarketStatus('2025-12-31')).toBe('expired')
    expect(getMarketStatus('2026-04-01')).toBe('expired')
  })

  it('returns "ending-today" for dates within 24 hours', () => {
    expect(getMarketStatus('2026-04-03')).toBe('ending-today')
  })

  it('returns "active" for future dates', () => {
    expect(getMarketStatus('2026-04-10')).toBe('active')
    expect(getMarketStatus('2027-01-01')).toBe('active')
  })
})

describe('getDaysLeftLabel', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-02T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "Expired" for past dates', () => {
    expect(getDaysLeftLabel('2025-12-31')).toBe('Expired')
  })

  it('returns "Ending today" for dates within 24h', () => {
    expect(getDaysLeftLabel('2026-04-03')).toBe('Ending today')
  })

  it('returns "Xd left" for future dates', () => {
    expect(getDaysLeftLabel('2026-04-10')).toMatch(/^\d+d left$/)
  })
})

describe('filterAndSortMarkets - ending sort with expired', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-02T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('places expired markets after active ones when sorting by ending', () => {
    const markets = getMarkets()
    const sorted = filterAndSortMarkets(markets, 'All', 'ending', '')
    const statuses = sorted.map(m => getMarketStatus(m.endDate))
    const firstExpiredIdx = statuses.indexOf('expired')
    const lastActiveIdx = statuses.lastIndexOf('active')
    if (firstExpiredIdx !== -1 && lastActiveIdx !== -1) {
      expect(firstExpiredIdx).toBeGreaterThan(lastActiveIdx)
    }
  })
})
