import { describe, it, expect } from 'vitest'
import { sanitizeNumericInput, formatAmount, compactAmount } from '../format'

describe('sanitizeNumericInput', () => {
  it('strips non-numeric characters', () => {
    expect(sanitizeNumericInput('abc123')).toBe('123')
    expect(sanitizeNumericInput('!@#$%')).toBe('')
    expect(sanitizeNumericInput('12.34.56')).toBe('12.3456')
  })

  it('limits to 20 characters', () => {
    expect(sanitizeNumericInput('123456789012345678901234')).toHaveLength(20)
  })

  it('strips leading zeros from integer inputs', () => {
    expect(sanitizeNumericInput('007')).toBe('7')
    expect(sanitizeNumericInput('000123')).toBe('123')
    expect(sanitizeNumericInput('00')).toBe('0')
    expect(sanitizeNumericInput('0')).toBe('0')
  })

  it('preserves valid zero-decimal patterns', () => {
    expect(sanitizeNumericInput('0.5')).toBe('0.5')
    expect(sanitizeNumericInput('0.001')).toBe('0.001')
    expect(sanitizeNumericInput('0.')).toBe('0.')
  })

  it('normalizes leading zeros before decimal', () => {
    expect(sanitizeNumericInput('00.5')).toBe('0.5')
    expect(sanitizeNumericInput('000.123')).toBe('0.123')
  })

  it('handles bare decimal point', () => {
    const result = sanitizeNumericInput('.')
    expect(result === '0.' || result === '.').toBeTruthy()
  })

  it('handles empty input', () => {
    expect(sanitizeNumericInput('')).toBe('')
  })

  it('passes through normal numbers', () => {
    expect(sanitizeNumericInput('123')).toBe('123')
    expect(sanitizeNumericInput('1.5')).toBe('1.5')
    expect(sanitizeNumericInput('999999')).toBe('999999')
  })
})

describe('formatAmount', () => {
  it('formats zero', () => {
    expect(formatAmount(0)).toBe('0')
  })

  it('formats large numbers with abbreviations', () => {
    expect(formatAmount(1500000)).toBe('1.5M')
    expect(formatAmount(2500000000)).toBe('2.5B')
    expect(formatAmount(1200000000000)).toBe('1.2T')
  })

  it('formats numbers with thousands separators', () => {
    expect(formatAmount(1234)).toBe('1,234')
    expect(formatAmount(999999)).toBe('999,999')
  })

  it('formats small decimals', () => {
    expect(formatAmount(0.123456)).toBe('0.123456')
    expect(formatAmount(1.5)).toBe('1.5')
  })
})

describe('compactAmount', () => {
  it('returns full format for short numbers', () => {
    expect(compactAmount(1234, 6)).toBe('1,234')
    expect(compactAmount(42.5, 6)).toBe('42.5')
  })

  it('abbreviates numbers that exceed maxChars', () => {
    const result = compactAmount(997000, 6)
    expect(result).toBe('997K')
  })

  it('abbreviates large numbers', () => {
    expect(compactAmount(1500000, 8)).toBe('1.5M')
  })

  it('returns 0 for zero', () => {
    expect(compactAmount(0, 6)).toBe('0')
  })

  it('handles numbers just under threshold', () => {
    expect(compactAmount(9999, 6)).toBe('9,999')
  })

  it('compacts 6-digit numbers when maxChars is small', () => {
    const result = compactAmount(149550, 5)
    expect(result).toBe('150K')
  })
})
