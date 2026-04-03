import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'
import { Header } from '@/components/Header'
import { LandingFooter } from '@/components/LandingFooter'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GoodDollar — DeFi That Funds UBI',
  description: 'Trade, predict, and invest on GoodDollar L2. Every platform interaction automatically funds universal basic income for verified humans worldwide.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <Providers>
          <Header />
          <main className="flex-1 flex flex-col items-center px-4 pt-8 pb-12">
            {children}
          </main>
          <LandingFooter />
        </Providers>
      </body>
    </html>
  )
}
