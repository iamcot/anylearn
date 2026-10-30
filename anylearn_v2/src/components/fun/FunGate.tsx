'use client'

import { usePathname } from 'next/navigation'
import RequireLogin from '@/components/auth/RequireLogin'
import { isPublicFunPath } from '@/lib/explore/publicPath'

/** Vui học needs an account, except the public page of a shared Khám phá post (plan 19.A3), rendered for everyone. */
export default function FunGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (isPublicFunPath(pathname)) return <>{children}</>
  return <RequireLogin>{children}</RequireLogin>
}
