import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TippMixMentor v2 - Football Prediction System',
  description: 'A comprehensive football prediction system that combines modern web technologies with machine learning to provide accurate match predictions and betting insights.',
  keywords: ['football', 'predictions', 'betting', 'sports', 'analytics', 'machine learning'],
  authors: [{ name: 'TippMixMentor Team' }],
  creator: 'TippMixMentor Team',
  publisher: 'TippMixMentor',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'TippMixMentor v2 - Football Prediction System',
    description: 'A comprehensive football prediction system that combines modern web technologies with machine learning to provide accurate match predictions and betting insights.',
    siteName: 'TippMixMentor v2',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TippMixMentor v2 - Football Prediction System',
    description: 'A comprehensive football prediction system that combines modern web technologies with machine learning to provide accurate match predictions and betting insights.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
} 