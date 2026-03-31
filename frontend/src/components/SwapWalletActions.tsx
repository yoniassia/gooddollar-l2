'use client'

import { useState, useCallback, useMemo } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { Token } from './TokenSelector'
import { TxStatus } from './TxStatus'
import { SwapConfirmModal } from './SwapConfirmModal'
import { CONTRACTS } from '@/lib/chain'
import { GoodDollarTokenABI } from '@/lib/abi'
import { formatAmount } from '@/lib/format'

type BalanceProps = {
  variant: 'balance'
  inputToken: Token
  onSetAmount: (amount: string) => void
}

type SwapButtonProps = {
  variant: 'swap-button'
  inputToken: Token
  outputToken: Token
  inputAmount: string
  hasAmount: boolean
  priceImpact?: number
  outputAmount?: string
  inputUsd?: string
  outputUsd?: string
  exchangeRate?: string
  minimumReceived?: string
  networkFee?: string
  ubiFee?: string
}

type SwapWalletActionsProps = BalanceProps | SwapButtonProps

export function SwapWalletActions(props: SwapWalletActionsProps) {
  if (props.variant === 'balance') {
    return <BalanceDisplay inputToken={props.inputToken} onSetAmount={props.onSetAmount} />
  }
  return (
    <SwapButton
      inputToken={props.inputToken}
      outputToken={props.outputToken}
      inputAmount={props.inputAmount}
      hasAmount={props.hasAmount}
      priceImpact={props.priceImpact}
      outputAmount={props.outputAmount}
      inputUsd={props.inputUsd}
      outputUsd={props.outputUsd}
      exchangeRate={props.exchangeRate}
      minimumReceived={props.minimumReceived}
      networkFee={props.networkFee}
      ubiFee={props.ubiFee}
    />
  )
}

function BalanceDisplay({ inputToken, onSetAmount }: { inputToken: Token; onSetAmount: (amount: string) => void }) {
  const { address, isConnected } = useAccount()

  const { data: gdBalance } = useReadContract({
    address: CONTRACTS.GoodDollarToken,
    abi: GoodDollarTokenABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  })

  const formattedBalance = useMemo(() => {
    if (!gdBalance) return null
    const formatted = formatEther(gdBalance)
    const num = parseFloat(formatted)
    if (num > 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toFixed(2)
  }, [gdBalance])

  if (!isConnected || inputToken.symbol !== 'G$' || !formattedBalance) return null

  return (
    <button
      onClick={() => gdBalance && onSetAmount(formatEther(gdBalance))}
      className="text-xs text-goodgreen hover:text-goodgreen-300 transition-colors"
    >
      Balance: {formattedBalance} G$
    </button>
  )
}

function SwapButton({
  inputToken,
  outputToken,
  inputAmount,
  hasAmount,
  priceImpact = 0,
  outputAmount = '',
  inputUsd = '',
  outputUsd = '',
  exchangeRate = '',
  minimumReceived = '',
  networkFee = '< $0.01',
  ubiFee = '',
}: {
  inputToken: Token
  outputToken: Token
  inputAmount: string
  hasAmount: boolean
  priceImpact?: number
  outputAmount?: string
  inputUsd?: string
  outputUsd?: string
  exchangeRate?: string
  minimumReceived?: string
  networkFee?: string
  ubiFee?: string
}) {
  const { isConnected } = useAccount()
  const [showTxStatus, setShowTxStatus] = useState(false)
  const [showReview, setShowReview] = useState(false)

  const { writeContract: approve, data: approveTxHash, isPending: isApproving } = useWriteContract()
  const { writeContract: _swap, data: swapTxHash, isPending: isSwapping } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isTxSuccess, isError: isTxError } = useWaitForTransactionReceipt({
    hash: swapTxHash || approveTxHash,
  })

  const isPending = isApproving || isSwapping || isConfirming

  const executeSwap = useCallback(() => {
    if (!isConnected || !inputAmount) return
    setShowReview(false)
    setShowTxStatus(true)

    if (inputToken.symbol === 'G$') {
      approve({
        address: CONTRACTS.GoodDollarToken,
        abi: GoodDollarTokenABI,
        functionName: 'approve',
        args: [CONTRACTS.UBIFeeHook, parseEther(inputAmount)],
      })
    }
  }, [isConnected, inputAmount, inputToken.symbol, approve])

  const handleSwapClick = useCallback(() => {
    setShowReview(true)
  }, [])

  return (
    <>
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
          onClick={handleSwapClick}
          disabled={isPending}
          className={`w-full py-4 rounded-xl font-semibold text-base transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:outline-none ${
            priceImpact >= 10
              ? 'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500/50'
              : 'bg-goodgreen text-white hover:bg-goodgreen-600 focus-visible:ring-goodgreen/50'
          }`}
        >
          {isPending
            ? 'Swapping...'
            : priceImpact >= 10
              ? `Swap Anyway — High Price Impact`
              : `Swap ${inputToken.symbol} for ${outputToken.symbol}`}
        </button>
      )}

      <SwapConfirmModal
        open={showReview}
        onClose={() => setShowReview(false)}
        onConfirm={executeSwap}
        inputAmount={inputAmount}
        outputAmount={outputAmount}
        inputSymbol={inputToken.symbol}
        outputSymbol={outputToken.symbol}
        inputUsd={inputUsd}
        outputUsd={outputUsd}
        exchangeRate={exchangeRate}
        priceImpact={priceImpact}
        minimumReceived={minimumReceived}
        networkFee={networkFee}
        ubiFee={ubiFee}
      />

      {showTxStatus && (
        <TxStatus
          hash={swapTxHash || approveTxHash}
          isPending={isPending}
          isSuccess={isTxSuccess}
          isError={isTxError}
          onClose={() => setShowTxStatus(false)}
        />
      )}
    </>
  )
}
