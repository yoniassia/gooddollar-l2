'use client'

import { SectionNav } from '@/components/SectionNav'

const TABS = [
  { label: 'Trade', href: '/perps', match: (p: string) => p === '/perps' },
  { label: 'Portfolio', href: '/perps/portfolio', match: (p: string) => p === '/perps/portfolio' },
  { label: 'Leaderboard', href: '/perps/leaderboard', match: (p: string) => p === '/perps/leaderboard' },
]

export default function PerpsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SectionNav tabs={TABS} />
      {children}
    </>
  )
}
