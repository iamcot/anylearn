'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AuthCard from '@/components/auth/AuthCard'
import LoginForm from '@/components/auth/LoginForm'
import Alert from '@/components/Alert'
import { safeRedirect } from '@/lib/auth/validation'

function LoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const justReset = params.get('reset') === 'success'
  const expired = params.get('expired') === '1'

  return (
    <AuthCard title="Đăng nhập" subtitle="Chào mừng trở lại anyLEARN">
      {expired && <Alert kind="error" className="mb-4">Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.</Alert>}
      {justReset && <Alert kind="success" className="mb-4">Đã đặt lại mật khẩu. Hãy đăng nhập bằng mật khẩu mới.</Alert>}
      <LoginForm onSuccess={() => router.push(safeRedirect(params.get('redirect')))} />
    </AuthCard>
  )
}

export default function LoginPageWithSuspense() {
  return <Suspense><LoginPage /></Suspense>
}
