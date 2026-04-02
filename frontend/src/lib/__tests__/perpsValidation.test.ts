import { describe, it, expect } from 'vitest'

function sanitizePositiveInput(value: string): string {
  if (value === '' || value === '.') return value
  const num = parseFloat(value)
  if (isNaN(num)) return ''
  if (num < 0) return ''
  return value
}

describe('sanitizePositiveInput', () => {
  it('allows empty string', () => {
    expect(sanitizePositiveInput('')).toBe('')
  })

  it('allows decimal point alone', () => {
    expect(sanitizePositiveInput('.')).toBe('.')
  })

  it('allows positive numbers', () => {
    expect(sanitizePositiveInput('5')).toBe('5')
    expect(sanitizePositiveInput('0.01')).toBe('0.01')
    expect(sanitizePositiveInput('100')).toBe('100')
  })

  it('allows zero', () => {
    expect(sanitizePositiveInput('0')).toBe('0')
    expect(sanitizePositiveInput('0.00')).toBe('0.00')
  })

  it('rejects negative numbers', () => {
    expect(sanitizePositiveInput('-5')).toBe('')
    expect(sanitizePositiveInput('-0.01')).toBe('')
    expect(sanitizePositiveInput('-100')).toBe('')
  })

  it('rejects non-numeric input', () => {
    expect(sanitizePositiveInput('abc')).toBe('')
    expect(sanitizePositiveInput('--')).toBe('')
  })
})

describe('margin validation logic', () => {
  it('detects when notional exceeds available margin', () => {
    const availableMargin = 7285.32
    const markPrice = 60125.80
    const leverage = 10
    const size = 5

    const notional = size * markPrice
    const marginRequired = notional / leverage
    const exceedsMargin = marginRequired > availableMargin

    expect(exceedsMargin).toBe(true)
  })

  it('allows when notional is within available margin', () => {
    const availableMargin = 7285.32
    const markPrice = 60125.80
    const leverage = 10
    const size = 0.01

    const notional = size * markPrice
    const marginRequired = notional / leverage
    const exceedsMargin = marginRequired > availableMargin

    expect(exceedsMargin).toBe(false)
  })
})
