'use client'

import { useWalletReady } from '@/lib/WalletReadyContext'
import { WalletButtonConnected } from './WalletButtonConnected'

export function WalletButton() {
  const walletReady = useWalletReady()

  if (!walletReady) {
    return (
      <button
        disabled
        className="px-4 py-2 rounded-xl bg-goodgreen/10 border border-goodgreen/30 text-goodgreen text-sm font-medium opacity-60"
      >
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 border-2 border-goodgreen/40 border-t-goodgreen rounded-full animate-spin" />
          Connect Wallet
        </span>
      </button>
    )
  }

  return <WalletButtonConnected />
}
