import { Suspense } from 'react'
import { SwapCard } from '@/components/SwapCard'
import { HowItWorks } from '@/components/HowItWorks'
import { StartSwappingCTA } from '@/components/StartSwappingCTA'
import { StatsRow } from '@/components/StatsRow'
import { LandingFooter } from '@/components/LandingFooter'

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
          Swap. Fund UBI.
        </h1>
        <p className="text-sm text-gray-400">
          Every trade on GoodSwap automatically funds universal basic income for verified humans worldwide.
        </p>
      </div>

      {/* Swap card wrapper with glow */}
      <div className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -m-4 opacity-[0.06] rounded-3xl blur-[60px]"
          style={{ background: 'radial-gradient(ellipse at center, #00B0A0 0%, transparent 70%)' }}
        />
        <Suspense>
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
