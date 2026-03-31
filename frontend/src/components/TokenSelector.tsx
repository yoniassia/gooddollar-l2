'use client'

import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react'
import { TokenIcon } from './TokenIcon'

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
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const available = TOKENS.filter(t => t.symbol !== exclude)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleOpen = useCallback(() => {
    setOpen(true)
    setHighlightedIndex(0)
  }, [])

  const handleClose = useCallback(() => {
    setOpen(false)
    triggerRef.current?.focus()
  }, [])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        handleOpen()
      }
      return
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        handleClose()
        break
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(i => (i + 1) % available.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(i => (i - 1 + available.length) % available.length)
        break
      case 'Enter':
        e.preventDefault()
        onSelect(available[highlightedIndex])
        handleClose()
        break
    }
  }, [open, available, highlightedIndex, onSelect, handleClose, handleOpen])

  return (
    <div className="relative" ref={ref} role="combobox" aria-expanded={open} aria-controls="token-listbox" onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        onClick={() => open ? handleClose() : handleOpen()}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-dark-50 hover:bg-dark-50/80 border border-gray-700/50 transition-colors min-w-[120px] focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:outline-none"
      >
        <TokenIcon symbol={selected.symbol} size={20} />
        <span className="font-semibold text-white">{selected.symbol}</span>
        <svg className={`w-4 h-4 text-gray-400 ml-auto transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          id="token-listbox"
          role="listbox"
          className="absolute top-full mt-2 w-48 bg-dark-100 border border-gray-700/50 rounded-xl shadow-2xl z-50 overflow-hidden"
        >
          {available.map((token, index) => (
            <button
              key={token.symbol}
              role="option"
              aria-selected={token.symbol === selected.symbol}
              onClick={() => { onSelect(token); handleClose() }}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                index === highlightedIndex
                  ? 'bg-goodgreen/10'
                  : token.symbol === selected.symbol
                    ? 'bg-dark-50/50'
                    : 'hover:bg-dark-50'
              }`}
            >
              <TokenIcon symbol={token.symbol} size={24} />
              <div className="text-left">
                <div className="font-medium text-white text-sm">{token.symbol}</div>
                <div className="text-xs text-gray-400">{token.name}</div>
              </div>
              {index === highlightedIndex && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-goodgreen" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
