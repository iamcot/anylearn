import type { Metadata } from 'next'
import RequireLogin from '@/components/auth/RequireLogin'
import RefParamCapture from '@/components/referral/RefParamCapture'
import { FUN_INVITE_GAME } from '@/lib/referral/funInvite'
import { shareMeta } from '@/lib/seo/shareMeta'

export const metadata: Metadata = shareMeta('fun', { title: 'Vui học - anyLEARN' })

export default function FunLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-76px)] bg-bg text-ink">
      <RefParamCapture game={FUN_INVITE_GAME} />
      <RequireLogin>{children}</RequireLogin>
    </div>
  )
}
