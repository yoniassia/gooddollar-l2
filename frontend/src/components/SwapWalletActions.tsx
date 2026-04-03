'use client'

import { useState, useCallback } from 'react'
import { type Token } from '@/lib/tokens'
import { SwapConfirmModal } from './SwapConfirmModal'

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
    return null // No balance display in demo mode
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
  const [showReview, setShowReview] = useState(false)
  const [showDemoToast, setShowDemoToast] = useState(false)

  const handleSwapClick = useCallback(() => {
    setShowReview(true)
  }, [])

  const handleConfirm = useCallback(() => {
    setShowReview(false)
    setShowDemoToast(true)
    setTimeout(() => setShowDemoToast(false), 3000)
  }, [])

  return (
    <>
      {!hasAmount ? (
        <button
          disabled
          className="w-full py-4 rounded-xl font-semibold text-base bg-dark-50 text-gray-400 cursor-not-allowed"
        >
          Enter an Amount
        </button>
      ) : (
        <button
          onClick={handleSwapClick}
          className={`w-full py-4 rounded-xl font-semibold text-base transition-all active:scale-[0.98] focus-visible:ring-2 focus-visible:outline-none ${
            priceImpact >= 10
              ? 'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500/50'
              : 'bg-goodgreen text-white hover:bg-goodgreen-600 focus-visible:ring-goodgreen/50'
          }`}
        >
          {priceImpact >= 10
            ? `Swap Anyway — High Price Impact`
            : `Swap ${inputToken.symbol} for ${outputToken.symbol}`}
        </button>
      )}

      <SwapConfirmModal
        open={showReview}
        onClose={() => setShowReview(false)}
        onConfirm={handleConfirm}
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

      {showDemoToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2.5 rounded-xl bg-dark-50 border border-goodgreen/30 text-sm text-gray-200 shadow-lg">
          🚀 Demo mode — L2 testnet launching soon!
        </div>
      )}
    </>
  )
}
