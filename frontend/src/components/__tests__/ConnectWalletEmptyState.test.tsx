import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ConnectWalletEmptyState } from '../ConnectWalletEmptyState'
import { WalletReadyContext } from '@/lib/WalletReadyContext'

const mockOpenConnectModal = vi.fn()

vi.mock('wagmi', () => ({
  useAccount: vi.fn(() => ({ isConnected: false })),
}))

vi.mock('@rainbow-me/rainbowkit', () => ({
  useConnectModal: () => ({ openConnectModal: mockOpenConnectModal }),
}))

const { useAccount } = await import('wagmi')

function Wrapper({ walletReady, children }: { walletReady: boolean; children: React.ReactNode }) {
  return (
    <WalletReadyContext.Provider value={walletReady}>
      {children}
    </WalletReadyContext.Provider>
  )
}

describe('ConnectWalletEmptyState', () => {
  it('shows empty state when wallet is ready but not connected', () => {
    vi.mocked(useAccount).mockReturnValue({ isConnected: false } as ReturnType<typeof useAccount>)
    render(
      <Wrapper walletReady={true}>
        <ConnectWalletEmptyState>
          <div>Portfolio Content</div>
        </ConnectWalletEmptyState>
      </Wrapper>
    )
    expect(screen.getByText('Connect Your Wallet')).toBeInTheDocument()
    expect(screen.queryByText('Portfolio Content')).not.toBeInTheDocument()
  })

  it('shows children when wallet is connected', () => {
    vi.mocked(useAccount).mockReturnValue({ isConnected: true } as ReturnType<typeof useAccount>)
    render(
      <Wrapper walletReady={true}>
        <ConnectWalletEmptyState>
          <div>Portfolio Content</div>
        </ConnectWalletEmptyState>
      </Wrapper>
    )
    expect(screen.queryByText('Connect Your Wallet')).not.toBeInTheDocument()
    expect(screen.getByText('Portfolio Content')).toBeInTheDocument()
  })

  it('shows children when wallet is not ready (SSR fallback)', () => {
    render(
      <Wrapper walletReady={false}>
        <ConnectWalletEmptyState>
          <div>Portfolio Content</div>
        </ConnectWalletEmptyState>
      </Wrapper>
    )
    expect(screen.getByText('Portfolio Content')).toBeInTheDocument()
  })

  it('shows custom title and description', () => {
    vi.mocked(useAccount).mockReturnValue({ isConnected: false } as ReturnType<typeof useAccount>)
    render(
      <Wrapper walletReady={true}>
        <ConnectWalletEmptyState title="Custom Title" description="Custom desc">
          <div>Content</div>
        </ConnectWalletEmptyState>
      </Wrapper>
    )
    expect(screen.getByText('Custom Title')).toBeInTheDocument()
    expect(screen.getByText('Custom desc')).toBeInTheDocument()
  })

  it('calls openConnectModal when Connect Wallet button is clicked', () => {
    vi.mocked(useAccount).mockReturnValue({ isConnected: false } as ReturnType<typeof useAccount>)
    render(
      <Wrapper walletReady={true}>
        <ConnectWalletEmptyState>
          <div>Content</div>
        </ConnectWalletEmptyState>
      </Wrapper>
    )
    fireEvent.click(screen.getByRole('button', { name: /connect wallet/i }))
    expect(mockOpenConnectModal).toHaveBeenCalled()
  })
})
