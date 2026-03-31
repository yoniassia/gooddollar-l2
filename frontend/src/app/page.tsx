import { SwapCard } from '@/components/SwapCard'
import { HowItWorks } from '@/components/HowItWorks'
import { StatsRow } from '@/components/StatsRow'
import { LandingFooter } from '@/components/LandingFooter'

export default function Home() {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="mb-8 text-center max-w-md">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Swap. Fund UBI.
        </h1>
        <p className="text-sm text-gray-400">
          Every trade on GoodSwap automatically funds universal basic income for verified humans worldwide.
        </p>
      </div>
      <SwapCard />
      <HowItWorks />
      <StatsRow />
      <LandingFooter />
    </div>
  )
}
