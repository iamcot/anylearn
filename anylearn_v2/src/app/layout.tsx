import type { Metadata } from 'next'
import { Be_Vietnam_Pro } from 'next/font/google'
import Script from 'next/script'
import { Suspense } from 'react'
import './globals.css'
import SiteChrome from '@/components/SiteChrome'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import FloatContact from '@/components/FloatContact'
import { AuthProvider } from '@/context/AuthContext'
import AuthModal from '@/components/AuthModal'
import NavigationProgress from '@/components/NavigationProgress'
import ToastProvider from '@/components/ToastProvider'

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
  },
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
              footer={<><Footer /><FloatContact /></>}
            >
              {children}
            </SiteChrome>
            <AuthModal />
          </ToastProvider>
        </AuthProvider>
        <Script src="https://sp.zalo.me/plugins/sdk.js" strategy="lazyOnload" />
      </body>
    </html>
  )
}
