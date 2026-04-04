'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { formatVolume } from '@/lib/predictData'
import { useOnChainPredictPositions, useOnChainPredictSummary, useOnChainMarkets } from '@/lib/useOnChainPredict'
import { ConnectWalletEmptyState } from '@/components/ConnectWalletEmptyState'

type Tab = 'positions' | 'pending' | 'history'

export default function PredictPortfolioPage() {
  const [tab, setTab] = useState<Tab>('positions')
  const { positions, resolved } = useOnChainPredictPositions()
  const summary = useOnChainPredictSummary()
  const { markets } = useOnChainMarkets()

  // Build a lookup from market ID → question
  const marketMap = useMemo(() => {
    const m = new Map<string, { question: string; yesPrice: number; endDate: string; resolved: boolean }>()
    for (const market of markets) {
      m.set(market.id, { question: market.question, yesPrice: market.yesPrice, endDate: market.endDate, resolved: market.resolved })
    }
    return m
  }, [markets])

  const pendingPositions = positions.filter(p => {
    const market = marketMap.get(p.marketId)
    return market && new Date(market.endDate) < new Date() && !market.resolved
  })

  return (
    <ConnectWalletEmptyState
      title="Connect to View Predictions"
      description="Connect your wallet to view your prediction market positions and resolved bets."
    >
    <div className="w-full max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Predictions Portfolio</h1>

      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
        <div className="bg-dark-100 rounded-xl sm:rounded-2xl border border-gray-700/20 p-3 sm:p-5">
          <div className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Total Invested</div>
          <div className="text-lg sm:text-xl font-bold text-white">{formatVolume(summary.totalInvested)}</div>
        </div>
        <div className="bg-dark-100 rounded-xl sm:rounded-2xl border border-gray-700/20 p-3 sm:p-5">
          <div className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Current Value</div>
          <div className="text-lg sm:text-xl font-bold text-white">{formatVolume(summary.currentValue)}</div>
        </div>
        <div className="bg-dark-100 rounded-xl sm:rounded-2xl border border-gray-700/20 p-3 sm:p-5">
          <div className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Unrealized P&L</div>
          <div className={`text-lg sm:text-xl font-bold ${summary.unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {summary.unrealizedPnl >= 0 ? '+' : ''}{formatVolume(Math.abs(summary.unrealizedPnl))}
          </div>
        </div>
      </div>

      <div className="bg-dark-100 rounded-2xl border border-gray-700/20 overflow-hidden">
        <div className="flex border-b border-gray-700/20">
          <button onClick={() => setTab('positions')}
            className={`px-5 py-3 text-sm font-medium transition-colors ${tab === 'positions' ? 'text-white border-b-2 border-goodgreen' : 'text-gray-400 hover:text-white'}`}>
            Positions ({positions.length})
          </button>
          <button onClick={() => setTab('pending')}
            className={`px-5 py-3 text-sm font-medium transition-colors ${tab === 'pending' ? 'text-white border-b-2 border-goodgreen' : 'text-gray-400 hover:text-white'}`}>
            Pending ({pendingPositions.length})
          </button>
          <button onClick={() => setTab('history')}
            className={`px-5 py-3 text-sm font-medium transition-colors ${tab === 'history' ? 'text-white border-b-2 border-goodgreen' : 'text-gray-400 hover:text-white'}`}>
            History ({resolved.length})
          </button>
        </div>

        {tab === 'positions' && (
          positions.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-gray-400 text-sm mb-1">No open positions</p>
              <p className="text-gray-600 text-xs mb-4">Start predicting to build your portfolio</p>
              <Link href="/predict" className="text-goodgreen text-sm hover:underline">Browse Markets</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-700/10">
              {positions.map(pos => {
                const market = marketMap.get(pos.marketId)
                const currentVal = pos.side === 'yes' ? pos.currentPrice : 1 - pos.currentPrice
                const pnl = pos.shares * (currentVal - pos.avgPrice)
                return (
                  <Link key={pos.marketId} href={`/predict/${pos.marketId}`} className="block px-5 py-4 hover:bg-dark-50/30 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{market?.question ?? `Market #${pos.marketId}`}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs">
                          <span className={`px-2 py-0.5 rounded font-medium ${pos.side === 'yes' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                            {pos.side.toUpperCase()}
                          </span>
                          <span className="text-gray-500">{pos.shares.toFixed(1)} shares @ {(pos.avgPrice * 100).toFixed(0)}¢</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-sm font-medium ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {market ? `${Math.round(market.yesPrice * 100)}% YES` : ''}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )
        )}

        {tab === 'pending' && (
          pendingPositions.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-gray-400 text-sm">No markets pending resolution</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700/10">
              {pendingPositions.map(pos => {
                const market = marketMap.get(pos.marketId)
                return (
                  <div key={pos.marketId} className="px-5 py-4">
                    <p className="text-sm text-white">{market?.question ?? `Market #${pos.marketId}`}</p>
                    <p className="text-xs text-gray-500 mt-1">Ended {market ? new Date(market.endDate).toLocaleDateString() : ''} — awaiting resolution</p>
                  </div>
                )
              })}
            </div>
          )
        )}

        {tab === 'history' && (
          resolved.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-gray-400 text-sm">No resolved positions</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700/10">
              {resolved.map(pos => {
                const market = marketMap.get(pos.marketId)
                const won = pos.side === pos.outcome
                const pnl = won ? pos.payout - pos.shares * pos.avgPrice : -(pos.shares * pos.avgPrice)
                return (
                  <div key={pos.marketId} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-white">{market?.question ?? `Market #${pos.marketId}`}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs">
                          <span className={`px-2 py-0.5 rounded font-medium ${won ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                            {won ? 'WON' : 'LOST'}
                          </span>
                          <span className="text-gray-500">Outcome: {pos.outcome.toUpperCase()}</span>
                        </div>
                      </div>
                      <div className={`text-sm font-medium ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>
    </div>
    </ConnectWalletEmptyState>
  )
}
