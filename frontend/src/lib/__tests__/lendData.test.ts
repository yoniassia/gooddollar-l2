import { describe, it, expect } from 'vitest'
import {
  getAvailableLiquidity,
  getUtilizationRate,
  formatAPY,
  formatUSD,
  formatHealthFactor,
  healthFactorColor,
  type LendReserve,
} from '@/lib/lendData'

function makeReserve(totalSupplied: number, totalBorrowed: number): LendReserve {
  return {
    symbol: 'TEST',
    name: 'Test',
    totalSupplied,
    totalBorrowed,
    supplyAPY: 0.05,
    borrowAPY: 0.08,
    utilizationRate: totalSupplied > 0 ? totalBorrowed / totalSupplied : 0,
    ltv: 0.75,
    liquidationThreshold: 0.80,
    price: 1,
    icon: '',
  } as LendReserve
}

describe('getAvailableLiquidity', () => {
  it('returns supplied minus borrowed', () => {
    const reserve = makeReserve(1000, 600)
    expect(getAvailableLiquidity(reserve)).toBe(400)
  })

  it('returns 0 when fully utilized', () => {
    const reserve = makeReserve(1000, 1000)
    expect(getAvailableLiquidity(reserve)).toBe(0)
  })
})

describe('getUtilizationRate', () => {
  it('computes borrowedAmount / supplied', () => {
    const reserve = makeReserve(1000, 600)
    expect(getUtilizationRate(reserve)).toBeCloseTo(0.6)
  })

  it('returns 0 when nothing supplied', () => {
    const reserve = makeReserve(0, 0)
    expect(getUtilizationRate(reserve)).toBe(0)
  })

  it('returns 1 when fully utilized', () => {
    const reserve = makeReserve(500, 500)
    expect(getUtilizationRate(reserve)).toBe(1)
  })
})

describe('formatAPY', () => {
  it('formats 5% APY', () => {
    expect(formatAPY(0.05)).toBe('5.00%')
  })

  it('formats 0% APY', () => {
    expect(formatAPY(0)).toBe('0.00%')
  })

  it('formats fractional APY', () => {
    expect(formatAPY(0.0624)).toBe('6.24%')
  })
})

describe('formatUSD', () => {
  it('formats small values with two decimals', () => {
    expect(formatUSD(123.45)).toBe('$123.45')
  })

  it('formats thousands as K', () => {
    expect(formatUSD(5000)).toBe('$5.00K')
  })

  it('formats millions as M', () => {
    expect(formatUSD(2_500_000)).toBe('$2.50M')
  })

  it('formats billions as B', () => {
    expect(formatUSD(1_200_000_000)).toBe('$1.20B')
  })
})

describe('formatHealthFactor', () => {
  it('returns infinity symbol for Infinity', () => {
    expect(formatHealthFactor(Infinity)).toBe('∞')
  })

  it('formats normal health factor', () => {
    expect(formatHealthFactor(1.75)).toBe('1.75')
  })

  it('formats critical health factor', () => {
    expect(formatHealthFactor(1.05)).toBe('1.05')
  })
})

describe('healthFactorColor', () => {
  it('returns green for Infinity', () => {
    expect(healthFactorColor(Infinity)).toBe('text-green-400')
  })

  it('returns green for hf >= 2', () => {
    expect(healthFactorColor(2.5)).toBe('text-green-400')
  })

  it('returns goodgreen for hf between 1.5 and 2', () => {
    expect(healthFactorColor(1.8)).toBe('text-goodgreen')
  })

  it('returns yellow for hf between 1.2 and 1.5', () => {
    expect(healthFactorColor(1.3)).toBe('text-yellow-400')
  })

  it('returns red for hf below 1.2', () => {
    expect(healthFactorColor(1.1)).toBe('text-red-400')
  })
})
