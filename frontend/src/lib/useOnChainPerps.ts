'use client'

/**
 * useOnChainPerps — reads perpetual futures data from PerpEngine + MarginVault on-chain.
 *
 * Replaces mock data from perpsData.ts with real contract reads.
 * Falls back to empty arrays when no on-chain data is available.
 *
 * PerpEngine (chain 42069): markets, positions, unrealized PnL
 * MarginVault: deposited margin balances
 */

import { useMemo } from 'react'
import { useReadContract, useReadContracts, useAccount } from 'wagmi'
import { PerpEngineABI, MarginVaultABI } from './abi'
import { CONTRACTS } from './chain'
import type { PerpPair, AccountSummaryData, OpenPosition } from './perpsData'

const ENGINE = CONTRACTS.PerpEngine
const VAULT = CONTRACTS.MarginVault

// ─── Static market metadata (pairs the PerpEngine supports) ──────────────────
// The on-chain PerpEngine stores markets by ID with a bytes32 key.
// We map known market IDs to human-readable pair info.
const MARKET_META: Record<number, { symbol: string; baseAsset: string; quoteAsset: string; maxLeverage: number }> = {
  0: { symbol: 'BTC-USD', baseAsset: 'BTC', quoteAsset: 'USD', maxLeverage: 50 },
  1: { symbol: 'ETH-USD', baseAsset: 'ETH', quoteAsset: 'USD', maxLeverage: 50 },
  2: { symbol: 'G$-USD', baseAsset: 'G$', quoteAsset: 'USD', maxLeverage: 20 },
  3: { symbol: 'SOL-USD', baseAsset: 'SOL', quoteAsset: 'USD', maxLeverage: 50 },
  4: { symbol: 'LINK-USD', baseAsset: 'LINK', quoteAsset: 'USD', maxLeverage: 30 },
}

// ─── Read all markets ─────────────────────────────────────────────────────────

export function useOnChainPairs(): { pairs: PerpPair[]; isLoading: boolean; isLive: boolean } {
  const countResult = useReadContract({
    address: ENGINE,
    abi: PerpEngineABI,
    functionName: 'marketCount',
    query: { refetchInterval: 60_000 },
  })

  const count = Number((countResult.data as bigint | undefined) ?? BigInt(0))
  const maxRead = Math.min(count, 10)

  const contracts = useMemo(() => {
    if (maxRead === 0) return []
    return Array.from({ length: maxRead }, (_, i) => ({
      address: ENGINE as `0x${string}`,
      abi: PerpEngineABI,
      functionName: 'markets' as const,
      args: [BigInt(i)] as [bigint],
    }))
  }, [maxRead])

  const { data, isLoading } = useReadContracts({
    contracts,
    query: { enabled: maxRead > 0, refetchInterval: 30_000 },
  })

  const pairs = useMemo<PerpPair[]>(() => {
    if (!data || data.length === 0) return []

    const result: PerpPair[] = []
    for (let i = 0; i < data.length; i++) {
      const r = data[i]
      if (r.status !== 'success' || !r.result) continue
      const [, maxLeverage, isActive] = r.result as [string, bigint, boolean]
      if (!isActive) continue

      const meta = MARKET_META[i] ?? {
        symbol: `MKT-${i}`,
        baseAsset: `MKT${i}`,
        quoteAsset: 'USD',
        maxLeverage: 10,
      }

      result.push({
        symbol: meta.symbol,
        baseAsset: meta.baseAsset,
        quoteAsset: meta.quoteAsset,
        markPrice: 0,      // mark price requires oracle read — filled by backend/keeper
        indexPrice: 0,
        change24h: 0,
        volume24h: 0,
        fundingRate: 0,
        nextFundingTime: Date.now() + 8 * 3600 * 1000,
        openInterest: 0,
        maxLeverage: Number(maxLeverage),
      })
    }
    return result
  }, [data])

  return { pairs, isLoading, isLive: pairs.length > 0 }
}

// ─── Read user positions across all markets ──────────────────────────────────

export function useOnChainPositions(): {
  positions: OpenPosition[]
  isLoading: boolean
} {
  const { address } = useAccount()
  const { pairs } = useOnChainPairs()

  const contracts = useMemo(() => {
    if (!address || pairs.length === 0) return []
    return pairs.flatMap((_, i) => [
      {
        address: ENGINE as `0x${string}`,
        abi: PerpEngineABI,
        functionName: 'positions' as const,
        args: [address, BigInt(i)] as [string, bigint],
      },
      {
        address: ENGINE as `0x${string}`,
        abi: PerpEngineABI,
        functionName: 'unrealizedPnL' as const,
        args: [address, BigInt(i)] as [string, bigint],
      },
    ])
  }, [address, pairs.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const { data, isLoading } = useReadContracts({
    contracts,
    query: { enabled: contracts.length > 0, refetchInterval: 10_000 },
  })

  const positions = useMemo<OpenPosition[]>(() => {
    if (!data || data.length === 0) return []

    const result: OpenPosition[] = []
    for (let i = 0; i < pairs.length; i++) {
      const posResult = data[i * 2]
      const pnlResult = data[i * 2 + 1]
      if (posResult?.status !== 'success' || !posResult.result) continue

      const [size, entryPrice, isLong, collateral] = posResult.result as [bigint, bigint, boolean, bigint]
      if (size === BigInt(0)) continue // no position

      const pnl = pnlResult?.status === 'success' ? Number(pnlResult.result as bigint) / 1e18 : 0
      const sizeFloat = Number(size) / 1e18
      const entryFloat = Number(entryPrice) / 1e8
      const collFloat = Number(collateral) / 1e18
      const leverage = collFloat > 0 ? Math.round(sizeFloat * entryFloat / collFloat) : 1

      result.push({
        pair: pairs[i].symbol,
        side: isLong ? 'long' : 'short',
        size: sizeFloat,
        leverage,
        entryPrice: entryFloat,
        markPrice: entryFloat, // TODO: read from oracle
        liquidationPrice: 0,
        unrealizedPnl: pnl,
        margin: collFloat,
        marginMode: 'cross',
      })
    }
    return result
  }, [data, pairs])

  return { positions, isLoading }
}

// ─── Read user account summary from MarginVault ──────────────────────────────

export function useOnChainAccountSummary(): {
  summary: AccountSummaryData
  isLoading: boolean
} {
  const { address } = useAccount()
  const { positions } = useOnChainPositions()

  const balResult = useReadContract({
    address: VAULT,
    abi: MarginVaultABI,
    functionName: 'balances',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10_000 },
  })

  const summary = useMemo<AccountSummaryData>(() => {
    const balance = balResult.data ? Number(balResult.data as bigint) / 1e18 : 0
    const unrealizedPnl = positions.reduce((sum, p) => sum + p.unrealizedPnl, 0)
    const equity = balance + unrealizedPnl
    const marginUsed = positions.reduce((sum, p) => sum + p.margin, 0)
    const availableMargin = Math.max(0, equity - marginUsed)
    const marginRatio = equity > 0 ? marginUsed / equity : 0

    return { balance, equity, unrealizedPnl, marginUsed, availableMargin, marginRatio }
  }, [balResult.data, positions])

  return { summary, isLoading: balResult.isLoading }
}
