'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getTokenBySymbol, formatPrice, formatVolume, formatMarketCap } from '@/lib/marketData'
import { TokenIcon } from '@/components/TokenIcon'
import { getChartData, type Timeframe } from '@/lib/chartData'
import dynamic from 'next/dynamic'

const PriceChart = dynamic(
  () => import('@/components/PriceChart').then(m => ({ default: m.PriceChart })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full bg-dark-50/30 rounded-xl animate-pulse" style={{ height: 350 }} />
    ),
  }
)

const TIMEFRAMES: Timeframe[] = ['1D', '1W', '1M', '3M', '1Y']

export default function TokenDetailPage() {
  const params = useParams()
  const symbol = (params.symbol as string)?.toUpperCase()
  const token = getTokenBySymbol(symbol || '')
  const [timeframe, setTimeframe] = useState<Timeframe>('1M')

  const chartData = useMemo(() => {
    if (!token) return []
    return getChartData(token.symbol, timeframe, token.price)
  }, [token, timeframe])

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h1 className="text-2xl font-bold text-white mb-3">Token Not Found</h1>
        <p className="text-sm text-gray-400 mb-6">The token &quot;{symbol}&quot; is not available on GoodDollar L2.</p>
        <Link href="/explore" className="px-6 py-3 rounded-xl bg-goodgreen text-white font-semibold hover:bg-goodgreen-600 transition-colors">
          Back to Explore
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <Link href="/explore" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-goodgreen transition-colors mb-4">
        <span>←</span> Back to Explore
      </Link>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-4">
            <TokenIcon symbol={token.symbol} size={40} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white">{token.name}</h1>
                <span className="text-sm text-gray-400 bg-dark-50 px-2 py-0.5 rounded-md">{token.symbol}</span>
              </div>
              <p className="text-xs text-gray-500">{token.category}</p>
            </div>
          </div>

          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-3xl font-bold text-white">{formatPrice(token.price)}</span>
            <span className={`text-sm font-medium ${token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
              <span className="text-gray-500 ml-1 text-xs">24h</span>
            </span>
          </div>

          <div className="bg-dark-100 rounded-2xl border border-gray-700/20 p-4 mb-4">
            <div className="flex gap-1 mb-3">
              {TIMEFRAMES.map(tf => (
                <button key={tf} onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${timeframe === tf ? 'bg-goodgreen/15 text-goodgreen' : 'text-gray-400 hover:text-white'}`}>
                  {tf}
                </button>
              ))}
            </div>
            <PriceChart data={chartData} height={350} />
          </div>

          <div className="bg-dark-100 rounded-2xl border border-gray-700/20 p-5 mb-4">
            <h2 className="text-sm font-semibold text-white mb-3">Key Statistics</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-500 text-xs mb-0.5">Market Cap</div>
                <div className="text-white font-medium">{formatMarketCap(token.marketCap)}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-0.5">24h Volume</div>
                <div className="text-white font-medium">{formatVolume(token.volume24h)}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-0.5">Category</div>
                <div className="text-white font-medium">{token.category}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-0.5">1h Change</div>
                <div className={`font-medium ${token.change1h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {token.change1h >= 0 ? '+' : ''}{token.change1h.toFixed(2)}%
                </div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-0.5">7d Change</div>
                <div className={`font-medium ${token.change7d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {token.change7d >= 0 ? '+' : ''}{token.change7d.toFixed(2)}%
                </div>
              </div>
              {token.circulatingSupply && (
                <div>
                  <div className="text-gray-500 text-xs mb-0.5">Circulating Supply</div>
                  <div className="text-white font-medium">
                    {token.circulatingSupply >= 1e9 ? `${(token.circulatingSupply / 1e9).toFixed(2)}B` : token.circulatingSupply >= 1e6 ? `${(token.circulatingSupply / 1e6).toFixed(1)}M` : token.circulatingSupply >= 1e3 ? `${(token.circulatingSupply / 1e3).toFixed(0)}K` : token.circulatingSupply.toLocaleString()}
                  </div>
                </div>
              )}
              {token.maxSupply && (
                <div>
                  <div className="text-gray-500 text-xs mb-0.5">Max Supply</div>
                  <div className="text-white font-medium">
                    {token.maxSupply >= 1e9 ? `${(token.maxSupply / 1e9).toFixed(2)}B` : token.maxSupply >= 1e6 ? `${(token.maxSupply / 1e6).toFixed(1)}M` : token.maxSupply.toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {token.description && (
            <div className="bg-dark-100 rounded-2xl border border-gray-700/20 p-5">
              <h2 className="text-sm font-semibold text-white mb-2">About {token.name}</h2>
              <p className="text-sm text-gray-400 leading-relaxed">{token.description}</p>
            </div>
          )}
        </div>

        <div className="lg:w-72 shrink-0">
          <div className="bg-dark-100 rounded-2xl border border-gray-700/20 p-5 sticky top-24">
            <h3 className="text-sm font-semibold text-white mb-4">Quick Trade</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Price</span>
                <span className="text-white font-medium">{formatPrice(token.price)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">24h Vol</span>
                <span className="text-white font-medium">{formatVolume(token.volume24h)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Mkt Cap</span>
                <span className="text-white font-medium">{formatMarketCap(token.marketCap)}</span>
              </div>
            </div>
            <Link
              href={`/?buy=${token.symbol}`}
              className="mt-4 w-full py-3 rounded-xl bg-goodgreen hover:bg-goodgreen-600 text-white font-semibold text-sm text-center transition-colors active:scale-[0.98] block"
            >
              Swap {token.symbol}
            </Link>
            <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-goodgreen/60">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              <span>0.1% fee → 33% funds UBI</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
