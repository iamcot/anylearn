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

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '500', '600'],
  variable: '--font-be-vietnam-pro',
})

export const metadata: Metadata = {
  title: 'anyLEARN - Học không giới hạn',
  description: 'Nền tảng giúp phụ huynh tìm kiếm, so sánh và đăng ký trường học, khóa học, chuyên gia phù hợp cho con.',
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
