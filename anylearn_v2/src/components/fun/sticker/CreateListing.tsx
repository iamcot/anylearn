'use client'

import { useState } from 'react'
import { createListing, type StickerItem } from '@/lib/api/stickers'
import { createStep, listable, MAX_OFFERED, toggleGive, wantChoices } from '@/lib/stickers/market'
import StickerTile from './StickerTile'

const STEP_HELP = {
  give: `1. Chọn tối đa ${MAX_OFFERED} sticker trùng bạn muốn đưa ra (cùng độ hiếm)`,
  want: '2. Chọn sticker bạn đang cần (cùng độ hiếm)',
  ready: 'Sẵn sàng đăng tin',
} as const

/** The form of a new market post: pick up to three spare stickers of one rarity, then the one the player needs. */
export default function CreateListing({ token, items, days, onDone }: { token: string; items: StickerItem[]; days: number; onDone: (note: string) => void }) {
  const [give, setGive] = useState<StickerItem[]>([])
  const [want, setWant] = useState<StickerItem | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const mine = listable(items)
  const options = wantChoices(items, give)
  const step = createStep(give, want)

  const post = async () => {
    if (!want || give.length === 0 || busy) return
    setBusy(true)
    setError('')
    const { error: err } = await createListing(token, { give: give.map(g => g.id), want: want.id })
    setBusy(false)
    if (err) return setError(err)
    onDone(`Đã đăng tin. Các sticker bạn đưa ra được giữ lại trong ${days} ngày, hoặc tới khi bạn gỡ tin hay có người đổi.`)
  }

  if (mine.length === 0) return <p className="m-0 text-sm text-muted">Bạn chưa có sticker trùng nào để đăng lên chợ (sticker đã rao hoặc đang bị khóa không tính).</p>

  return (
    <div className="grid gap-3">
      <p className="m-0 text-sm font-bold text-green-dark">{STEP_HELP[step]}</p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
        {mine.map(item => (
          <StickerTile key={item.id} item={item} selected={give.some(g => g.id === item.id)} onClick={() => { setGive(toggleGive(give, item)); setWant(null) }} />
        ))}
      </div>
      {give.length > 0 && (
        options.length === 0
          ? <p className="m-0 text-sm text-muted">Bạn đã có đủ sticker cùng độ hiếm này rồi.</p>
          : <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">{options.map(item => <StickerTile key={item.id} item={item} reveal selected={want?.id === item.id} onClick={() => setWant(item)} />)}</div>
      )}
      {error && <p className="m-0 text-sm text-warn-text" role="alert">{error}</p>}
      {step === 'ready' && (
        <button type="button" onClick={post} disabled={busy} className="min-h-11 w-fit cursor-pointer rounded-full border-0 bg-green px-5 text-[15px] font-black text-white disabled:opacity-50">
          {busy ? 'Đang đăng...' : 'Đăng tin lên chợ'}
        </button>
      )}
    </div>
  )
}
