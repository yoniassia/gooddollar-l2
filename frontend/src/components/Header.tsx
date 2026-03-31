'use client'

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
          <a href="/" className="text-white font-medium">Swap</a>
          <span className="cursor-not-allowed opacity-40">Pool</span>
          <span className="cursor-not-allowed opacity-40">Bridge</span>
        </nav>

        <button
          className="px-4 py-2 rounded-xl bg-goodgreen/10 border border-goodgreen/30 text-goodgreen text-sm font-medium hover:bg-goodgreen/20 transition-colors"
          disabled
        >
          Connect Wallet
        </button>
      </div>
    </header>
  )
}
