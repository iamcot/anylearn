import type { Metadata } from 'next'
import RequireLogin from '@/components/auth/RequireLogin'

export const metadata: Metadata = {
  title: 'Hôm nay - anyLEARN',
}

export default function TodayLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-[calc(100vh-76px)] bg-bg text-ink"><RequireLogin>{children}</RequireLogin></div>
}
