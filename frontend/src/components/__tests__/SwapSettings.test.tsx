import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SwapSettings } from '../SwapSettings'

beforeEach(() => {
  localStorage.clear()
})

describe('SwapSettings', () => {
  it('renders gear icon button', () => {
    render(<SwapSettings />)
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument()
  })

  it('opens settings panel on click', () => {
    render(<SwapSettings />)
    fireEvent.click(screen.getByRole('button', { name: /settings/i }))
    expect(screen.getByText('Slippage Tolerance')).toBeInTheDocument()
  })

  it('shows slippage presets', () => {
    render(<SwapSettings />)
    fireEvent.click(screen.getByRole('button', { name: /settings/i }))
    expect(screen.getByText('0.1%')).toBeInTheDocument()
    expect(screen.getByText('0.5%')).toBeInTheDocument()
    expect(screen.getByText('1%')).toBeInTheDocument()
  })

  it('selects a slippage preset', () => {
    render(<SwapSettings />)
    fireEvent.click(screen.getByRole('button', { name: /settings/i }))
    fireEvent.click(screen.getByText('1%'))
    const stored = JSON.parse(localStorage.getItem('goodswap-settings') || '{}')
    expect(stored.slippage).toBe(1.0)
  })

  it('shows transaction deadline input', () => {
    render(<SwapSettings />)
    fireEvent.click(screen.getByRole('button', { name: /settings/i }))
    expect(screen.getByText('Transaction Deadline')).toBeInTheDocument()
  })

  it('closes panel on second click', () => {
    render(<SwapSettings />)
    const btn = screen.getByRole('button', { name: /settings/i })
    fireEvent.click(btn)
    expect(screen.getByText('Slippage Tolerance')).toBeInTheDocument()
    fireEvent.click(btn)
    expect(screen.queryByText('Slippage Tolerance')).not.toBeInTheDocument()
  })
})
