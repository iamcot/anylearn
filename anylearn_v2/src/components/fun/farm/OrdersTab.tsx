'use client'

import type { FarmProgress, FarmView } from '@/lib/api/farm'
import { deliverOrder, skipOrder } from '@/lib/api/farm'

interface Props { token: string; view: FarmView; progress: FarmProgress; busy: boolean; run: (action: () => Promise<{ error?: string; data?: unknown }>, ok: string) => Promise<void>; setNote: (s: string) => void }

export default function OrdersTab({ token, view, progress, busy, run, setNote }: Props) {
  const have = (key: string) => view.inventory[key] ?? 0
  const name = (key: string) => view.crops.find(c => c.cropKey === key)
  return (
    <section aria-label="Đơn hàng" className="mt-4 space-y-3">
      <p className="m-0 text-sm text-muted">Bác Bù Nhìn nhận đơn của dân làng. Giao đủ nông sản (kể cả hoa hái được ở vườn bạn) để nhận XP và {view.coinName}. Khi hôm nay hết trần lãi, đơn trả XP và 1 phân bón thay cho xu.</p>
      {progress.orders.length === 0 && <p className="text-sm text-muted">Chưa có đơn mới, lát nữa quay lại nhé.</p>}
      {progress.orders.map(o => {
        const ready = Object.entries(o.items).every(([k, q]) => have(k) >= q)
        return (
          <div key={o.id} className="rounded-2xl bg-white p-4 ring-1 ring-line">
            <ul className="m-0 list-none space-y-1 p-0">
              {Object.entries(o.items).map(([k, q]) => (
                <li key={k} className={`text-sm font-bold ${have(k) >= q ? 'text-green-dark' : 'text-ink'}`}>{name(k)?.emoji} {name(k)?.name} · {Math.min(have(k), q)}/{q}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted">Thưởng: {o.xp} XP · {o.coins} {view.coinName}</p>
            <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
              <button type="button" className="btn btn--green min-h-11" disabled={busy || !ready} onClick={() => run(async () => {
                const r = await deliverOrder(token, o.id)
                if (r.data) setNote(r.data.capped ? `Giao đơn xong, +${r.data.xp} XP. Hôm nay hết trần lãi nên nhận 1 phân bón thay cho xu.` : `Giao đơn xong! +${r.data.xp} XP, +${r.data.coins} ${view.coinName}${r.data.levelUp ? `. Lên cấp ${r.data.level}!` : ''}`)
                return r
              }, '')}>{ready ? 'Giao đơn' : 'Chưa đủ nông sản'}</button>
              <button type="button" className="min-h-11 cursor-pointer rounded-xl border-0 bg-white px-3 text-xs font-extrabold text-muted ring-1 ring-line" disabled={busy} onClick={() => run(() => skipOrder(token, o.id), 'Đã bỏ đơn')}>Bỏ đơn</button>
            </div>
          </div>
        )
      })}
    </section>
  )
}
