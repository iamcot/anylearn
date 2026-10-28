'use client'

import { useAuth } from '@/context/AuthContext'
import AuthCard from './AuthCard'
import LoginForm from './LoginForm'
import { ListSkeleton } from '@/components/PageSkeleton'

/** Pages of the signed-in area stay reachable for visitors: they see the login form here instead of being sent away. */
export default function RequireLogin({ children }: { children: React.ReactNode }) {
  const { user, isAuthLoading } = useAuth()
  if (isAuthLoading) return <div className="container py-6"><ListSkeleton /></div>
  if (!user) {
    return (
      <AuthCard title="Chức năng này cần đăng nhập" subtitle="Đăng nhập để tiếp tục. Chưa có tài khoản thì đăng ký chỉ mất một phút.">
        <LoginForm onSuccess={() => {}} />
      </AuthCard>
    )
  }
  return <>{children}</>
}
