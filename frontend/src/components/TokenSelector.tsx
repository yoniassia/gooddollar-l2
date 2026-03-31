'use client'

import { useState, useRef, useEffect } from 'react'

export interface Token {
  symbol: string
  name: string
  icon: string
  decimals: number
}

export const TOKENS: Token[] = [
  { symbol: 'G$', name: 'GoodDollar', icon: '💚', decimals: 18 },
  { symbol: 'ETH', name: 'Ether', icon: '⟠', decimals: 18 },
  { symbol: 'USDC', name: 'USD Coin', icon: '💲', decimals: 6 },
]

interface TokenSelectorProps {
  selected: Token
  onSelect: (token: Token) => void
  exclude?: string
}

export function TokenSelector({ selected, onSelect, exclude }: TokenSelectorProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const available = TOKENS.filter(t => t.symbol !== exclude)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-dark-50 hover:bg-dark-50/80 border border-gray-700/50 transition-colors min-w-[120px]"
      >
        <span className="text-lg">{selected.icon}</span>
        <span className="font-semibold text-white">{selected.symbol}</span>
        <svg className="w-4 h-4 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full mt-2 w-48 bg-dark-100 border border-gray-700/50 rounded-xl shadow-2xl z-50 overflow-hidden">
          {available.map(token => (
            <button
              key={token.symbol}
              onClick={() => { onSelect(token); setOpen(false) }}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-50 transition-colors ${
                token.symbol === selected.symbol ? 'bg-goodgreen/10' : ''
              }`}
            >
              <span className="text-lg">{token.icon}</span>
              <div className="text-left">
                <div className="font-medium text-white text-sm">{token.symbol}</div>
                <div className="text-xs text-gray-400">{token.name}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
