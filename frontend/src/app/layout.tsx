import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/Header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GoodSwap — Every Swap Funds UBI',
  description: 'Swap tokens on GoodDollar L2. Every trade automatically funds universal basic income.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen`}>
        <Header />
        <main className="flex flex-col items-center px-4 pt-8 pb-20">
          {children}
        </main>
      </body>
    </html>
  )
}
