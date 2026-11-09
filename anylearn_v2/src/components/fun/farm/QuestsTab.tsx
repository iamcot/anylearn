'use client'

import type { FarmProgress, FarmView } from '@/lib/api/farm'
import { enqueueRewards } from '@/lib/journey/store'
import { claimChapter, claimTask, claimTaskBox } from '@/lib/api/farm'

interface Props { token: string; view: FarmView; progress: FarmProgress; busy: boolean; run: (action: () => Promise<{ error?: string; data?: unknown }>, ok: string) => Promise<void>; setNote: (s: string) => void }

function Bar({ value, max }: { value: number; max: number }) {
  return <div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-green" style={{ width: `${Math.min(100, Math.round((value / Math.max(max, 1)) * 100))}%` }} /></div>
}

export default function QuestsTab({ token, view, progress, busy, run, setNote }: Props) {
  const t = progress.tasks
  return (
    <div className="mt-4 space-y-5">
      <section aria-label="Việc hôm nay" className="rounded-2xl bg-white p-4 ring-1 ring-line">
        <h2 className="m-0 text-lg font-black">Việc hôm nay</h2>
        <p className="mt-1 text-xs text-muted">Mỗi việc nhận {t.xp} XP và 1 phân bón. Xong cả 3 việc mở hộp quà {t.boxMin}-{t.boxMax} {view.coinName}. Việc không dồn sang ngày mai.</p>
        <ul className="m-0 mt-3 list-none space-y-3 p-0">
          {t.items.map(it => (
            <li key={it.index}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold">{it.label} ({it.progress}/{it.target})<span className="ml-2 whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-extrabold text-amber-800">+{t.xp} XP · +1 phân</span></span>
                {it.claimed ? <span className="text-xs font-extrabold text-green-dark">✓ Đã nhận</span>
                  : <button type="button" className="min-h-9 cursor-pointer rounded-lg border-0 bg-green px-3 text-xs font-extrabold text-white disabled:opacity-40" disabled={busy || !it.claimable} onClick={() => run(async () => {
                    const r = await claimTask(token, it.index)
                    if (!r.error) enqueueRewards([{ kind: 'mission', key: `farm:task:${it.index}:${Date.now()}`, label: it.label, extra: [`+${t.xp} XP`, '+1 phân bón'] }], view.coinName)
                    return r
                  }, '')}>Nhận</button>}
              </div>
              <div className="mt-1"><Bar value={it.progress} max={it.target} /></div>
            </li>
          ))}
        </ul>
        <button type="button" className="btn btn--green mt-3 min-h-11 w-full" disabled={busy || !t.boxReady} onClick={() => run(async () => {
          const r = await claimTaskBox(token)
          if (r.data) {
            if (r.data.coins > 0) enqueueRewards([{ kind: 'order', key: `farm:box:${Date.now()}`, label: 'Hộp quà của Leo', coins: r.data.coins }], view.coinName)
            else setNote('Hôm nay hết trần lãi nên hộp quà trống, mai thử lại nhé')
          }
          return r
        }, '')}>{t.boxClaimed ? 'Đã mở hộp quà hôm nay' : '🎁 Mở hộp quà'}</button>
      </section>

      <section aria-label="Khu vườn của Leo">
        <h2 className="m-0 text-lg font-black">Khu vườn của Leo</h2>
        <div className="mt-2 space-y-3">
          {progress.chapters.map(c => (
            <div key={c.no} className={`rounded-2xl p-4 ring-1 ring-line ${c.open ? 'bg-white' : 'bg-slate-50 opacity-70'}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <b className="block text-sm">Chương {c.no}: {c.title}</b>
                  <span className="text-xs text-muted">{c.open ? c.story : `Mở khi đạt cấp ${c.unlockLevel} và xong chương trước`}</span>
                </div>
                {c.claimed && <span className="text-xs font-extrabold text-green-dark">✓ Xong</span>}
              </div>
              {c.open && !c.claimed && (
                <>
                  <ul className="m-0 mt-2 list-none space-y-2 p-0">
                    {c.quests.map(q => (
                      <li key={q.label}><span className="text-xs font-bold">{q.label} ({q.progress}/{q.target})</span><Bar value={q.progress} max={q.target} /></li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-muted">Thưởng: {c.coins} {view.coinName}{c.reward ? ` · ${c.reward}` : ''}</p>
                  <button type="button" className="btn btn--green mt-2 min-h-11 w-full" disabled={busy || !c.claimable} onClick={() => run(async () => {
                    const r = await claimChapter(token, c.no)
                    if (!r.error) enqueueRewards([{ kind: 'chapter', key: `farm:chapter:${c.no}`, label: `Xong chương ${c.no}: ${c.title}`, coins: c.coins }], view.coinName)
                    return r
                  }, '')}>Nhận thưởng chương</button>
                </>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
