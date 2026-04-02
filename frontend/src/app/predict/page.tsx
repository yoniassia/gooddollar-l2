'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { getMarkets, filterAndSortMarkets, formatVolume, ALL_CATEGORIES, getMarketStatus, getDaysLeftLabel, type MarketCategory, type SortOption } from '@/lib/predictData'
import { InfoBanner } from '@/components/InfoBanner'

function ProbabilityBar({ yesPrice }: { yesPrice: number }) {
  const yesPct = Math.round(yesPrice * 100)
  const noPct = 100 - yesPct
  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="flex-1 flex h-2 rounded-full overflow-hidden bg-dark-50">
        <div className="bg-green-500 transition-all" style={{ width: `${yesPct}%` }} />
        <div className="bg-red-500/60 transition-all" style={{ width: `${noPct}%` }} />
      </div>
      <div className="flex gap-2 shrink-0">
        <span className="text-green-400 font-medium">{yesPct}¢</span>
        <span className="text-red-400 font-medium">{noPct}¢</span>
      </div>
    </div>
  )
}

function MarketCard({ market }: { market: ReturnType<typeof getMarkets>[0] }) {
  const yesPct = Math.round(market.yesPrice * 100)
  const status = getMarketStatus(market.endDate)
  const timeLabel = getDaysLeftLabel(market.endDate)

  const timeLabelClass = status === 'expired'
    ? 'text-red-400/70 bg-red-500/10 px-1.5 py-0.5 rounded'
    : status === 'ending-today'
    ? 'text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded'
    : 'text-gray-500'

  return (
    <Link href={`/predict/${market.id}`} className={`block bg-dark-100 rounded-2xl border border-gray-700/20 p-5 hover:border-goodgreen/30 transition-all group ${status === 'expired' ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-goodgreen/10 text-goodgreen/80 border border-goodgreen/15">
          {market.category}
        </span>
        <span className={`text-xs font-medium ${timeLabelClass}`}>{timeLabel}</span>
      </div>

      <h3 className="text-sm font-semibold text-white mb-3 leading-snug group-hover:text-goodgreen/90 transition-colors line-clamp-2">
        {market.question}
      </h3>

      <div className="mb-3">
        <div className="flex items-baseline gap-1 mb-1.5">
          <span className="text-2xl font-bold text-green-400">{yesPct}%</span>
          <span className="text-xs text-gray-500">chance</span>
        </div>
        <ProbabilityBar yesPrice={market.yesPrice} />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-700/15">
        <span>Vol: {formatVolume(market.volume)}</span>
        <span>{formatVolume(market.liquidity)} liquidity</span>
      </div>
    </Link>
  )
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'trending', label: 'Trending' },
  { value: 'newest', label: 'Newest' },
  { value: 'volume', label: 'Highest Volume' },
  { value: 'ending', label: 'Ending Soon' },
]

export default function PredictPage() {
  const [category, setCategory] = useState<MarketCategory | 'All'>('All')
  const [sort, setSort] = useState<SortOption>('trending')
  const [query, setQuery] = useState('')
  const [allMarkets] = useState(() => getMarkets())

  const filtered = useMemo(
    () => filterAndSortMarkets(allMarkets, category, sort, query),
    [allMarkets, category, sort, query],
  )

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-goodgreen/10 border border-goodgreen/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-goodgreen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Prediction Markets</h1>
          <p className="text-sm text-gray-400">Bet on real-world events. Every trade funds UBI.</p>
        </div>
      </div>

      <InfoBanner
        title="How Prediction Markets Work"
        description="Buy YES or NO shares on any event. If you're right, each share pays $1. If wrong, you lose your stake. Share prices (5¢–95¢) reflect the crowd's probability estimate."
        storageKey="gd-banner-dismissed-predict"
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search markets..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full sm:w-72 px-4 py-2.5 rounded-xl bg-dark-100 border border-gray-700/30 text-white placeholder:text-gray-500 text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:border-goodgreen/30"
        />
        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortOption)}
          className="px-3 py-2.5 rounded-xl bg-dark-100 border border-gray-700/30 text-white text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50"
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setCategory('All')}
          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${category === 'All' ? 'bg-goodgreen/15 text-goodgreen border border-goodgreen/20' : 'text-gray-400 hover:text-white bg-dark-100 border border-gray-700/20'}`}
        >
          All
        </button>
        {ALL_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${category === cat ? 'bg-goodgreen/15 text-goodgreen border border-goodgreen/20' : 'text-gray-400 hover:text-white bg-dark-100 border border-gray-700/20'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-dark-100 rounded-2xl border border-gray-700/20 py-16 text-center">
          <p className="text-gray-400 text-sm mb-1">No markets found</p>
          <p className="text-gray-600 text-xs">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(market => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      )}

      <p className="text-xs text-gray-600 text-center mt-6">
        Markets are illustrative. Resolution via oracle coming soon.
      </p>
    </div>
  )
}
