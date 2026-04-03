'use client'

import { useWalletReady } from '@/lib/WalletReadyContext'
import { WalletButtonConnected } from './WalletButtonConnected'

export function WalletButton() {
  const walletReady = useWalletReady()

  if (!walletReady) {
    return (
      <button
        disabled
        className="px-2.5 sm:px-4 py-2 rounded-xl bg-goodgreen/10 border border-goodgreen/30 text-goodgreen text-sm font-medium opacity-60 whitespace-nowrap"
      >
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 border-2 border-goodgreen/40 border-t-goodgreen rounded-full animate-spin" />
          <span className="hidden sm:inline">Connect Wallet</span>
          <svg className="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </span>
      </button>
    )
  }

  return <WalletButtonConnected />
}
