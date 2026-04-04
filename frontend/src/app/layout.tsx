import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import { Providers } from '@/components/Providers'
import { Header } from '@/components/Header'
import { UBIBanner } from '@/components/UBIBanner'
import { LandingFooter } from '@/components/LandingFooter'
import { PageTransition } from '@/components/PageTransition'

export const metadata: Metadata = {
  title: 'GoodDollar — DeFi That Funds UBI',
  description: 'Trade, predict, and invest on GoodDollar L2. Every platform interaction automatically funds universal basic income for verified humans worldwide.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="font-sans min-h-screen flex flex-col">
        <Providers>
          <Header />
          <UBIBanner />
          <main className="flex-1 flex flex-col items-center px-4 pt-8 pb-12">
            <PageTransition>{children}</PageTransition>
          </main>
          <LandingFooter />
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
