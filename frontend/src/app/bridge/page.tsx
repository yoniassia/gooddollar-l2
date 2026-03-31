import Link from 'next/link'

export default function BridgePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 rounded-full bg-dark-50 border border-gray-700/30 flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-goodgreen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      </div>

      <span className="inline-block mb-4 px-3 py-1 text-xs font-medium rounded-full bg-goodgreen/10 text-goodgreen border border-goodgreen/20">
        Coming Soon
      </span>

      <h1 className="text-3xl font-bold text-white mb-3">Cross-Chain Bridge</h1>
      <p className="text-sm text-gray-400 max-w-sm mb-8">
        Bridge assets between Ethereum, L2s, and GoodDollar L2.
        Move G$, ETH, and USDC across chains seamlessly.
      </p>

      <Link
        href="/"
        className="px-6 py-3 rounded-xl bg-goodgreen text-white font-semibold hover:bg-goodgreen-600 transition-colors active:scale-[0.98]"
      >
        Back to Swap
      </Link>
    </div>
  )
}
