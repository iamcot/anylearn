import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import SiteChrome from '@/components/SiteChrome'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import FloatContact from '@/components/FloatContact'
import { AuthProvider } from '@/context/AuthContext'
import AuthModal from '@/components/AuthModal'

export const metadata: Metadata = {
  title: 'anyLEARN - Học không giới hạn',
  description: 'Nền tảng giúp phụ huynh tìm kiếm, so sánh và đăng ký trường học, khóa học, chuyên gia phù hợp cho con.',
  icons: {
    icon: '/favicon-16x16.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <AuthProvider>
          <SiteChrome
            header={<Header />}
            footer={<><Footer /><FloatContact /></>}
          >
            {children}
          </SiteChrome>
          <AuthModal />
        </AuthProvider>
        <Script src="https://sp.zalo.me/plugins/sdk.js" strategy="lazyOnload" />
      </body>
    </html>
  )
}
