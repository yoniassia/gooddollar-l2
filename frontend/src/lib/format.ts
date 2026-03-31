const ABBREVIATIONS: [number, string][] = [
  [1e12, 'T'],
  [1e9, 'B'],
  [1e6, 'M'],
]

export function formatAmount(value: number | string, maxDecimals = 6): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num) || num === 0) return '0'

  const abs = Math.abs(num)

  for (const [threshold, suffix] of ABBREVIATIONS) {
    if (abs >= threshold) {
      const abbreviated = num / threshold
      const fixed = abbreviated.toFixed(2).replace(/\.?0+$/, '')
      return `${fixed}${suffix}`
    }
  }

  if (abs >= 1000) {
    const intPart = Math.floor(abs)
    const decPart = abs - intPart
    const formatted = intPart.toLocaleString('en-US')
    if (decPart > 0.005) {
      const decimals = Math.min(maxDecimals, 2)
      const decStr = decPart.toFixed(decimals).slice(1).replace(/0+$/, '').replace(/\.$/, '')
      return (num < 0 ? '-' : '') + formatted + decStr
    }
    return (num < 0 ? '-' : '') + formatted
  }

  if (abs >= 1) {
    const decimals = Math.min(maxDecimals, 4)
    return trimTrailingZeros(num.toFixed(decimals))
  }

  const significantDecimals = Math.min(maxDecimals, 6)
  return trimTrailingZeros(num.toFixed(significantDecimals))
}

function trimTrailingZeros(s: string): string {
  if (!s.includes('.')) return s
  return s.replace(/0+$/, '').replace(/\.$/, '')
}

const COMPACT_THRESHOLDS: [number, string][] = [
  [1e12, 'T'],
  [1e9, 'B'],
  [1e6, 'M'],
  [1e3, 'K'],
]

export function compactAmount(value: number, maxChars: number): string {
  if (value === 0 || isNaN(value)) return '0'

  const full = formatAmount(value)
  if (full.length <= maxChars) return full

  for (const [threshold, suffix] of COMPACT_THRESHOLDS) {
    if (Math.abs(value) >= threshold) {
      const abbreviated = value / threshold
      const decimals = abbreviated >= 100 ? 0 : abbreviated >= 10 ? 1 : 2
      let fixed = abbreviated.toFixed(decimals)
      if (fixed.includes('.')) fixed = fixed.replace(/0+$/, '').replace(/\.$/, '')
      return `${fixed}${suffix}`
    }
  }

  return full
}

export function sanitizeNumericInput(value: string): string {
  let sanitized = value.replace(/[^0-9.]/g, '')

  const dotIndex = sanitized.indexOf('.')
  if (dotIndex !== -1) {
    sanitized = sanitized.slice(0, dotIndex + 1) + sanitized.slice(dotIndex + 1).replace(/\./g, '')
  }

  if (dotIndex !== -1) {
    const intPart = sanitized.slice(0, dotIndex)
    const stripped = intPart.replace(/^0+/, '') || '0'
    sanitized = stripped + sanitized.slice(dotIndex)
  } else if (sanitized.length > 1) {
    sanitized = sanitized.replace(/^0+/, '') || '0'
  }

  if (sanitized.length > 20) {
    sanitized = sanitized.slice(0, 20)
  }

  return sanitized
}
