import type { Metadata } from 'next'
import { Geist, Geist_Mono, Press_Start_2P } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const pressStart2P = Press_Start_2P({
  weight: '400',
  variable: '--font-pixel',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'DeFi City - Build Your City, Earn Real Crypto',
  description:
    'A city builder game where buildings are connected to real DeFi protocols. Build, earn, and manage your crypto portfolio through gameplay.',
  keywords: ['DeFi', 'City Builder', 'Crypto', 'Blockchain', 'Game', 'Yield Farming'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} ${pressStart2P.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
