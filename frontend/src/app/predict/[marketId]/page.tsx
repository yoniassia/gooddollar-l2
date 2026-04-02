'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getMarketById, formatVolume } from '@/lib/predictData'
import { generateProbabilityHistory } from '@/lib/chartData'
import { ProbabilityChart } from '@/components/ProbabilityChart'

function TradePanel({ market }: { market: ReturnType<typeof getMarketById> & {} }) {
  const [side, setSide] = useState<'yes' | 'no'>('yes')
  const [amount, setAmount] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const price = side === 'yes' ? market.yesPrice : 1 - market.yesPrice
  const shares = amount && price > 0 ? parseFloat(amount) / price : 0
  const potentialPayout = shares
  const fee = amount ? parseFloat(amount) * 0.01 : 0
  const ubiFee = fee * 0.33

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) return
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-dark-100 rounded-2xl border border-gray-700/20 p-5">
      <h3 className="text-sm font-semibold text-white mb-4">Place Trade</h3>

      <div className="flex gap-2 mb-4">
        <button type="button" onClick={() => setSide('yes')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${side === 'yes' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-dark-50/50 text-gray-400 border border-transparent'}`}>
          YES {Math.round(market.yesPrice * 100)}¢
        </button>
        <button type="button" onClick={() => setSide('no')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${side === 'no' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-dark-50/50 text-gray-400 border border-transparent'}`}>
          NO {Math.round((1 - market.yesPrice) * 100)}¢
        </button>
      </div>

      <div className="mb-3">
        <label className="text-xs text-gray-400 mb-1 block">Amount (USD)</label>
        <input type="number" step="0.01" min="0" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl bg-dark-50 border border-gray-700/30 text-white text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50" />
      </div>

      {amount && parseFloat(amount) > 0 && (
        <div className="mb-4 space-y-1.5 text-xs">
          <div className="flex justify-between text-gray-400">
            <span>Avg Price</span>
            <span className="text-white">{(price * 100).toFixed(1)}¢ per share</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Est. Shares</span>
            <span className="text-white">{shares.toFixed(1)}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Potential Payout</span>
            <span className="text-white">${potentialPayout.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Fee (1%)</span>
            <span className="text-white">${fee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-goodgreen/80">
            <span>→ UBI Pool (33%)</span>
            <span>${ubiFee.toFixed(2)}</span>
          </div>
        </div>
      )}

      <button type="submit" disabled={!amount || parseFloat(amount) <= 0}
        className={`w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
          side === 'yes' ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
        }`}>
        {submitted ? 'Order Placed!' : `Buy ${side.toUpperCase()}`}
      </button>

      <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-goodgreen/60">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
        <span>1% fee on winnings → 33% funds UBI</span>
      </div>
    </form>
  )
}

export default function MarketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const marketId = params.marketId as string
  const market = getMarketById(marketId)

  const probData = useMemo(() => {
    if (!market) return []
    return generateProbabilityHistory(market.yesPrice, 90)
  }, [market])

  if (!market) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h1 className="text-2xl font-bold text-white mb-3">Market Not Found</h1>
        <p className="text-sm text-gray-400 mb-6">This prediction market doesn&apos;t exist.</p>
        <Link href="/predict" className="px-6 py-3 rounded-xl bg-goodgreen text-white font-semibold hover:bg-goodgreen-600 transition-colors">
          Back to Markets
        </Link>
      </div>
    )
  }

  const yesPct = Math.round(market.yesPrice * 100)
  const endDate = new Date(market.endDate)
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

  return (
    <div className="w-full max-w-5xl mx-auto">
      <button onClick={() => router.push('/predict')} className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors mb-4">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Back to Markets
      </button>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <div className="mb-4">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-goodgreen/10 text-goodgreen/80 border border-goodgreen/15">
              {market.category}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-white mb-3 leading-snug">{market.question}</h1>

          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-4xl font-bold text-green-400">{yesPct}%</span>
            <span className="text-sm text-gray-400">chance (YES)</span>
          </div>

          <div className="bg-dark-100 rounded-2xl border border-gray-700/20 p-4 mb-4">
            <h3 className="text-xs text-gray-400 mb-2 font-medium">Probability Over Time</h3>
            <ProbabilityChart data={probData} height={280} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-dark-100 rounded-xl border border-gray-700/20 p-3">
              <div className="text-xs text-gray-500 mb-0.5">Volume</div>
              <div className="text-sm font-semibold text-white">{formatVolume(market.volume)}</div>
            </div>
            <div className="bg-dark-100 rounded-xl border border-gray-700/20 p-3">
              <div className="text-xs text-gray-500 mb-0.5">Liquidity</div>
              <div className="text-sm font-semibold text-white">{formatVolume(market.liquidity)}</div>
            </div>
            <div className="bg-dark-100 rounded-xl border border-gray-700/20 p-3">
              <div className="text-xs text-gray-500 mb-0.5">Total Shares</div>
              <div className="text-sm font-semibold text-white">{(market.totalShares / 1000).toFixed(0)}K</div>
            </div>
            <div className="bg-dark-100 rounded-xl border border-gray-700/20 p-3">
              <div className="text-xs text-gray-500 mb-0.5">Ends In</div>
              <div className="text-sm font-semibold text-white">{daysLeft} days</div>
            </div>
          </div>

          <div className="bg-dark-100 rounded-2xl border border-gray-700/20 p-5">
            <h2 className="text-sm font-semibold text-white mb-3">Market Info</h2>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-gray-500 text-xs mb-0.5">Resolution Criteria</div>
                <div className="text-gray-300">This market resolves YES if the stated condition is met by the end date, NO otherwise.</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-0.5">Resolution Source</div>
                <div className="text-gray-300">{market.resolutionSource}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-0.5">End Date</div>
                <div className="text-gray-300">{endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-0.5">Created</div>
                <div className="text-gray-300">{new Date(market.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:w-80 shrink-0">
          <TradePanel market={market} />
        </div>
      </div>
    </div>
  )
}
