'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useIsClient } from '@/components/useIsClient'
import { formatPrice } from '@/lib/format/price'
import GuestLearnerPicker from '@/components/guest/GuestLearnerPicker'

export default function RegisterButton({ itemId, price, owned = false }: { itemId: number; price?: number | null; owned?: boolean }) {
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

  // A link that names a learner (?child=, e.g. a suggestion for Bin) keeps that learner on the registration step.
  const registerUrl = () => {
    const child = Number(new URLSearchParams(window.location.search).get('child'))
    return `/add2cart/${itemId}${child ? `?child=${child}` : ''}`
  }

  const handleRegister = () => {
    if (user) {
      router.push(registerUrl())
    } else {
      openAuthModal('login', () => router.push(registerUrl()))
    }
  }

  // Logged-in people have the bottom tabs below lg, so the bar sits above them.
  // While a comparison is open its bar sits above the tabs and the register bar stacks above that (--compare-bar-h).
  const bottomClass = user
    ? 'bottom-[calc(var(--app-tabs-h)+var(--compare-bar-h,0px)+0.5rem)] lg:bottom-[calc(var(--compare-bar-h,0px)+1rem)]'
    : 'bottom-[calc(var(--compare-bar-h,0px)+1rem)]'

  const stickyBar = sticky && !owned ? (
    <div className={`fixed left-1/2 z-[45] flex w-[min(calc(100vw-32px),1180px)] -translate-x-1/2 items-center justify-between gap-3 rounded-[18px] bg-white px-4 py-3 shadow-raised ${bottomClass}`}>
      <div className="min-w-0">
        <div className="text-[11px] font-bold text-muted">Giá mua</div>
        <div className="truncate text-lg font-extrabold leading-tight text-red">{formatPrice(price ?? 0)}</div>
      </div>
      <button type="button" onClick={handleRegister} className="btn btn--green min-w-0 flex-1 py-3 text-[15px] sm:max-w-[320px] sm:flex-none sm:px-10">
        Đăng ký ngay
      </button>
    </div>
  ) : null

  return (
    <>
      <GuestLearnerPicker />
      <div ref={sentinelRef} />
      {owned
        ? <button type="button" onClick={handleRegister} className="btn btn--outline w-full px-6 py-3 text-[15px]">Đăng ký thêm cho bé khác</button>
        : <button type="button" onClick={handleRegister} className="btn btn--green w-full px-6 py-4 text-[17px]">Đăng ký ngay</button>}
      {mounted && createPortal(stickyBar, document.body)}
    </>
  )
}
