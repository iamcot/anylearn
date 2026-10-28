'use client'

import { useState } from 'react'
import { sendOffer, type StickerItem } from '@/lib/api/stickers'
import { tradables, tradeStep, wantables } from '@/lib/stickers/rules'
import StickerTile from './StickerTile'

const STEP_HELP = {
  give: '1. Chọn sticker trùng bạn muốn đưa đi',
  want: '2. Chọn sticker bạn còn thiếu (cùng độ hiếm)',
  phone: '3. Nhập số điện thoại của bạn bè',
  ready: 'Sẵn sàng gửi lời mời đổi',
} as const

export default function TradePanel({ token, items, eligible, onSent }: { token: string; items: StickerItem[]; eligible: boolean; onSent: () => void }) {
  const [give, setGive] = useState<StickerItem | null>(null)
  const [want, setWant] = useState<StickerItem | null>(null)
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const mine = tradables(items)
  const options = wantables(items, give)
  const step = tradeStep(give, want, phone)

  const send = async () => {
    if (!give || !want || busy) return
    setBusy(true)
    setMessage(null)
    const { data, error } = await sendOffer(token, { toPhone: phone, giveId: give.id, wantId: want.id })
    setBusy(false)
    if (error || !data) return setMessage({ ok: false, text: error ?? 'Không gửi được lời mời' })
    setMessage({ ok: true, text: `Đã gửi lời mời cho ${data.toName}. Khi bạn ấy đồng ý, sticker sẽ tự đổi.` })
    setGive(null)
    setWant(null)
    setPhone('')
    onSent()
  }

  return (
    <section className="rounded-2xl border border-line bg-white p-4" aria-label="Đổi sticker">
      <h2 className="m-0 text-base font-extrabold">Đổi sticker với bạn bè</h2>
      <p className="mb-3 mt-1 text-sm text-muted">Đổi 1 lấy 1, cùng độ hiếm. Mỗi cặp bạn chỉ đổi 1 lần trong 30 ngày.</p>
      {!eligible && <p className="mb-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Bạn cần dùng anyLEARN thêm vài ngày và điểm danh đủ ngày mới đổi được sticker.</p>}
      {mine.length === 0
        ? <p className="m-0 text-sm text-muted">Bạn chưa có sticker trùng để đổi. Điểm danh mỗi ngày để nhận thêm nhé!</p>
        : (
          <div className="grid gap-3">
            <p className="m-0 text-sm font-bold text-green-dark">{STEP_HELP[step]}</p>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {mine.map(item => <StickerTile key={item.id} item={item} selected={give?.id === item.id} onClick={() => { setGive(item); setWant(null) }} />)}
            </div>
            {give && (
              options.length === 0
                ? <p className="m-0 text-sm text-muted">Bạn đã có đủ sticker cùng độ hiếm này rồi.</p>
                : <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">{options.map(item => <StickerTile key={item.id} item={item} reveal selected={want?.id === item.id} onClick={() => setWant(item)} />)}</div>
            )}
            {give && want && (
              <div className="flex flex-wrap items-center gap-2">
                <input className="field max-w-[220px]" type="tel" inputMode="tel" placeholder="Số điện thoại của bạn bè" value={phone} onChange={e => setPhone(e.target.value)} />
                <button type="button" onClick={send} disabled={step !== 'ready' || busy || !eligible}
                  className="min-h-11 cursor-pointer rounded-full border-0 bg-green px-5 text-[15px] font-black text-white disabled:opacity-50">
                  {busy ? 'Đang gửi...' : 'Gửi lời mời đổi'}
                </button>
              </div>
            )}
          </div>
        )}
      {message && <p className={`mb-0 mt-3 text-sm ${message.ok ? 'text-green-dark' : 'text-warn-text'}`} role="status">{message.text}</p>}
    </section>
  )
}
