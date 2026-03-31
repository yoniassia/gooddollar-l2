import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TokenSelector, TOKENS } from '../TokenSelector'

describe('TokenSelector', () => {
  const defaultProps = {
    selected: TOKENS[1], // ETH
    onSelect: vi.fn(),
    exclude: 'G$',
  }

  it('opens modal on click', () => {
    render(<TokenSelector {...defaultProps} />)
    fireEvent.click(screen.getByText('ETH'))
    expect(screen.getByText('Select a token')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search by name or symbol')).toBeInTheDocument()
  })

  it('shows token list including USDC in modal', () => {
    render(<TokenSelector {...defaultProps} />)
    fireEvent.click(screen.getByText('ETH'))
    expect(screen.getByRole('option', { name: /USDC/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /WBTC/i })).toBeInTheDocument()
  })

  it('filters tokens by search query', () => {
    render(<TokenSelector {...defaultProps} />)
    fireEvent.click(screen.getByText('ETH'))
    const search = screen.getByPlaceholderText('Search by name or symbol')
    fireEvent.change(search, { target: { value: 'bit' } })
    expect(screen.getByRole('option', { name: /WBTC/i })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /USDC/i })).not.toBeInTheDocument()
  })

  it('closes modal on close button click', () => {
    render(<TokenSelector {...defaultProps} />)
    fireEvent.click(screen.getByText('ETH'))
    expect(screen.getByText('Select a token')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Close'))
    expect(screen.queryByText('Select a token')).not.toBeInTheDocument()
  })

  it('selects a token and closes modal', () => {
    const onSelect = vi.fn()
    render(<TokenSelector {...defaultProps} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('ETH'))
    fireEvent.click(screen.getByRole('option', { name: /USDC/i }))
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ symbol: 'USDC' }))
    expect(screen.queryByText('Select a token')).not.toBeInTheDocument()
  })

  it('shows checkmark on currently selected token', () => {
    render(<TokenSelector {...defaultProps} />)
    fireEvent.click(screen.getByText('ETH'))
    const ethOption = screen.getByRole('option', { name: /^ETH/i })
    expect(ethOption.querySelector('svg')).toBeTruthy()
  })

  it('dims and disables excluded token', () => {
    render(<TokenSelector {...defaultProps} exclude="USDC" />)
    fireEvent.click(screen.getByText('ETH'))
    const usdcOption = screen.getByRole('option', { name: /USDC/i })
    expect(usdcOption).toBeDisabled()
  })

  it('shows popular tokens as quick-pick pills', () => {
    render(<TokenSelector {...defaultProps} />)
    fireEvent.click(screen.getByText('ETH'))
    const pills = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('rounded-full')
    )
    expect(pills.length).toBeGreaterThanOrEqual(3)
  })
})
