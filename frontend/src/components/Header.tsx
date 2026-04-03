'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { WalletButton } from './WalletButton'
import { ActivityButton } from './ActivityButton'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const isSwap = pathname === '/'
  const isExplore = pathname === '/explore'
  const isPool = pathname === '/pool'
  const isBridge = pathname === '/bridge'
  const isStocks = pathname?.startsWith('/stocks')
  const isPredict = pathname?.startsWith('/predict')
  const isPerps = pathname?.startsWith('/perps')
  const isPortfolio = pathname === '/portfolio'

  useEffect(() => {
    if (!mobileMenuOpen) return

    document.body.style.overflow = 'hidden'

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [mobileMenuOpen])

  return (
    <header className="w-full border-b border-dark-50/50 bg-dark-100/80 backdrop-blur-md">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 h-16">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-goodgreen flex items-center justify-center font-bold text-dark text-sm">
            G$
          </div>
          <span className="text-lg font-semibold text-white">GoodDollar</span>
        </div>

        <nav className="hidden sm:flex items-center gap-6 text-sm text-gray-400">
          <Link href="/" className={isSwap ? 'text-white font-medium' : 'hover:text-white transition-colors'}>Swap</Link>
          <Link href="/explore" className={isExplore ? 'text-white font-medium' : 'hover:text-white transition-colors'}>Explore</Link>
          <Link href="/pool" className={`relative group flex items-center gap-1.5 ${isPool ? 'text-white font-medium' : 'opacity-60 hover:opacity-80 transition-opacity'}`}>
            Pool
            <span data-testid="soon-badge" className="text-[10px] leading-none text-goodgreen/60 bg-goodgreen/10 px-1.5 py-0.5 rounded-full">Soon</span>
            {!isPool && (
              <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2.5 py-1 rounded-lg bg-dark-50 border border-gray-700/50 text-xs text-gray-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Coming Soon
              </span>
            )}
          </Link>
          <Link href="/bridge" className={`relative group flex items-center gap-1.5 ${isBridge ? 'text-white font-medium' : 'opacity-60 hover:opacity-80 transition-opacity'}`}>
            Bridge
            <span data-testid="soon-badge" className="text-[10px] leading-none text-goodgreen/60 bg-goodgreen/10 px-1.5 py-0.5 rounded-full">Soon</span>
            {!isBridge && (
              <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2.5 py-1 rounded-lg bg-dark-50 border border-gray-700/50 text-xs text-gray-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Coming Soon
              </span>
            )}
          </Link>
          <Link href="/stocks" className={isStocks ? 'text-white font-medium' : 'hover:text-white transition-colors'}>Stocks</Link>
          <Link href="/predict" className={isPredict ? 'text-white font-medium' : 'hover:text-white transition-colors'}>Predict</Link>
          <Link href="/perps" className={isPerps ? 'text-white font-medium' : 'hover:text-white transition-colors'}>Perps</Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/portfolio"
            aria-label="Portfolio"
            className={`p-2 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:outline-none ${isPortfolio ? 'text-white bg-dark-50' : 'text-gray-400 hover:text-white hover:bg-dark-50'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </Link>
          <ActivityButton />
          <button
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileMenuOpen(o => !o)}
            className="sm:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-50 transition-colors focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:outline-none"
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
          <WalletButton />
        </div>
      </div>

      {mobileMenuOpen && (
        <>
        <div
          className="fixed inset-0 z-40 bg-black/50 sm:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
        <div
          ref={menuRef}
          data-testid="mobile-nav"
          className="sm:hidden border-t border-dark-50/50 bg-dark-100 backdrop-blur-md animate-in slide-in-from-top-2 duration-200 relative z-50"
        >
          <nav className="flex flex-col px-4 py-3 gap-1">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${isSwap ? 'text-white font-medium bg-dark-50/50' : 'text-gray-400 hover:text-white'}`}
            >
              Swap
            </Link>
            <Link
              href="/explore"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${isExplore ? 'text-white font-medium bg-dark-50/50' : 'text-gray-400 hover:text-white'}`}
            >
              Explore
            </Link>
            <Link
              href="/pool"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${isPool ? 'text-white font-medium bg-dark-50/50' : 'text-gray-400 hover:text-white'}`}
            >
              <span className={isPool ? '' : 'opacity-60'}>Pool</span>
              <span className="text-xs text-goodgreen/60 bg-goodgreen/10 px-2 py-0.5 rounded-full">Coming Soon</span>
            </Link>
            <Link
              href="/bridge"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${isBridge ? 'text-white font-medium bg-dark-50/50' : 'text-gray-400 hover:text-white'}`}
            >
              <span className={isBridge ? '' : 'opacity-60'}>Bridge</span>
              <span className="text-xs text-goodgreen/60 bg-goodgreen/10 px-2 py-0.5 rounded-full">Coming Soon</span>
            </Link>
            <Link
              href="/stocks"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${isStocks ? 'text-white font-medium bg-dark-50/50' : 'text-gray-400 hover:text-white'}`}
            >
              Stocks
            </Link>
            <Link
              href="/predict"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${isPredict ? 'text-white font-medium bg-dark-50/50' : 'text-gray-400 hover:text-white'}`}
            >
              Predict
            </Link>
            <Link
              href="/perps"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${isPerps ? 'text-white font-medium bg-dark-50/50' : 'text-gray-400 hover:text-white'}`}
            >
              Perps
            </Link>
            <div className="border-t border-dark-50/50 my-1" />
            <Link
              href="/portfolio"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${isPortfolio ? 'text-white font-medium bg-dark-50/50' : 'text-gray-400 hover:text-white'}`}
            >
              Portfolio
            </Link>
          </nav>
        </div>
        </>
      )}
    </header>
  )
}
