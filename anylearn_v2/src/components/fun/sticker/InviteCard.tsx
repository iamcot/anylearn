'use client'

import { useEffect, useState } from 'react'
import { getMyRewards } from '@/lib/api/rewards'
import { stickerInviteLink } from '@/lib/stickers/rules'
import type { Album } from '@/lib/api/stickers'

export default function InviteCard({ token, album }: { token: string; album: Album }) {
  const [link, setLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    getMyRewards(token).then(rewards => { if (rewards?.referral.link) setLink(stickerInviteLink(rewards.referral.link)) })
  }, [token])

  const copy = async () => {
    if (!link) return
    try {
      if (navigator.share) await navigator.share({ title: 'anyLEARN', text: 'Vào anyLEARN nhận gói quà 3 sticker nè!', url: link })
      else await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* the person closed the share sheet */ }
  }

  return (
    <section className="rounded-2xl border border-line bg-white p-4" aria-label="Mời bạn bè">
      <h2 className="m-0 text-base font-extrabold">Mời bạn nhận gói quà 3 sticker</h2>
      <p className="mb-3 mt-1 text-sm text-muted">
        Bạn của bạn nhận 1 sticker ngay khi đăng ký, và 2 sticker nữa sau khi điểm danh ngày thứ 2. Khi bạn ấy chơi đủ ngày, bạn nhận thêm 1 sticker (tối đa {album.monthCap} lượt mỗi tháng).
      </p>
      <button type="button" onClick={copy} disabled={!link} className="min-h-11 cursor-pointer rounded-full border-0 bg-green px-5 text-[15px] font-black text-white disabled:opacity-50">
        {copied ? 'Đã chép link' : 'Gửi link mời'}
      </button>
      <p className="mb-0 mt-3 text-sm text-muted">Đã mời {album.invited} người, {album.invitedDone} người đã hoàn thành gói quà.</p>
      {album.pack && (
        <p className="mb-0 mt-2 text-sm">
          Gói quà của bạn: {album.pack.part1 ? 'đợt 1 đã nhận' : 'đợt 1 chưa có'}, {album.pack.part2 ? 'đợt 2 đã nhận' : album.pack.status === 'review' ? 'đợt 2 đang chờ duyệt' : 'điểm danh ngày thứ 2 để nhận đợt 2'}.
        </p>
      )}
    </section>
  )
}
