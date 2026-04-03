'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import Link from 'next/link'
import { getStockByTicker, formatStockPrice, formatLargeNumber } from '@/lib/stockData'
import { sanitizeNumericInput } from '@/lib/format'
import { getChartData, type Timeframe } from '@/lib/chartData'
import { useWalletReady } from '@/lib/WalletReadyContext'
import dynamic from 'next/dynamic'

function WalletGatedTradeButton({ hasAmount, children }: { hasAmount: boolean; children: React.ReactNode }) {
  const { isConnected } = useAccount()
  if (!isConnected) {
    return (
      <button type="button" disabled
        className="w-full py-3 rounded-xl font-semibold text-sm bg-goodgreen/30 text-goodgreen border border-goodgreen/40 cursor-not-allowed">
        Connect Wallet to Trade
      </button>
    )
  }
  if (!hasAmount) {
    return (
      <button type="button" disabled
        className="w-full py-3 rounded-xl font-semibold text-sm bg-dark-50 text-gray-400 cursor-not-allowed">
        Enter Amount
      </button>
    )
  }
  return <>{children}</>
}

const PriceChart = dynamic(
  () => import('@/components/PriceChart').then(m => ({ default: m.PriceChart })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full bg-dark-50/30 rounded-xl animate-pulse" style={{ height: 400 }} />
    ),
  }
)

const TIMEFRAMES: Timeframe[] = ['1D', '1W', '1M', '3M', '1Y']

function OrderForm({ stock }: { stock: { ticker: string; price: number } }) {
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market')
  const [amount, setAmount] = useState('')
  const [limitPrice, setLimitPrice] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const walletReady = useWalletReady()

  const parsedLimitPrice = parseFloat(limitPrice)
  const limitPriceInvalid = orderType === 'limit' && limitPrice !== '' && (isNaN(parsedLimitPrice) || parsedLimitPrice <= 0)
  const hasValidPrice = orderType === 'market' || parsedLimitPrice > 0
  const effectivePrice = orderType === 'limit' && parsedLimitPrice > 0 ? parsedLimitPrice : (orderType === 'limit' ? 0 : stock.price)
  const shares = amount && effectivePrice > 0 ? parseFloat(amount) / effectivePrice : 0
  const fee = amount ? parseFloat(amount) * 0.001 : 0
  const ubiFee = fee * 0.33
  const hasAmount = !!amount && parseFloat(amount) > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0 || limitPriceInvalid || !hasValidPrice) return
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-dark-100 rounded-2xl border border-gray-700/20 p-5">
      <div className="flex gap-2 mb-4">
        <button type="button" onClick={() => setSide('buy')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${side === 'buy' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-dark-50/50 text-gray-400 border border-transparent'}`}>
          Buy
        </button>
        <button type="button" onClick={() => setSide('sell')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${side === 'sell' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-dark-50/50 text-gray-400 border border-transparent'}`}>
          Sell
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button type="button" onClick={() => setOrderType('market')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${orderType === 'market' ? 'bg-goodgreen/15 text-goodgreen' : 'text-gray-400 hover:text-white'}`}>
          Market
        </button>
        <button type="button" onClick={() => setOrderType('limit')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${orderType === 'limit' ? 'bg-goodgreen/15 text-goodgreen' : 'text-gray-400 hover:text-white'}`}>
          Limit
        </button>
      </div>

      {orderType === 'limit' && (
        <div className="mb-3">
          <label className="text-xs text-gray-400 mb-1 block">Limit Price</label>
          <input type="text" inputMode="decimal" placeholder="0.00" value={limitPrice} onChange={e => setLimitPrice(sanitizeNumericInput(e.target.value))}
            className={`w-full px-3 py-2.5 rounded-xl bg-dark-50 border text-white text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50 ${limitPriceInvalid ? 'border-red-500/50' : 'border-gray-700/30'}`} />
          {limitPriceInvalid && (
            <p className="text-red-400 text-[10px] mt-1">Price must be greater than 0</p>
          )}
        </div>
      )}

      <div className="mb-3">
        <label className="text-xs text-gray-400 mb-1 block">Amount (USD)</label>
        <input type="text" inputMode="decimal" placeholder="0.00" value={amount} onChange={e => setAmount(sanitizeNumericInput(e.target.value))}
          className="w-full px-3 py-2.5 rounded-xl bg-dark-50 border border-gray-700/30 text-white text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50" />
      </div>

      {amount && parseFloat(amount) > 0 && hasValidPrice && effectivePrice > 0 && (
        <div className="mb-4 space-y-1.5 text-xs">
          <div className="flex justify-between text-gray-400">
            <span>Est. Shares</span>
            <span className="text-white truncate ml-2">{shares >= 1e6 ? `${(shares / 1e6).toFixed(2)}M` : shares >= 1e3 ? `${(shares / 1e3).toFixed(1)}K` : shares.toFixed(4)} {stock.ticker}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Price</span>
            <span className="text-white truncate ml-2">{formatStockPrice(effectivePrice)}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Fee (0.1%)</span>
            <span className="text-white truncate ml-2">{formatLargeNumber(fee)}</span>
          </div>
          <div className="flex justify-between text-goodgreen/80">
            <span>→ UBI Pool (33%)</span>
            <span className="truncate ml-2">{formatLargeNumber(ubiFee)}</span>
          </div>
        </div>
      )}

      {walletReady ? (
        <WalletGatedTradeButton hasAmount={hasAmount && hasValidPrice}>
          <button type="submit" disabled={limitPriceInvalid || !hasValidPrice}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              side === 'buy' ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
            }`}>
            {submitted ? 'Order Submitted!' : `${side === 'buy' ? 'Buy' : 'Sell'} ${stock.ticker}`}
          </button>
        </WalletGatedTradeButton>
      ) : (
        <button type="submit" disabled={!hasAmount || limitPriceInvalid || !hasValidPrice}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
            side === 'buy' ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
          }`}>
          {submitted ? 'Order Submitted!' : `${side === 'buy' ? 'Buy' : 'Sell'} ${stock.ticker}`}
        </button>
      )}

      <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-goodgreen/60">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
        <span>0.1% fee → 33% funds UBI</span>
      </div>
    </form>
  )
}

