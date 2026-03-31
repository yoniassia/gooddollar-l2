'use client'

import Link from 'next/link'
import { WalletButton } from './WalletButton'

export function Header() {
  return (
    <header className="w-full border-b border-dark-50/50 bg-dark-100/80 backdrop-blur-md">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 h-16">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-goodgreen flex items-center justify-center font-bold text-dark text-sm">
            G$
          </div>
          <span className="text-lg font-semibold text-white">GoodSwap</span>
        </div>

        <nav className="hidden sm:flex items-center gap-6 text-sm text-gray-400">
          <Link href="/" className="text-white font-medium">Swap</Link>
          <span className="relative group cursor-default">
            <span className="opacity-40">Pool</span>
            <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2.5 py-1 rounded-lg bg-dark-50 border border-gray-700/50 text-xs text-gray-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Coming Soon
            </span>
          </span>
          <span className="relative group cursor-default">
            <span className="opacity-40">Bridge</span>
            <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2.5 py-1 rounded-lg bg-dark-50 border border-gray-700/50 text-xs text-gray-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Coming Soon
            </span>
          </span>
        </nav>

        <WalletButton />
      </div>
    </header>
  )
}
