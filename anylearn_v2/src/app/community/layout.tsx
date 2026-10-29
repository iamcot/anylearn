import type { Metadata } from 'next'
import RequireLogin from '@/components/auth/RequireLogin'
import { shareMeta } from '@/lib/seo/shareMeta'

export const metadata: Metadata = shareMeta('community', { title: 'Cộng đồng - anyLEARN' })

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-[calc(100vh-76px)] bg-bg text-ink"><RequireLogin>{children}</RequireLogin></div>
}
