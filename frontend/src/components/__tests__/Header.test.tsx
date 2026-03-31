import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Header } from '../Header'

vi.mock('../WalletButton', () => ({
  WalletButton: () => <button>Connect Wallet</button>,
}))

vi.mock('../ActivityButton', () => ({
  ActivityButton: () => <button aria-label="Recent activity">Activity</button>,
}))

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

describe('Header', () => {
  it('renders logo and brand name', () => {
    render(<Header />)
    expect(screen.getByText('GoodSwap')).toBeInTheDocument()
    expect(screen.getByText('G$')).toBeInTheDocument()
  })

  it('renders desktop nav links', () => {
    render(<Header />)
    expect(screen.getByText('Swap')).toBeInTheDocument()
    expect(screen.getByText('Pool')).toBeInTheDocument()
    expect(screen.getByText('Bridge')).toBeInTheDocument()
  })

  it('renders hamburger button for mobile', () => {
    render(<Header />)
    const hamburger = screen.getByLabelText('Open menu')
    expect(hamburger).toBeInTheDocument()
  })

  it('opens mobile menu on hamburger click', () => {
    render(<Header />)
    const hamburger = screen.getByLabelText('Open menu')
    fireEvent.click(hamburger)

    const mobileNav = screen.getByTestId('mobile-nav')
    expect(mobileNav).toBeInTheDocument()
    expect(mobileNav.textContent).toContain('Swap')
    expect(mobileNav.textContent).toContain('Pool')
    expect(mobileNav.textContent).toContain('Bridge')
  })

  it('closes mobile menu on close button click', () => {
    render(<Header />)
    fireEvent.click(screen.getByLabelText('Open menu'))
    expect(screen.getByTestId('mobile-nav')).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Close menu'))
    expect(screen.queryByTestId('mobile-nav')).not.toBeInTheDocument()
  })

  it('closes mobile menu on Escape key', () => {
    render(<Header />)
    fireEvent.click(screen.getByLabelText('Open menu'))
    expect(screen.getByTestId('mobile-nav')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByTestId('mobile-nav')).not.toBeInTheDocument()
  })

  it('shows Coming Soon badges for Pool and Bridge in mobile menu', () => {
    render(<Header />)
    fireEvent.click(screen.getByLabelText('Open menu'))

    const mobileNav = screen.getByTestId('mobile-nav')
    const comingSoonBadges = mobileNav.querySelectorAll('.text-goodgreen\\/60')
    expect(comingSoonBadges.length).toBeGreaterThanOrEqual(2)
  })
})
