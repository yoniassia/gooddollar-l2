'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TokenIcon } from '@/components/TokenIcon'
import { getTokenMarketData, formatPrice, formatVolume, formatMarketCap, type TokenMarketData } from '@/lib/marketData'

type SortField = 'price' | 'change24h' | 'volume24h' | 'marketCap'
type SortDir = 'asc' | 'desc'

function SortArrow({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="text-gray-600 ml-1">&#8597;</span>
  return <span className="text-goodgreen ml-1">{dir === 'asc' ? '↑' : '↓'}</span>
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-700/10">
      {[...Array(6)].map((_, i) => (
        <td key={i} className="py-4 px-3">
          <div className="h-4 bg-dark-50 rounded animate-pulse" style={{ width: i === 1 ? '120px' : '60px' }} />
        </td>
      ))}
    </tr>
  )
}

export default function ExplorePage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('marketCap')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<TokenMarketData[]>([])

  useEffect(() => {
    const timer = setTimeout(() => {
      setData(getTokenMarketData())
      setLoading(false)
    }, 400)
    return () => clearTimeout(timer)
  }, [])

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

  const handleRowClick = (symbol: string) => {
    router.push(`/?token=${symbol}`)
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
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
              <tr className="border-b border-gray-700/20 text-gray-400">
                <th className="text-left py-3 px-3 font-medium w-10">#</th>
                <th className="text-left py-3 px-3 font-medium">Token</th>
                <th
                  className="text-right py-3 px-3 font-medium cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('price')}
                >
                  Price <SortArrow active={sortField === 'price'} dir={sortDir} />
                </th>
                <th
                  className="text-right py-3 px-3 font-medium cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('change24h')}
                >
                  <span className="hidden sm:inline">24h </span>Change <SortArrow active={sortField === 'change24h'} dir={sortDir} />
                </th>
                <th
                  className="text-right py-3 px-3 font-medium cursor-pointer hover:text-white transition-colors hidden sm:table-cell"
                  onClick={() => handleSort('volume24h')}
                >
                  Volume <SortArrow active={sortField === 'volume24h'} dir={sortDir} />
                </th>
                <th
                  className="text-right py-3 px-3 font-medium cursor-pointer hover:text-white transition-colors hidden md:table-cell"
                  onClick={() => handleSort('marketCap')}
                >
                  Market Cap <SortArrow active={sortField === 'marketCap'} dir={sortDir} />
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    No tokens match your search
                  </td>
                </tr>
              ) : (
                filtered.map((token, idx) => (
                  <tr
                    key={token.symbol}
                    onClick={() => handleRowClick(token.symbol)}
                    className="border-b border-gray-700/10 hover:bg-dark-50/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3 text-gray-500">{idx + 1}</td>
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
                    <td className={`py-3 px-3 text-right font-medium ${
                      token.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      <span className="inline-flex items-center gap-0.5">
                        {token.change24h >= 0 ? '▲' : '▼'}
                        {Math.abs(token.change24h).toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-gray-300 hidden sm:table-cell">
                      {formatVolume(token.volume24h)}
                    </td>
                    <td className="py-3 px-3 text-right text-gray-300 hidden md:table-cell">
                      {formatMarketCap(token.marketCap)}
                    </td>
                  </tr>
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
