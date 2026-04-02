import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'
import { Header } from '@/components/Header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GoodDollar — DeFi That Funds UBI',
  description: 'Trade, predict, and invest on GoodDollar L2. Every platform interaction automatically funds universal basic income for verified humans worldwide.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen`}>
        <Providers>
          <Header />
          <main className="flex flex-col items-center px-4 pt-8 pb-20">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
