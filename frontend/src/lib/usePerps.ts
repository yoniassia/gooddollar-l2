'use client'

/**
 * usePerps — wagmi hooks for GoodPerps PerpEngine on-chain interactions.
 *
 * NOTE: PerpEngine has not yet been deployed to devnet (chain 42069).
 * CONTRACTS.PerpEngine is null until deployment. All hooks return null/empty
 * when the contract address is not set.
 *
 * Wiring is complete — update CONTRACTS.PerpEngine in chain.ts after deployment.
 */

import { useCallback, useState } from 'react'
import { useReadContract, useAccount, useWriteContract } from 'wagmi'
import { PerpEngineABI, ERC20ABI } from './abi'
import { CONTRACTS } from './chain'

const ENGINE = CONTRACTS.PerpEngine

// ─── Read: open position ──────────────────────────────────────────────────────

export interface OnChainPosition {
  size: bigint
  entryPrice: bigint
  isLong: boolean
  collateral: bigint
  sizeFloat: number
  entryPriceFloat: number
  collateralFloat: number
}

export function usePosition(marketId: bigint): {
  position: OnChainPosition | null
  isLoading: boolean
} {
  const { address } = useAccount()
  const result = useReadContract({
    address: ENGINE ?? undefined,
    abi: PerpEngineABI,
    functionName: 'positions',
    args: ENGINE && address ? [address, marketId] : undefined,
    query: { enabled: !!(ENGINE && address), refetchInterval: 10_000 },
  })

  if (!result.data) return { position: null, isLoading: result.isLoading }

  const [size, entryPrice, isLong, collateral] = result.data

  return {
    position: {
      size,
      entryPrice,
      isLong,
      collateral,
      sizeFloat: Number(size) / 1e18,
      entryPriceFloat: Number(entryPrice) / 1e8,
      collateralFloat: Number(collateral) / 1e18,
    },
    isLoading: result.isLoading,
  }
}

// ─── Read: market count ───────────────────────────────────────────────────────

export function usePerpMarketCount(): { count: bigint; isLoading: boolean } {
  const result = useReadContract({
    address: ENGINE ?? undefined,
    abi: PerpEngineABI,
    functionName: 'marketCount',
    query: { enabled: !!ENGINE, refetchInterval: 60_000 },
  })
  return {
    count: (result.data as bigint | undefined) ?? BigInt(0),
    isLoading: result.isLoading,
  }
}

// ─── Write: open position ─────────────────────────────────────────────────────

export type PerpActionPhase = 'idle' | 'approving' | 'pending' | 'done' | 'error'

export function useOpenPosition() {
  const [phase, setPhase] = useState<PerpActionPhase>('idle')
  const [error, setError] = useState<string | null>(null)
  const { writeContractAsync } = useWriteContract()
  const { isConnected } = useAccount()

  const reset = useCallback(() => { setPhase('idle'); setError(null) }, [])

  const openPosition = useCallback(async (
    marketId: bigint,
    collateralAmount: bigint,
    isLong: boolean,
    minPrice: bigint = BigInt(0),
  ) => {
    if (!isConnected) { setError('Wallet not connected'); return }
    if (!ENGINE) { setError('PerpEngine not deployed yet'); return }

    try {
      // Approve G$ collateral spend
      setPhase('approving')
      await writeContractAsync({
        address: CONTRACTS.GoodDollarToken,
        abi: ERC20ABI,
        functionName: 'approve',
        args: [ENGINE, collateralAmount],
      })

      setPhase('pending')
      await writeContractAsync({
        address: ENGINE,
        abi: PerpEngineABI,
        functionName: 'openPosition',
        args: [marketId, collateralAmount, isLong, minPrice],
      })
      setPhase('done')
    } catch (err: unknown) {
      const e = err as { shortMessage?: string; message?: string }
      setError(e?.shortMessage ?? e?.message ?? 'Transaction failed')
      setPhase('error')
    }
  }, [isConnected, writeContractAsync])

  return { openPosition, phase, error, reset, isConnected, isDeployed: !!ENGINE }
}

// ─── Write: close position ────────────────────────────────────────────────────

export function useClosePosition() {
  const [phase, setPhase] = useState<PerpActionPhase>('idle')
  const [error, setError] = useState<string | null>(null)
  const { writeContractAsync } = useWriteContract()
  const { isConnected } = useAccount()

  const reset = useCallback(() => { setPhase('idle'); setError(null) }, [])

  const closePosition = useCallback(async (marketId: bigint) => {
    if (!isConnected) { setError('Wallet not connected'); return }
    if (!ENGINE) { setError('PerpEngine not deployed yet'); return }

    try {
      setPhase('pending')
      await writeContractAsync({
        address: ENGINE,
        abi: PerpEngineABI,
        functionName: 'closePosition',
        args: [marketId],
      })
      setPhase('done')
    } catch (err: unknown) {
      const e = err as { shortMessage?: string; message?: string }
      setError(e?.shortMessage ?? e?.message ?? 'Transaction failed')
      setPhase('error')
    }
  }, [isConnected, writeContractAsync])

  return { closePosition, phase, error, reset, isConnected, isDeployed: !!ENGINE }
}
