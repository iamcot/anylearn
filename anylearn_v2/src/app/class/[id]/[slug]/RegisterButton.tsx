'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useIsClient } from '@/components/useIsClient'
import GuestLearnerPicker from '@/components/guest/GuestLearnerPicker'

export default function RegisterButton({ itemId }: { itemId: number }) {
  const { user, openAuthModal } = useAuth()
  const router = useRouter()
  const [sticky, setSticky] = useState(false)
  const mounted = useIsClient()
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setSticky(!entry.isIntersecting),
      { threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const handleRegister = () => {
    if (user) {
      router.push(`/add2cart/${itemId}`)
    } else {
      openAuthModal('login', () => router.push(`/add2cart/${itemId}`))
    }
  }

  // Logged-in people have the bottom tabs below lg, so the bar sits above them.
  const bottomClass = user ? 'bottom-[calc(var(--app-tabs-h)+0.5rem)] lg:bottom-4' : 'bottom-4'

  const stickyBar = sticky ? (
    <div className={`fixed left-1/2 z-[45] flex w-[min(calc(100vw-32px),1180px)] -translate-x-1/2 justify-center rounded-[18px] bg-white px-4 py-3 shadow-raised ${bottomClass}`}>
      <button type="button" onClick={handleRegister} className="btn btn--green w-full max-w-[480px] py-3 text-[15px] md:w-1/2">
        Đăng ký ngay
      </button>
    </div>
  ) : null

  return (
    <>
      <GuestLearnerPicker />
      <div ref={sentinelRef} />
      <button type="button" onClick={handleRegister} className="btn btn--green w-full px-6 py-4 text-[17px]">
        Đăng ký ngay
      </button>
      {mounted && createPortal(stickyBar, document.body)}
    </>
  )
}
