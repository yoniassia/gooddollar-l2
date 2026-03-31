import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'

const pushMock = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

vi.mock('@/components/TokenIcon', () => ({
  TokenIcon: ({ symbol }: { symbol: string }) => <span data-testid={`icon-${symbol}`}>{symbol}</span>,
}))

import ExplorePage from '../page'

describe('ExplorePage — explore-to-swap navigation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    pushMock.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  async function renderAndWaitForData() {
    render(<ExplorePage />)
    await act(async () => {
      vi.advanceTimersByTime(500)
    })
  }

  it('navigates to swap with ?buy= param when row is clicked', async () => {
    await renderAndWaitForData()
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
    fireEvent.click(rows[1])
    expect(pushMock).toHaveBeenCalledWith(expect.stringContaining('/?buy='))
  })

  it('uses ?buy= param (not ?token=) for explore-to-swap navigation', async () => {
    await renderAndWaitForData()
    const rows = screen.getAllByRole('row')
    fireEvent.click(rows[1])
    expect(pushMock).toHaveBeenCalledWith(expect.stringContaining('/?buy='))
    expect(pushMock).not.toHaveBeenCalledWith(expect.stringContaining('?token='))
  })

  it('shows a Swap button on each data row', async () => {
    await renderAndWaitForData()
    const swapButtons = screen.getAllByRole('button', { name: /swap/i })
    expect(swapButtons.length).toBeGreaterThanOrEqual(1)
  })

  it('Swap button click navigates to ?buy= param', async () => {
    await renderAndWaitForData()
    const swapButtons = screen.getAllByRole('button', { name: /swap/i })
    fireEvent.click(swapButtons[0])
    expect(pushMock).toHaveBeenCalledWith(expect.stringContaining('/?buy='))
  })
})
