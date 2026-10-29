'use client'

import { useEffect, useState } from 'react'
import { getMyRewards } from '@/lib/api/rewards'
import { FUN_INVITE_TEXT, funInviteLink } from '@/lib/referral/funInvite'
import { ShareIcon } from '@/components/icons'

/** "Mời bạn" on the Vui học scene: shares /fun with the person's referral code (share sheet on a phone, copied link elsewhere). */
export default function InviteFunButton({ token, className = '' }: { token: string; className?: string }) {
  const [link, setLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    getMyRewards(token).then(rewards => { if (rewards?.referral.code) setLink(funInviteLink(rewards.referral.code)) })
  }, [token])

  if (!link) return null

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: 'Vui học cùng Leo', text: FUN_INVITE_TEXT, url: link })
      else {
        await navigator.clipboard.writeText(link)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch { /* the person closed the share sheet */ }
  }

  return (
    <button type="button" onClick={share}
      className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border-0 bg-white/90 px-3 text-xs font-extrabold text-green-dark shadow ${className}`}>
      {copied ? 'Đã chép link' : 'Mời bạn'} <ShareIcon className="size-4" aria-hidden />
    </button>
  )
}
