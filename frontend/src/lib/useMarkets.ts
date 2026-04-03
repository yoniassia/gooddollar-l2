'use client'

/**
 * useMarkets — wagmi hooks for reading on-chain prediction markets
 * from the MarketFactory contract (chain 42069).
 *
 * Provides:
 *   - useMarketCount(): number of markets on-chain
 *   - useOnChainMarket(marketId): single market data
 *   - useImpliedProbability(marketId): YES probability (1e18-scaled)
 */

import { useReadContract, useReadContracts } from 'wagmi'
import { CONTRACTS } from './chain'
import { MarketFactoryABI } from './abi'

export interface OnChainMarket {
  id: bigint
  question: string
  endTime: bigint
  status: number  // 0=active, 1=resolved_yes, 2=resolved_no
  totalYES: bigint
  totalNO: bigint
  collateral: bigint
  yesPrice: number  // 0-1 float derived from totalYES/(totalYES+totalNO)
  endTimeMs: number  // JS timestamp in ms
  isActive: boolean
  isResolved: boolean
}

// ─── Market count ─────────────────────────────────────────────────────────────

export function useMarketCount(): { count: bigint; isLoading: boolean } {
  const result = useReadContract({
    address: CONTRACTS.MarketFactory,
    abi: MarketFactoryABI,
    functionName: 'marketCount',
    query: { refetchInterval: 30_000 },
  })
  return {
    count: (result.data as bigint | undefined) ?? BigInt(0),
    isLoading: result.isLoading,
  }
}

// ─── Single market ────────────────────────────────────────────────────────────

export function useOnChainMarket(marketId: bigint): {
  market: OnChainMarket | null
  isLoading: boolean
} {
  const result = useReadContract({
    address: CONTRACTS.MarketFactory,
    abi: MarketFactoryABI,
    functionName: 'getMarket',
    args: [marketId],
    query: { refetchInterval: 15_000 },
  })

  const probResult = useReadContract({
    address: CONTRACTS.MarketFactory,
    abi: MarketFactoryABI,
    functionName: 'impliedProbabilityYES',
    args: [marketId],
    query: { refetchInterval: 15_000 },
  })

  if (!result.data) {
    return { market: null, isLoading: result.isLoading }
  }

  const [question, endTime, status, totalYES, totalNO, collateral] = result.data
  const probRaw = (probResult.data as bigint | undefined) ?? BigInt(0)
  const yesPrice = Number(probRaw) / 1e18

  const endTimeMs = Number(endTime) * 1000
  const statusNum = Number(status)

  return {
    market: {
      id: marketId,
      question,
      endTime,
      status: statusNum,
      totalYES,
      totalNO,
      collateral,
      yesPrice,
      endTimeMs,
      isActive: statusNum === 0,
      isResolved: statusNum === 1 || statusNum === 2,
    },
    isLoading: result.isLoading,
  }
}

// ─── All markets (batch read up to N) ────────────────────────────────────────

export function useAllOnChainMarkets(count: bigint): {
  markets: OnChainMarket[]
  isLoading: boolean
} {
  const n = Math.min(Number(count), 20)  // cap at 20 to avoid too many reads

  const marketCalls = Array.from({ length: n }, (_, i) => ({
    address: CONTRACTS.MarketFactory as `0x${string}`,
    abi: MarketFactoryABI,
    functionName: 'getMarket' as const,
    args: [BigInt(i)] as [bigint],
  }))

  const probCalls = Array.from({ length: n }, (_, i) => ({
    address: CONTRACTS.MarketFactory as `0x${string}`,
    abi: MarketFactoryABI,
    functionName: 'impliedProbabilityYES' as const,
    args: [BigInt(i)] as [bigint],
  }))

  const marketResults = useReadContracts({
    contracts: marketCalls,
    query: { enabled: n > 0, refetchInterval: 20_000 },
  })

  const probResults = useReadContracts({
    contracts: probCalls,
    query: { enabled: n > 0, refetchInterval: 20_000 },
  })

  const markets: OnChainMarket[] = []

  if (marketResults.data) {
    for (let i = 0; i < n; i++) {
      const r = marketResults.data[i]
      if (r.status !== 'success' || !r.result) continue

      const [question, endTime, status, totalYES, totalNO, collateral] = r.result as [string, bigint, number, bigint, bigint, bigint]
      const probRaw = probResults.data?.[i]?.result as bigint | undefined
      const yesPrice = probRaw ? Number(probRaw) / 1e18 : 0.5
      const statusNum = Number(status)

      markets.push({
        id: BigInt(i),
        question,
        endTime,
        status: statusNum,
        totalYES,
        totalNO,
        collateral,
        yesPrice,
        endTimeMs: Number(endTime) * 1000,
        isActive: statusNum === 0,
        isResolved: statusNum === 1 || statusNum === 2,
      })
    }
  }

  return {
    markets,
    isLoading: marketResults.isLoading,
  }
}
