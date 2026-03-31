import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LandingFooter } from '../LandingFooter'

describe('LandingFooter', () => {
  it('renders brand text', () => {
    render(<LandingFooter />)
    expect(screen.getByText(/Powered by GoodDollar L2/i)).toBeInTheDocument()
  })

  it('does not show Chain ID', () => {
    render(<LandingFooter />)
    expect(screen.queryByText(/Chain ID/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/42069/)).not.toBeInTheDocument()
  })

  it('renders navigation links', () => {
    render(<LandingFooter />)
    expect(screen.getByText('Docs')).toBeInTheDocument()
    expect(screen.getByText('GitHub')).toBeInTheDocument()
    expect(screen.getByText('Community')).toBeInTheDocument()
  })
})
