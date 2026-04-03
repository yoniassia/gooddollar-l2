'use client'

/**
 * useGoodLend — wagmi hooks for GoodLendPool on-chain interaction.
 *
 * Provides:
 *   - useReserveData(assetAddress): live reserve data (supply/borrow rates, TVL)
 *   - useUserAccountData(userAddress): health factor, collateral, debt
 *   - useSupply / useWithdraw / useBorrow / useRepay: write hooks
 *
 * Falls back to mock data when the wallet is not connected or the
 * devnet is unreachable (so the UI always renders something useful).
 */

import { useReadContract, useWriteContract, useAccount, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, maxUint256 } from 'viem'
import { GoodLendPoolABI, ERC20ABI } from './abi'
import { CONTRACTS } from './chain'

const POOL = CONTRACTS.GoodLendPool
const RAY = BigInt('1000000000000000000000000000') as bigint // 1e27

// ─── Read: reserve data ───────────────────────────────────────────────────────

export interface OnChainReserveData {
  totalDeposits: bigint
  totalBorrows: bigint
  liquidityIndex: bigint
  borrowIndex: bigint
  supplyRate: bigint    // RAY-scaled annual rate
  borrowRate: bigint
  accruedToTreasury: bigint
  supplyAPY: number     // human-readable (0.05 = 5%)
  borrowAPY: number
  utilization: number
}

export function useReserveData(assetAddress: `0x${string}` | undefined): {
  data: OnChainReserveData | null
  isLoading: boolean
  error: Error | null
} {
  const result = useReadContract({
    address: POOL,
    abi: GoodLendPoolABI,
    functionName: 'getReserveData',
    args: assetAddress ? [assetAddress] : undefined,
    query: { enabled: !!assetAddress, refetchInterval: 15_000 },
  })

  if (!result.data) {
    return { data: null, isLoading: result.isLoading, error: result.error as Error | null }
  }

  const [totalDeposits, totalBorrows, liquidityIndex, borrowIndex, supplyRate, borrowRate, accruedToTreasury] = result.data

  const ZERO = BigInt(0)
  const supplyAPY = supplyRate === ZERO ? 0 : Number(supplyRate) / Number(RAY)
  const borrowAPY = borrowRate === ZERO ? 0 : Number(borrowRate) / Number(RAY)
  const utilization = totalDeposits === ZERO ? 0 : Number(totalBorrows) / Number(totalDeposits)

  return {
    data: { totalDeposits, totalBorrows, liquidityIndex, borrowIndex, supplyRate, borrowRate, accruedToTreasury, supplyAPY, borrowAPY, utilization },
    isLoading: result.isLoading,
    error: result.error as Error | null,
  }
}

// ─── Read: user account data ──────────────────────────────────────────────────

export interface OnChainAccountData {
  healthFactor: bigint
  totalCollateralUSD: bigint
  totalDebtUSD: bigint
  healthFactorFloat: number
  totalCollateralFloat: number
  totalDebtFloat: number
  isHealthy: boolean
  isAtRisk: boolean
}

export function useUserAccountData(userAddress: `0x${string}` | undefined): {
  data: OnChainAccountData | null
  isLoading: boolean
} {
  const result = useReadContract({
    address: POOL,
    abi: GoodLendPoolABI,
    functionName: 'getUserAccountData',
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress, refetchInterval: 15_000 },
  })

  if (!result.data) return { data: null, isLoading: result.isLoading }

  const [healthFactor, totalCollateralUSD, totalDebtUSD] = result.data

  const healthFactorFloat = healthFactor === maxUint256 ? Infinity : Number(healthFactor) / Number(RAY)
  const totalCollateralFloat = Number(totalCollateralUSD) / 1e8
  const totalDebtFloat = Number(totalDebtUSD) / 1e8

  return {
    data: {
      healthFactor,
      totalCollateralUSD,
      totalDebtUSD,
      healthFactorFloat,
      totalCollateralFloat,
      totalDebtFloat,
      isHealthy: healthFactorFloat >= 1.0,
      isAtRisk: healthFactorFloat < 1.2,
    },
    isLoading: result.isLoading,
  }
}

// ─── Read: ERC20 allowance ────────────────────────────────────────────────────

export function useAllowance(
  tokenAddress: `0x${string}` | undefined,
  ownerAddress: `0x${string}` | undefined,
): { allowance: bigint; isLoading: boolean } {
  const result = useReadContract({
    address: tokenAddress,
    abi: ERC20ABI,
    functionName: 'allowance',
    args: tokenAddress && ownerAddress ? [ownerAddress, POOL] : undefined,
    query: { enabled: !!(tokenAddress && ownerAddress), refetchInterval: 10_000 },
  })

  return {
    allowance: (result.data as bigint | undefined) ?? BigInt(0),
    isLoading: result.isLoading,
  }
}

// ─── Write: approve ───────────────────────────────────────────────────────────

export function useApprove() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const approve = (tokenAddress: `0x${string}`, amount: bigint = maxUint256) => {
    writeContract({
      address: tokenAddress,
      abi: ERC20ABI,
      functionName: 'approve',
      args: [POOL, amount],
    })
  }

  return { approve, isPending, isConfirming, isSuccess, error }
}

// ─── Write: supply ────────────────────────────────────────────────────────────

export function useSupply() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const supply = (assetAddress: `0x${string}`, amount: bigint) => {
    writeContract({
      address: POOL,
      abi: GoodLendPoolABI,
      functionName: 'supply',
      args: [assetAddress, amount],
    })
  }

  return { supply, isPending, isConfirming, isSuccess, error }
}

// ─── Write: withdraw ──────────────────────────────────────────────────────────

export function useWithdraw() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const withdraw = (assetAddress: `0x${string}`, amount: bigint) => {
    writeContract({
      address: POOL,
      abi: GoodLendPoolABI,
      functionName: 'withdraw',
      args: [assetAddress, amount],
    })
  }

  return { withdraw, isPending, isConfirming, isSuccess, error }
}

// ─── Write: borrow ────────────────────────────────────────────────────────────

export function useBorrow() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const borrow = (assetAddress: `0x${string}`, amount: bigint) => {
    writeContract({
      address: POOL,
      abi: GoodLendPoolABI,
      functionName: 'borrow',
      args: [assetAddress, amount],
    })
  }

  return { borrow, isPending, isConfirming, isSuccess, error }
}

// ─── Write: repay ─────────────────────────────────────────────────────────────

export function useRepay() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const repay = (assetAddress: `0x${string}`, amount: bigint) => {
    writeContract({
      address: POOL,
      abi: GoodLendPoolABI,
      functionName: 'repay',
      args: [assetAddress, amount],
    })
  }

  return { repay, isPending, isConfirming, isSuccess, error }
}

// ─── Helper: format amount with decimals ──────────────────────────────────────

export function parseTokenAmount(amount: string, decimals: number): bigint {
  if (!amount || isNaN(parseFloat(amount))) return BigInt(0)
  try {
    return parseUnits(amount, decimals)
  } catch {
    return BigInt(0)
  }
}

export function formatTokenAmount(amount: bigint, decimals: number): number {
  if (amount === BigInt(0)) return 0
  return Number(amount) / Math.pow(10, decimals)
}

// ─── Connected account helper ─────────────────────────────────────────────────

export function useConnectedAccount() {
  const { address, isConnected } = useAccount()
  return { address: address as `0x${string}` | undefined, isConnected }
}
