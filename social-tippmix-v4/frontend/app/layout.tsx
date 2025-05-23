import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import MainLayoutContent from '@/components/MainLayout'
import { getCurrentUser } from '@/lib/auth/session'
import AuthProvider from '@/components/auth/AuthProvider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: 'Social Tippmix V4',
  description: 'Next generation social betting app'
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  const user = await getCurrentUser()

  // Map UserPayload (from session) to User (for AuthProvider)
  const userForProvider = user
    ? {
        id: user.id,
        username: user.username,
        email: '', // JWT-ben nincs, üresen hagyjuk
        role: user.role,
        status: '',
        createdAt: '',
        updatedAt: ''
      }
    : null

  return (
    <html lang="hu" data-theme="light">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider user={userForProvider}>
          <MainLayoutContent>{children}</MainLayoutContent>
        </AuthProvider>
      </body>
    </html>
  )
}
