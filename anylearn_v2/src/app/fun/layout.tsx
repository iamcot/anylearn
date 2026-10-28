import type { Metadata } from 'next'
import RequireLogin from '@/components/auth/RequireLogin'

export const metadata: Metadata = {
  title: 'Vui học - anyLEARN',
}

export default function FunLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-[calc(100vh-76px)] bg-bg text-ink"><RequireLogin>{children}</RequireLogin></div>
}
