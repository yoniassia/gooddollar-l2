import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { SwapCard } from '@/components/SwapCard'

const HowItWorks = dynamic(
  () => import('@/components/HowItWorks').then(m => ({ default: m.HowItWorks }))
)
const StartSwappingCTA = dynamic(
  () => import('@/components/StartSwappingCTA').then(m => ({ default: m.StartSwappingCTA }))
)
const StatsRow = dynamic(
  () => import('@/components/StatsRow').then(m => ({ default: m.StatsRow }))
)
const LandingFooter = dynamic(
  () => import('@/components/LandingFooter').then(m => ({ default: m.LandingFooter }))
)

export default function Home() {
  return (
    <div className="w-full flex flex-col items-center relative">
      {/* Hero glow effect */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[400px] opacity-[0.07] rounded-full blur-[100px]"
        style={{ background: 'radial-gradient(ellipse at center, #00B0A0 0%, transparent 70%)' }}
      />

      <div className="mb-8 text-center max-w-md relative">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Trade. Predict. Invest. Fund UBI.
        </h1>
        <p className="text-sm text-gray-400">
          Every swap, prediction, and trade on GoodDollar automatically funds universal basic income for verified humans worldwide.
        </p>
      </div>

      {/* Swap card wrapper with glow */}
      <div className="relative w-full max-w-[460px]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -m-4 opacity-[0.06] rounded-3xl blur-[60px]"
          style={{ background: 'radial-gradient(ellipse at center, #00B0A0 0%, transparent 70%)' }}
        />
        <Suspense
          fallback={
            <div className="w-full max-w-[460px] bg-dark-100 rounded-2xl border border-gray-700/20 p-6 animate-pulse">
              <div className="flex justify-between mb-6">
                <div className="h-6 w-16 bg-dark-50/50 rounded" />
                <div className="h-6 w-32 bg-dark-50/30 rounded-full" />
              </div>
              <div className="bg-dark-50/30 rounded-xl p-4 mb-2">
                <div className="h-4 w-16 bg-dark-50/40 rounded mb-3" />
                <div className="h-10 w-24 bg-dark-50/40 rounded" />
              </div>
              <div className="flex justify-center py-2">
                <div className="w-8 h-8 rounded-full bg-dark-50/40" />
              </div>
              <div className="bg-dark-50/30 rounded-xl p-4 mb-4">
                <div className="h-4 w-20 bg-dark-50/40 rounded mb-3" />
                <div className="h-10 w-24 bg-dark-50/40 rounded" />
              </div>
              <div className="h-12 w-full bg-dark-50/40 rounded-xl" />
            </div>
          }
        >
          <SwapCard />
        </Suspense>
      </div>

      <HowItWorks />
      <StartSwappingCTA />
      <StatsRow />
      <LandingFooter />
    </div>
  )
}
