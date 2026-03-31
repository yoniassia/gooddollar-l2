import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TokenSelector, TOKENS } from '../TokenSelector'

describe('TokenSelector', () => {
  const defaultProps = {
    selected: TOKENS[1], // ETH
    onSelect: vi.fn(),
    exclude: 'G$',
  }

  it('opens dropdown on click', () => {
    render(<TokenSelector {...defaultProps} />)
    fireEvent.click(screen.getByText('ETH'))
    expect(screen.getByText('USDC')).toBeInTheDocument()
  })

  it('closes dropdown on Escape key', () => {
    const { container } = render(<TokenSelector {...defaultProps} />)
    const trigger = screen.getByText('ETH').closest('button')!
    fireEvent.click(trigger)
    expect(screen.getByText('USD Coin')).toBeInTheDocument()

    const wrapper = container.firstElementChild as HTMLElement
    fireEvent.keyDown(wrapper, { key: 'Escape' })
    expect(screen.queryByText('USD Coin')).not.toBeInTheDocument()
  })

  it('navigates with ArrowDown and selects with Enter', () => {
    const onSelect = vi.fn()
    const { container } = render(<TokenSelector {...defaultProps} onSelect={onSelect} />)

    const trigger = screen.getByText('ETH').closest('button')!
    fireEvent.click(trigger)

    const wrapper = container.firstElementChild as HTMLElement
    fireEvent.keyDown(wrapper, { key: 'ArrowDown' })
    fireEvent.keyDown(wrapper, { key: 'Enter' })

    expect(onSelect).toHaveBeenCalled()
  })

  it('wraps ArrowDown at end of list', () => {
    const onSelect = vi.fn()
    const { container } = render(<TokenSelector {...defaultProps} onSelect={onSelect} />)

    const trigger = screen.getByText('ETH').closest('button')!
    fireEvent.click(trigger)

    const wrapper = container.firstElementChild as HTMLElement
    fireEvent.keyDown(wrapper, { key: 'ArrowDown' })
    fireEvent.keyDown(wrapper, { key: 'ArrowDown' })
    fireEvent.keyDown(wrapper, { key: 'ArrowDown' })
    fireEvent.keyDown(wrapper, { key: 'Enter' })

    expect(onSelect).toHaveBeenCalled()
  })

  it('closes dropdown on outside click', () => {
    render(
      <div>
        <div data-testid="outside">outside</div>
        <TokenSelector {...defaultProps} />
      </div>
    )
    fireEvent.click(screen.getByText('ETH'))
    expect(screen.getByText('USD Coin')).toBeInTheDocument()

    fireEvent.mouseDown(screen.getByTestId('outside'))
    expect(screen.queryByText('USD Coin')).not.toBeInTheDocument()
  })
})
