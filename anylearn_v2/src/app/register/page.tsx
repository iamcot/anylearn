'use client'

import { useRouter } from 'next/navigation'
import AuthCard from '@/components/auth/AuthCard'
import RegisterForm from '@/components/auth/RegisterForm'

export default function RegisterPage() {
  const router = useRouter()
  return (
    <AuthCard title="Đăng ký" subtitle="Tạo tài khoản anyLEARN miễn phí" maxWidth="max-w-[440px]">
      <RegisterForm onSuccess={redirectTo => router.push(redirectTo ?? '/')} />
    </AuthCard>
  )
}
