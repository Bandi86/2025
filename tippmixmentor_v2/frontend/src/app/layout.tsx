import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'
import { ErrorBoundary } from '@/components/ui/error-boundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TippMixMentor - Football Prediction System',
  description: 'Advanced football prediction system with AI insights and real-time analytics',
  keywords: ['football', 'predictions', 'AI', 'analytics', 'betting', 'sports'],
  authors: [{ name: 'TippMixMentor Team' }],
  creator: 'TippMixMentor',
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
    title: 'TippMixMentor - Football Prediction System',
    description: 'Advanced football prediction system with AI insights and real-time analytics',
    siteName: 'TippMixMentor',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TippMixMentor - Football Prediction System',
    description: 'Advanced football prediction system with AI insights and real-time analytics',
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
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
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
        <ErrorBoundary>
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
} 