'use client'

import { useState, useCallback, useMemo } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { TokenSelector, Token, TOKENS } from './TokenSelector'
import { UBIBreakdown } from './UBIBreakdown'
import { SwapSettings } from './SwapSettings'
import { SwapDetails } from './SwapDetails'
import { TxStatus } from './TxStatus'
import { CONTRACTS } from '@/lib/chain'
import { GoodDollarTokenABI, UBIFeeHookABI } from '@/lib/abi'
import { formatAmount, compactAmount, sanitizeNumericInput } from '@/lib/format'
import { useSwapSettings } from '@/lib/useSwapSettings'

const MOCK_RATES: Record<string, Record<string, number>> = {
  'G$':   { 'ETH': 0.00001,  'USDC': 0.01,    'G$': 1 },
  'ETH':  { 'G$': 100000,    'USDC': 3000,     'ETH': 1 },
  'USDC': { 'G$': 100,       'ETH': 0.000333,  'USDC': 1 },
}

const SWAP_FEE_BPS = 30
const UBI_FEE_BPS = 3333

export function SwapCard() {
  const { address, isConnected } = useAccount()
  const { slippage } = useSwapSettings()
  const [inputToken, setInputToken] = useState<Token>(TOKENS[1])
  const [outputToken, setOutputToken] = useState<Token>(TOKENS[0])
  const [inputAmount, setInputAmount] = useState('')
  const [showTxStatus, setShowTxStatus] = useState(false)

  // Read G$ balance if connected
  const { data: gdBalance } = useReadContract({
    address: CONTRACTS.GoodDollarToken,
    abi: GoodDollarTokenABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  })

  // Read UBI fee percentage from hook
  const { data: ubiFeeShareBPS } = useReadContract({
    address: CONTRACTS.UBIFeeHook,
    abi: UBIFeeHookABI,
    functionName: 'ubiFeeShareBPS',
  })

  // Write: approve token
  const { writeContract: approve, data: approveTxHash, isPending: isApproving } = useWriteContract()

  // Write: swap (simplified - in production this would call the router)
  const { writeContract: swap, data: swapTxHash, isPending: isSwapping } = useWriteContract()

  // Wait for tx confirmation
  const { isLoading: isConfirming, isSuccess: isTxSuccess, isError: isTxError } = useWaitForTransactionReceipt({
    hash: swapTxHash || approveTxHash,
  })

  const rawOutputAmount = useMemo(() => {
    const amt = parseFloat(inputAmount)
    if (!amt || isNaN(amt)) return 0
    const rate = MOCK_RATES[inputToken.symbol]?.[outputToken.symbol] ?? 0
    const gross = amt * rate
    const fee = gross * (SWAP_FEE_BPS / 10000)
    return gross - fee
  }, [inputAmount, inputToken.symbol, outputToken.symbol])

  const outputAmount = useMemo(() => {
    if (!rawOutputAmount) return ''
    return formatAmount(rawOutputAmount, outputToken.symbol === 'USDC' ? 2 : 6)
  }, [rawOutputAmount, outputToken.symbol])

  const compactOutputAmount = useMemo(() => {
    if (!rawOutputAmount) return ''
    return compactAmount(rawOutputAmount, 6)
  }, [rawOutputAmount])

  const ubiFee = useMemo(() => {
    const amt = parseFloat(inputAmount)
    if (!amt || isNaN(amt)) return 0
    const rate = MOCK_RATES[inputToken.symbol]?.[outputToken.symbol] ?? 0
    const gross = amt * rate
    const swapFee = gross * (SWAP_FEE_BPS / 10000)
    const actualUbiBps = ubiFeeShareBPS ? Number(ubiFeeShareBPS) : UBI_FEE_BPS
    return swapFee * (actualUbiBps / 10000)
  }, [inputAmount, inputToken.symbol, outputToken.symbol, ubiFeeShareBPS])

  const priceImpact = useMemo(() => {
    const amt = parseFloat(inputAmount)
    if (!amt || isNaN(amt)) return 0
    if (amt < 1) return 0.01
    if (amt < 10) return 0.1 + (amt / 10) * 0.2
    if (amt < 100) return 0.3 + (amt / 100) * 1.5
    return Math.min(0.3 + (amt / 100) * 1.5, 15)
  }, [inputAmount])

  const minimumReceived = useMemo(() => {
    if (!rawOutputAmount) return ''
    const min = rawOutputAmount * (1 - slippage / 100)
    return formatAmount(min, outputToken.symbol === 'USDC' ? 2 : 6)
  }, [rawOutputAmount, slippage, outputToken.symbol])

  const exchangeRate = useMemo(() => {
    const rate = MOCK_RATES[inputToken.symbol]?.[outputToken.symbol] ?? 0
    if (rate >= 1000) return `1 ${inputToken.symbol} = ${rate.toLocaleString()} ${outputToken.symbol}`
    if (rate >= 1) return `1 ${inputToken.symbol} = ${rate.toFixed(2)} ${outputToken.symbol}`
    return `1 ${inputToken.symbol} = ${rate.toFixed(6)} ${outputToken.symbol}`
  }, [inputToken.symbol, outputToken.symbol])

  const [flipRotation, setFlipRotation] = useState(0)

  const handleFlip = useCallback(() => {
    setInputToken(outputToken)
    setOutputToken(inputToken)
    setFlipRotation(r => r + 180)
  }, [inputToken, outputToken])

  const handleInputSelect = useCallback((t: Token) => {
    if (t.symbol === outputToken.symbol) setOutputToken(inputToken)
    setInputToken(t)
  }, [inputToken, outputToken])

  const handleOutputSelect = useCallback((t: Token) => {
    if (t.symbol === inputToken.symbol) setInputToken(outputToken)
    setOutputToken(t)
  }, [inputToken, outputToken])

  const handleSwap = useCallback(() => {
    if (!isConnected || !inputAmount) return
    setShowTxStatus(true)

    // For G$ token swaps, first approve then swap
    if (inputToken.symbol === 'G$') {
      approve({
        address: CONTRACTS.GoodDollarToken,
        abi: GoodDollarTokenABI,
        functionName: 'approve',
        args: [CONTRACTS.UBIFeeHook, parseEther(inputAmount)],
      })
    }
  }, [isConnected, inputAmount, inputToken.symbol, approve])

  const formattedBalance = useMemo(() => {
    if (!gdBalance) return null
    const formatted = formatEther(gdBalance)
    const num = parseFloat(formatted)
    if (num > 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toFixed(2)
  }, [gdBalance])

  const hasAmount = !!inputAmount && parseFloat(inputAmount) > 0
  const isPending = isApproving || isSwapping || isConfirming

  return (
    <div className="w-full max-w-[460px]">
      <div className="bg-dark-100 rounded-2xl border border-gray-700/30 shadow-xl overflow-hidden">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Swap</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 bg-dark-50 px-2.5 py-1 rounded-lg">0.3% fee</span>
            <SwapSettings />
          </div>
        </div>

        {/* Input */}
        <div className="mx-4 p-4 rounded-xl bg-dark/80 border border-gray-700/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">You pay</span>
            {isConnected && inputToken.symbol === 'G$' && formattedBalance && (
              <button
                onClick={() => gdBalance && setInputAmount(formatEther(gdBalance))}
                className="text-xs text-goodgreen hover:text-goodgreen-300 transition-colors"
              >
                Balance: {formattedBalance} G$
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={inputAmount}
              onChange={e => setInputAmount(sanitizeNumericInput(e.target.value))}
              className="flex-1 bg-transparent text-3xl font-medium text-white outline-none placeholder:text-gray-500 min-w-0 focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:ring-offset-1 focus-visible:ring-offset-dark rounded-lg"
            />
            <TokenSelector
              selected={inputToken}
              onSelect={handleInputSelect}
              exclude={outputToken.symbol}
            />
          </div>
        </div>

        {/* Flip */}
        <div className="flex justify-center -my-3 relative z-10">
          <button
            onClick={handleFlip}
            className="w-10 h-10 rounded-xl bg-dark-100 border border-gray-700/50 flex items-center justify-center hover:border-goodgreen/50 hover:text-goodgreen transition-colors text-gray-400 focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:outline-none"
          >
            <svg
              className="w-5 h-5 transition-transform duration-200"
              style={{ transform: `rotate(${flipRotation}deg)` }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        {/* Output */}
        <div className="mx-4 p-4 rounded-xl bg-dark/80 border border-gray-700/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">You receive</span>
          </div>
          <div className="flex items-center gap-3">
            <span
              title={rawOutputAmount ? rawOutputAmount.toString() : ''}
              className="flex-1 text-3xl sm:text-3xl font-medium min-w-0 cursor-default select-text"
              style={{ fontSize: outputAmount.length > 10 ? 'clamp(1.125rem, 5vw, 1.875rem)' : undefined }}
            >
              <span className="text-white sm:hidden">{compactOutputAmount || <span className="text-gray-600">0</span>}</span>
              <span className="text-white hidden sm:inline">{outputAmount || <span className="text-gray-600">0</span>}</span>
            </span>
            <TokenSelector
              selected={outputToken}
              onSelect={handleOutputSelect}
              exclude={inputToken.symbol}
            />
          </div>
        </div>

        {/* Rate */}
        {hasAmount && (
          <div className="mx-4 mt-3 px-4 py-2 text-xs text-gray-400 flex justify-between">
            <span>Rate</span>
            <span>{exchangeRate}</span>
          </div>
        )}

        {/* UBI */}
        <UBIBreakdown
          ubiFeeAmount={ubiFee}
          outputToken={outputToken}
          visible={hasAmount}
        />

        {/* Swap Details */}
        <SwapDetails
          priceImpact={priceImpact}
          minimumReceived={minimumReceived}
          outputSymbol={outputToken.symbol}
          networkFee="< $0.01"
          visible={hasAmount}
        />

        {/* Swap button */}
        <div className="p-4 pt-3">
          {!isConnected ? (
            <button
              disabled
              className="w-full py-4 rounded-xl font-semibold text-base bg-goodgreen/30 text-goodgreen border border-goodgreen/40 cursor-not-allowed"
            >
              Connect Wallet to Swap
            </button>
          ) : !hasAmount ? (
            <button
              disabled
              className="w-full py-4 rounded-xl font-semibold text-base bg-dark-50 text-gray-400 cursor-not-allowed"
            >
              Enter an Amount
            </button>
          ) : (
            <button
              onClick={handleSwap}
              disabled={isPending}
              className="w-full py-4 rounded-xl font-semibold text-base transition-all bg-goodgreen text-white hover:bg-goodgreen-600 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:outline-none"
            >
              {isPending ? 'Swapping...' : `Swap ${inputToken.symbol} for ${outputToken.symbol}`}
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Powered by GoodDollar L2 — Chain ID 42069
        </p>
      </div>

      {showTxStatus && (
        <TxStatus
          hash={swapTxHash || approveTxHash}
          isPending={isPending}
          isSuccess={isTxSuccess}
          isError={isTxError}
          onClose={() => setShowTxStatus(false)}
        />
      )}
    </div>
  )
}
