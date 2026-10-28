'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { ChevronLeftIcon } from '@/components/icons'
import { countAchievementShare, getPublicAchievement, type PublicAchievement } from '@/lib/api/achievements'
import { shareText, shareUrl } from '@/lib/achievements/share'

export default function ShareAchievementPage() {
  const { token: achToken } = useParams<{ token: string }>()
  const { token } = useAuth()
  const [a, setA] = useState<PublicAchievement | null>(null)
  const [missing, setMissing] = useState(false)
  const [note, setNote] = useState('')

  useEffect(() => {
    getPublicAchievement(achToken).then(v => (v ? setA(v) : setMissing(true)))
  }, [achToken])

  const url = typeof window === 'undefined' ? shareUrl(achToken) : `${window.location.origin}/share/${achToken}`

  function counted() { if (token) countAchievementShare(token, achToken) }

  async function share() {
    if (!a) return
    const text = shareText(a, url)
    try {
      if (navigator.share) await navigator.share({ title: a.title, text, url })
      else { await navigator.clipboard.writeText(text); setNote('Đã chép liên kết, dán vào Zalo hoặc Messenger nhé.') }
      counted()
    } catch {}
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setNote('Đã chép liên kết.')
      counted()
    } catch { setNote('Không chép được, bạn giữ vào liên kết để chép nhé.') }
  }

  return (
    <div className="mx-auto max-w-[480px] px-4 pb-28 pt-5 lg:pb-12 lg:pt-8">
      <Link href="/fun" className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-muted no-underline"><ChevronLeftIcon className="size-4" /> Vui học</Link>
      {missing && <p className="rounded-2xl bg-white p-4 text-center text-sm text-muted ring-1 ring-line">Không tìm thấy banner này.</p>}
      {!missing && !a && <div className="h-96 animate-pulse rounded-3xl bg-slate-200" />}
      {a && (
        <>
          <h1 className="m-0 text-xl font-black">{a.title}</h1>
          <p className="mb-3 mt-1 text-sm text-muted">{a.subtitle}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/share/${achToken}/banner`} alt={a.title} className="w-full rounded-3xl shadow-lg ring-1 ring-line" />
          <div className="mt-4 grid gap-2">
            <button type="button" onClick={share} className="min-h-12 cursor-pointer rounded-full border-0 bg-green px-6 text-base font-extrabold text-white">Chia sẻ cho bạn bè</button>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={copy} className="min-h-11 cursor-pointer rounded-full border border-line bg-white px-4 text-sm font-bold">Chép liên kết</button>
              <a href={`/share/${achToken}/banner`} download={`anylearn-${achToken}.png`} onClick={counted} className="inline-flex min-h-11 items-center justify-center rounded-full border border-line bg-white px-4 text-sm font-bold text-ink no-underline">Lưu ảnh</a>
            </div>
            {note && <p className="m-0 text-center text-sm text-green-dark" role="status">{note}</p>}
          </div>
        </>
      )}
    </div>
  )
}
