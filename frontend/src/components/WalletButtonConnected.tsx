'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'

export function WalletButtonConnected() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const connected = mounted && account && chain

        return (
          <div
            {...(!mounted && {
              'aria-hidden': true,
              style: { opacity: 0, pointerEvents: 'none', userSelect: 'none' },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    className="px-4 py-2 rounded-xl bg-goodgreen/10 border border-goodgreen/30 text-goodgreen text-sm font-medium hover:bg-goodgreen/20 transition-colors"
                  >
                    Connect Wallet
                  </button>
                )
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
                  >
                    Wrong Network
                  </button>
                )
              }

              return (
                <button
                  onClick={openAccountModal}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-dark-50 border border-gray-700/50 hover:border-goodgreen/30 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-goodgreen" />
                  <span className="text-sm text-white font-medium">
                    {account.displayName}
                  </span>
                  <span className="text-xs text-gray-400 hidden sm:inline">
                    {account.displayBalance}
                  </span>
                </button>
              )
            })()}
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}
