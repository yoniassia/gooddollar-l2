'use client'

import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useWalletReady } from '@/lib/WalletReadyContext'

interface ConnectWalletEmptyStateProps {
  title?: string
  description?: string
  children: React.ReactNode
}

function EmptyStateUI({
  title,
  description,
  onConnect,
}: {
  title: string
  description: string
  onConnect?: () => void
}) {
  return (
    <div className="w-full max-w-md mx-auto py-16 sm:py-24 text-center px-4">
      <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-goodgreen/10 border border-goodgreen/20 flex items-center justify-center">
        <svg className="w-8 h-8 text-goodgreen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
          />
        </svg>
      </div>

      <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
      <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">{description}</p>

      <button
        onClick={onConnect}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-goodgreen text-white font-semibold text-sm hover:bg-goodgreen-600 transition-colors focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:outline-none"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        Connect Wallet
      </button>

      <p className="text-xs text-gray-600 mt-6">
        Track your Stocks &bull; Predictions &bull; Perpetual Futures &mdash; all in one place
      </p>
    </div>
  )
}

function WalletGate({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  const { isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()

  if (isConnected) return <>{children}</>

  return <EmptyStateUI title={title} description={description} onConnect={openConnectModal} />
}

export function ConnectWalletEmptyState({
  title = 'Connect Your Wallet',
  description = 'Connect your wallet to view your positions across stocks, predictions, and perpetual futures.',
  children,
}: ConnectWalletEmptyStateProps) {
  const walletReady = useWalletReady()

  if (!walletReady) return <>{children}</>

  return (
    <WalletGate title={title} description={description}>
      {children}
    </WalletGate>
  )
}
