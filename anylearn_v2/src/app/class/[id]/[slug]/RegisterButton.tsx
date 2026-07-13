'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

export default function RegisterButton({ itemId }: { itemId: number }) {
  const { user, openAuthModal } = useAuth()
  const router = useRouter()

  const handleClick = () => {
    if (user) {
      router.push(`/add2cart/${itemId}`)
    } else {
      openAuthModal('login', () => router.push(`/add2cart/${itemId}`))
    }
  }

  return (
    <button onClick={handleClick} className="btn btn--green" style={{ width: '100%', fontSize: 17, padding: '16px 24px' }}>
      Đăng ký ngay
    </button>
  )
}
