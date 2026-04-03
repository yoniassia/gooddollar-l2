import { describe, it, expect } from 'vitest'
import { formatPrice, formatVolume, getTokenBySymbol, getTokenMarketData } from '@/lib/marketData'

describe('formatPrice', () => {
  it('formats large prices with locale comma separators', () => {
    const result = formatPrice(60125.80)
    expect(result).toMatch(/^\$60,?125/)
  })

  it('formats mid-range prices with 2 decimals', () => {
    expect(formatPrice(3.45)).toBe('$3.45')
  })

  it('formats small prices with 4 decimals', () => {
    expect(formatPrice(0.05)).toBe('$0.0500')
  })

  it('formats very small prices with 6 decimals', () => {
    expect(formatPrice(0.0001)).toBe('$0.000100')
  })
})

describe('formatVolume', () => {
  it('formats trillions', () => {
    expect(formatVolume(1.5e12)).toBe('$1.50T')
  })

  it('formats billions', () => {
    expect(formatVolume(2_450_000_000)).toBe('$2.45B')
  })

  it('formats millions', () => {
    expect(formatVolume(1_200_000)).toBe('$1.2M')
  })

  it('formats thousands', () => {
    expect(formatVolume(8500)).toBe('$9K')
  })

  it('formats sub-thousand values', () => {
    expect(formatVolume(123)).toBe('$123')
  })
})

describe('getTokenMarketData', () => {
  it('returns an array of tokens', () => {
    const data = getTokenMarketData()
    expect(data.length).toBeGreaterThan(0)
  })

  it('each token has required fields', () => {
    const data = getTokenMarketData()
    for (const token of data) {
      expect(token.symbol).toBeTruthy()
      expect(token.name).toBeTruthy()
      expect(typeof token.price).toBe('number')
    }
  })
})

describe('getTokenBySymbol', () => {
  it('returns token when found', () => {
    const token = getTokenBySymbol('ETH')
    expect(token).toBeDefined()
    expect(token?.symbol).toBe('ETH')
  })

  it('returns undefined for unknown symbol', () => {
    expect(getTokenBySymbol('NOTREAL')).toBeUndefined()
  })
})
