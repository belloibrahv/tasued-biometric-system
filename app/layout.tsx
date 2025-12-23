import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Toaster } from 'sonner'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor: '#0066CC',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: {
    default: 'TASUED BioVault - Universal Student Biometric Identity Platform',
    template: '%s | TASUED BioVault'
  },
  description: 'A centralized biometric identity system serving as a digital passport for students across all university services at Tai SOLARIN Federal University of Education.',
  keywords: [
    'biometric',
    'student identity',
    'TASUED',
    'university',
    'fingerprint',
    'facial recognition',
    'QR code',
    'attendance',
    'verification'
  ],
  authors: [{ name: 'CSC 415 Net-Centric Computing Team' }],
  creator: 'Dr. Ogunsanwo - CSC 415',
  manifest: '/manifest.json',
  icons: [
    { rel: 'icon', url: '/favicon.ico' },
    { rel: 'icon', url: '/favicon-16x16.png', sizes: '16x16' },
    { rel: 'icon', url: '/favicon-32x32.png', sizes: '32x32' },
    { rel: 'apple-touch-icon', url: '/icons/icon-192x192.png', sizes: '192x192' },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TASUED BioVault',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: 'https://biovault.tasued.edu.ng',
    title: 'TASUED BioVault - Universal Student Biometric Identity Platform',
    description: 'Secure biometric identity management for the modern university experience.',
    siteName: 'TASUED BioVault',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TASUED BioVault',
    description: 'Universal Student Biometric Identity Platform',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        {children}
        <Toaster
          position="top-right"
          expand={false}
          richColors
          closeButton
          toastOptions={{
            style: {
              background: 'white',
              border: '1px solid #e2e8f0',
            },
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('BioVault SW registered:', registration.scope);
                    },
                    function(err) {
                      console.log('BioVault SW registration failed:', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
