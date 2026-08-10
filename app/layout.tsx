import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/lib/theme-context'
import { AuthProvider } from '@/lib/auth-context'
import { Toaster } from 'react-hot-toast'
import { AppSettingsProvider } from '@/lib/app-settings-context'
import { LiveDataProvider } from '@/components/live/live-data-provider'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Magical ICT - Tuition Management System',
  description: 'Complete tuition class management system with admin, student, and parent portals',
  generator: 'v0.app',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      {
        url: '/icon-32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon-192.png',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F8FAFC' },
    { media: '(prefers-color-scheme: dark)', color: '#0F172A' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <meta name="application-name" content="Magical LMS Admin" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="font-sans antialiased bg-background">
        <ThemeProvider>
          <AppSettingsProvider><AuthProvider>
            {children}
            <Toaster position="top-center" />
            {process.env.NODE_ENV === 'production' && <Analytics />}
          </AuthProvider></AppSettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
