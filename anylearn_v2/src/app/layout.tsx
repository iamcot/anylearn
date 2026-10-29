import type { Metadata, Viewport } from 'next'
import { Be_Vietnam_Pro } from 'next/font/google'
import { Suspense } from 'react'
import './globals.css'
import SiteChrome from '@/components/SiteChrome'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { AuthProvider } from '@/context/AuthContext'
import AuthModal from '@/components/AuthModal'
import NavigationProgress from '@/components/NavigationProgress'
import ToastProvider from '@/components/ToastProvider'
import ServiceWorkerRegister from '@/components/pwa/ServiceWorkerRegister'
import GuestLearnerHost from '@/components/guest/GuestLearnerHost'
import { shareMeta } from '@/lib/seo/shareMeta'
import { siteOrigin } from '@/lib/achievements/share'

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '500', '600'],
  variable: '--font-be-vietnam-pro',
})

// Every page inherits the home card for its shared link; top-level pages set their own with `shareMeta` (config/shareCards.ts).
// `metadataBase` turns the card picture paths into the absolute links Zalo and Facebook need.
export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  ...shareMeta('home'),
  icons: {
    icon: '/favicon-16x16.png',
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    title: 'anyLEARN',
    statusBarStyle: 'default',
  },
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={beVietnamPro.variable}>
      <body>
        <AuthProvider>
          <ToastProvider>
            <Suspense fallback={null}>
              <NavigationProgress />
            </Suspense>
            <SiteChrome
              header={<Header />}
              footer={<Footer />}
            >
              {children}
            </SiteChrome>
            <AuthModal />
            <ServiceWorkerRegister />
            <GuestLearnerHost />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
