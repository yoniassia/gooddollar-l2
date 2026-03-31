'use client'

import { useTransactionContext } from '@/lib/TransactionContext'
import { TokenIcon } from './TokenIcon'
import type { Transaction } from '@/lib/useTransactions'

function relativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function StatusIcon({ status }: { status: Transaction['status'] }) {
  if (status === 'pending') {
    return (
      <div className="w-5 h-5 rounded-full border-2 border-goodgreen border-t-transparent animate-spin" />
    )
  }
  if (status === 'confirmed') {
    return (
      <div className="w-5 h-5 rounded-full bg-goodgreen/20 flex items-center justify-center">
        <svg className="w-3 h-3 text-goodgreen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    )
  }
  return (
    <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
      <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
  )
}

function TransactionRow({ tx }: { tx: Transaction }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-dark-50/40 transition-colors">
      <div className="flex items-center -space-x-1.5">
        <TokenIcon symbol={tx.inputSymbol} size={20} />
        <TokenIcon symbol={tx.outputSymbol} size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">
          Swap {tx.inputAmount} {tx.inputSymbol} for {tx.outputAmount} {tx.outputSymbol}
        </p>
        <p className="text-xs text-gray-500">{relativeTime(tx.timestamp)}</p>
      </div>
      <StatusIcon status={tx.status} />
    </div>
  )
}

interface TransactionPanelProps {
  onClose: () => void
}

export function TransactionPanel({ onClose }: TransactionPanelProps) {
  const { transactions, clearAll } = useTransactionContext()

  return (
    <div
      data-testid="transaction-panel"
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-dark-100 border border-gray-700/40 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/20">
        <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
        {transactions.length > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto">
        {transactions.length === 0 ? (
          <div className="py-10 text-center">
            <svg className="w-8 h-8 mx-auto text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-gray-500">No recent transactions</p>
          </div>
        ) : (
          transactions.map(tx => <TransactionRow key={tx.id} tx={tx} />)
        )}
      </div>
    </div>
  )
}