export default function StockDetailPage() {
  const params = useParams()
  const ticker = (params.ticker as string)?.toUpperCase()
  const stock = getStockByTicker(ticker || '')
  const [timeframe, setTimeframe] = useState<Timeframe>('3M')

  const chartData = useMemo(() => {
    if (!stock) return []
    return getChartData(stock.ticker, timeframe, stock.price)
  }, [stock, timeframe])

  if (!stock) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h1 className="text-2xl font-bold text-white mb-3">Stock Not Found</h1>
        <p className="text-sm text-gray-400 mb-6">The ticker &quot;{ticker}&quot; is not available.</p>
        <Link href="/stocks" className="px-6 py-3 rounded-xl bg-goodgreen text-white font-semibold hover:bg-goodgreen-600 transition-colors">
          Back to Stocks
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <Link href="/stocks" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-teal-400 transition-colors mb-4">
        <span>←</span> Back to Stocks
      </Link>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-goodgreen/30 to-goodgreen/10 border border-goodgreen/20 flex items-center justify-center text-xs font-bold text-goodgreen">
              {stock.ticker.slice(0, 2)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{stock.ticker}</h1>
              <p className="text-sm text-gray-400">{stock.name} · {stock.sector}</p>
            </div>
          </div>

          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-3xl font-bold text-white">{formatStockPrice(stock.price)}</span>
            <span className={`text-sm font-medium ${stock.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stock.change24h >= 0 ? '+' : ''}{stock.change24h.toFixed(2)}%
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

          <div className="bg-dark-100 rounded-2xl border border-gray-700/20 p-5">
            <h2 className="text-sm font-semibold text-white mb-3">Key Statistics</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-500 text-xs mb-0.5">Market Cap</div>
                <div className="text-white font-medium">{formatLargeNumber(stock.marketCap)}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-0.5">24h Volume</div>
                <div className="text-white font-medium">{formatLargeNumber(stock.volume24h)}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-0.5">Sector</div>
                <div className="text-white font-medium">{stock.sector}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-0.5">52W High</div>
                <div className="text-white font-medium">{formatStockPrice(stock.high52w)}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-0.5">52W Low</div>
                <div className="text-white font-medium">{formatStockPrice(stock.low52w)}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-0.5">24h Change</div>
                <div className={`font-medium ${stock.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stock.change24h >= 0 ? '+' : ''}{stock.change24h.toFixed(2)}%
                </div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-0.5">P/E Ratio</div>
                <div className="text-white font-medium">{stock.peRatio.toFixed(1)}x</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-0.5">EPS</div>
                <div className={`font-medium ${stock.eps >= 0 ? 'text-green-400' : 'text-red-400'}`}>${stock.eps.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-0.5">Dividend Yield</div>
                <div className="text-white font-medium">{stock.dividendYield > 0 ? `${stock.dividendYield.toFixed(2)}%` : '—'}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-0.5">Avg Volume</div>
                <div className="text-white font-medium">{formatLargeNumber(stock.avgVolume).replace('$', '')}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:w-80 shrink-0">
          <OrderForm stock={stock} />

          <div className="mt-4 bg-dark-100 rounded-2xl border border-gray-700/20 p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Your Position</h3>
            <div className="text-center py-6 text-gray-500 text-sm">
              <svg className="w-8 h-8 mx-auto mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12H4" />
              </svg>
              No position in {stock.ticker}
              <div className="mt-1 text-xs text-gray-600">Place an order to get started</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
