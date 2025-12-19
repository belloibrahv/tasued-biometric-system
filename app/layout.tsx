import './globals.css'
import type { Metadata } from 'next'
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
  themeColor: '#0066CC',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
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
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={inter.className}>
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
