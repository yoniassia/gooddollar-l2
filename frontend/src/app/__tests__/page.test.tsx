import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('@/components/SwapCard', () => ({
  SwapCard: () => <div data-testid="swap-card" id="swap-card"><input data-testid="swap-input" /></div>,
}))

vi.mock('@/components/HowItWorks', () => ({
  HowItWorks: () => <section>How It Works</section>,
}))

vi.mock('@/components/StatsRow', () => ({
  StatsRow: () => <section>Stats</section>,
}))

vi.mock('@/components/LandingFooter', () => ({
  LandingFooter: () => <footer>Footer</footer>,
}))

import Home from '../page'

describe('Landing page — Start Swapping CTA', () => {
  it('renders a "Start Swapping" button between How It Works and Stats', () => {
    render(<Home />)
    const cta = screen.getByRole('button', { name: /start swapping/i })
    expect(cta).toBeInTheDocument()
  })

  it('Start Swapping button is positioned after How It Works content', () => {
    render(<Home />)
    const body = document.body.innerHTML
    const howItWorksIdx = body.indexOf('How It Works')
    const ctaIdx = body.indexOf('Start Swapping')
    const statsIdx = body.indexOf('Stats')
    expect(ctaIdx).toBeGreaterThan(howItWorksIdx)
    expect(ctaIdx).toBeLessThan(statsIdx)
  })
})
