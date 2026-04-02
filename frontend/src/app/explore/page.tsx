'use client'

import { useState, useMemo, memo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { TokenIcon } from '@/components/TokenIcon'
import { Sparkline } from '@/components/Sparkline'
import { getTokenMarketData, formatPrice, formatVolume, formatMarketCap, type TokenMarketData } from '@/lib/marketData'

type SortField = 'price' | 'change1h' | 'change24h' | 'change7d' | 'volume24h' | 'marketCap'
type SortDir = 'asc' | 'desc'

function SortArrow({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="text-gray-600 ml-1">&#8597;</span>
  return <span className="text-goodgreen ml-1">{dir === 'asc' ? '↑' : '↓'}</span>
}

interface TokenRowProps {
  token: TokenMarketData
  idx: number
  onRowClick: (symbol: string) => void
}

const TokenRow = memo(function TokenRow({ token, idx, onRowClick }: TokenRowProps) {
  return (
    <tr
      onClick={() => onRowClick(token.symbol)}
      className={`group border-b border-gray-700/10 hover:bg-white/[0.04] cursor-pointer transition-colors ${idx % 2 === 1 ? 'bg-dark-50/15' : ''}`}
    >
      <td className="py-3 px-3 text-gray-500 text-right">{idx + 1}</td>
      <td className="py-3 px-3">
        <div className="flex items-center gap-2.5">
          <TokenIcon symbol={token.symbol} size={28} />
          <div>
            <span className="font-semibold text-white">{token.symbol}</span>
            <span className="text-gray-500 ml-1.5 hidden sm:inline text-xs">{token.name}</span>
          </div>
        </div>
      </td>
      <td className="py-3 px-3 text-right text-white font-medium">
        {formatPrice(token.price)}
      </td>
      <td className={`py-3 px-2 text-right font-medium hidden lg:table-cell ${
        token.change1h >= 0 ? 'text-green-400' : 'text-red-400'
      }`}>
        <span className="inline-flex items-center gap-0.5 text-xs">
          {token.change1h >= 0 ? '▲' : '▼'}
          {Math.abs(token.change1h).toFixed(1)}%
        </span>
      </td>
      <td className={`py-3 px-3 text-right font-medium ${
        token.change24h >= 0 ? 'text-green-400' : 'text-red-400'
      }`}>
        <span className="inline-flex items-center gap-0.5">
          {token.change24h >= 0 ? '▲' : '▼'}
          {Math.abs(token.change24h).toFixed(2)}%
        </span>
      </td>
      <td className={`py-3 px-2 text-right font-medium hidden lg:table-cell ${
        token.change7d >= 0 ? 'text-green-400' : 'text-red-400'
      }`}>
        <span className="inline-flex items-center gap-0.5 text-xs">
          {token.change7d >= 0 ? '▲' : '▼'}
          {Math.abs(token.change7d).toFixed(1)}%
        </span>
      </td>
      <td className="py-3 px-3 text-right text-gray-300 hidden sm:table-cell">
        {formatVolume(token.volume24h)}
      </td>
      <td className="py-3 px-3 text-right text-gray-300 hidden md:table-cell">
        {formatMarketCap(token.marketCap)}
      </td>
      <td className="py-3 px-2 hidden lg:table-cell">
        <Sparkline data={token.sparkline7d} positive={token.change24h >= 0} />
      </td>
      <td className="py-3 px-1 text-right w-20 hidden sm:table-cell">
        <button
          onClick={(e) => { e.stopPropagation(); onRowClick(token.symbol) }}
          className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1 text-xs font-medium rounded-lg bg-goodgreen/10 text-goodgreen hover:bg-goodgreen/20"
        >
          Swap
        </button>
      </td>
    </tr>
  )
})

export default function ExplorePage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('marketCap')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [data] = useState(() => getTokenMarketData())

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const filtered = useMemo(() => {
    let tokens = data
    const trimmed = query.trim()
    if (trimmed) {
      const q = trimmed.toLowerCase()
      tokens = tokens.filter(t =>
        t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)
      )
    }
    return [...tokens].sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1
      return (a[sortField] - b[sortField]) * mul
    })
  }, [data, query, sortField, sortDir])

  const handleRowClick = useCallback((symbol: string) => {
    router.push(`/?buy=${symbol}`)
  }, [router])

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Explore Tokens</h1>
        <p className="text-sm text-gray-400">Browse token prices, volume, and market data on GoodDollar L2</p>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search tokens..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full sm:w-72 px-4 py-2.5 rounded-xl bg-dark-100 border border-gray-700/30 text-white placeholder:text-gray-500 text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:border-goodgreen/30"
        />
      </div>

      <div className="bg-dark-100 rounded-2xl border border-gray-700/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700/30 text-gray-400 bg-dark-50/25">
                <th className="text-right py-3 px-3 font-semibold w-10">#</th>
                <th className="text-left py-3 px-3 font-semibold">Token</th>
                <th
                  className="text-right py-3 px-3 font-semibold cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('price')}
                >
                  Price <SortArrow active={sortField === 'price'} dir={sortDir} />
                </th>
                <th
                  className="text-right py-3 px-2 font-semibold cursor-pointer hover:text-white transition-colors hidden lg:table-cell"
                  onClick={() => handleSort('change1h')}
                >
                  1h <SortArrow active={sortField === 'change1h'} dir={sortDir} />
                </th>
                <th
                  className="text-right py-3 px-3 font-semibold cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('change24h')}
                >
                  24h <SortArrow active={sortField === 'change24h'} dir={sortDir} />
                </th>
                <th
                  className="text-right py-3 px-2 font-semibold cursor-pointer hover:text-white transition-colors hidden lg:table-cell"
                  onClick={() => handleSort('change7d')}
                >
                  7d <SortArrow active={sortField === 'change7d'} dir={sortDir} />
                </th>
                <th
                  className="text-right py-3 px-3 font-semibold cursor-pointer hover:text-white transition-colors hidden sm:table-cell"
                  onClick={() => handleSort('volume24h')}
                >
                  Volume <SortArrow active={sortField === 'volume24h'} dir={sortDir} />
                </th>
                <th
                  className="text-right py-3 px-3 font-semibold cursor-pointer hover:text-white transition-colors hidden md:table-cell"
                  onClick={() => handleSort('marketCap')}
                >
                  Market Cap <SortArrow active={sortField === 'marketCap'} dir={sortDir} />
                </th>
                <th className="py-3 px-2 hidden lg:table-cell" />
                <th className="w-20 hidden sm:table-cell" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-500">
                    No tokens match your search
                  </td>
                </tr>
              ) : (
                filtered.map((token, idx) => (
                  <TokenRow key={token.symbol} token={token} idx={idx} onRowClick={handleRowClick} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-600 text-center mt-4">
        Prices shown are illustrative. Real-time data coming soon.
      </p>
    </div>
  )
}
