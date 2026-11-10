'use client'

import NpcSays from '@/components/fun/farm/NpcSays'
import { useState } from 'react'
import type { FarmProgress, FarmView } from '@/lib/api/farm'
import { enqueueRewards } from '@/lib/journey/store'
import { claimChallenge, claimChapter, claimPath, claimTask, claimTaskBox, levelUpFarm } from '@/lib/api/farm'

interface Props { token: string; view: FarmView; progress: FarmProgress; busy: boolean; run: (action: () => Promise<{ error?: string; data?: unknown }>, ok: string) => Promise<void>; setNote: (s: string) => void }

function Bar({ value, max }: { value: number; max: number }) {
  return <div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-green" style={{ width: `${Math.min(100, Math.round((value / Math.max(max, 1)) * 100))}%` }} /></div>
}

const GROUPS = { knowledge: 'Cây Tri thức', social: 'Hàng xóm', habit: 'Chăm chỉ' } as const

export default function QuestsTab({ token, view, progress, busy, run, setNote }: Props) {
  const t = progress.tasks
  const [branch, setBranch] = useState<'path' | 'daily' | 'challenge'>('path')
  const path = progress.path
  const need = Math.max(view.xpForNext - view.xpIntoLevel, 0)
  const branches = [['path', 'Lên cấp', [path, ...(progress.olderPaths ?? [])].some(pt => pt.steps.some(x => x.claimable))], ['daily', 'Hằng ngày', t.items.some(x => x.claimable) || t.boxReady], ['challenge', 'Thử thách', progress.challenges.some(x => x.claimable) || progress.chapters.some(x => x.claimable)]] as const
  return (
    <div className="mt-4 space-y-4">
      <NpcSays npc="npc_be_mam" name="Bé Mầm">Làm lần lượt từng bước để lên cấp nhé. Nhiệm vụ cũ chưa xong vẫn còn đây, bạn làm lúc nào cũng được.</NpcSays>
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1" role="tablist">
        {branches.map(([k, l, dot]) => (
          <button key={k} type="button" role="tab" aria-selected={branch === k} onClick={() => setBranch(k)} className={`relative min-h-10 cursor-pointer rounded-lg border-0 text-sm font-extrabold ${branch === k ? 'bg-white text-green-dark shadow-sm' : 'bg-transparent text-muted'}`}>
            {l}{dot && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-red-500" aria-hidden />}
          </button>
        ))}
      </div>

      {branch === 'path' && [path, ...(progress.olderPaths ?? [])].map((pt, n) => (
        <section key={pt.level} aria-label="Nhiệm vụ lên cấp" className="rounded-2xl bg-white p-4 ring-1 ring-line">
          <h2 className="m-0 text-lg font-black">Lên cấp {pt.level + 1}{n > 0 && <span className="ml-2 text-xs font-bold text-muted">chưa xong</span>}</h2>
          {n === 0 && <p className="mt-1 text-xs text-muted">Làm lần lượt từng bước. Nhiệm vụ cho khoảng {pt.percent}% XP cần để lên cấp, phần còn lại đến từ thu hoạch cây. Còn thiếu <b>{need} XP</b>.</p>}
          <ul className="m-0 mt-3 list-none space-y-3 p-0">
            {pt.steps.map(st => (
              <li key={st.index} className={st.locked ? 'opacity-50' : ''}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold">{st.index + 1}. {st.label} ({st.progress}/{st.target})<span className="ml-2 whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-extrabold text-amber-800">+{st.xp} XP</span></span>
                  {st.claimed ? <span className="text-xs font-extrabold text-green-dark">✓ Xong</span>
                    : <button type="button" className="min-h-9 cursor-pointer rounded-lg border-0 bg-green px-3 text-xs font-extrabold text-white disabled:opacity-40" disabled={busy || !st.claimable} onClick={() => run(async () => {
                      const r = await claimPath(token, st.index, pt.level)
                      if (!r.error) enqueueRewards([{ kind: 'mission', key: `farm:path:${pt.level}:${st.index}`, label: st.label, extra: [`+${st.xp} XP`] }], view.coinName)
                      return r
                    }, '')}>Nhận</button>}
                </div>
                <div className="mt-1"><Bar value={st.progress} max={st.target} /></div>
              </li>
            ))}
          </ul>
          {n === 0 && (
            <div className={`mt-4 rounded-xl p-3 ring-1 ${view.levelReady ? 'bg-amber-50 ring-amber-300' : 'bg-slate-50 opacity-70 ring-line'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-black">★ Lên cấp {pt.level + 1}{(view.levelCoinsNext ?? 0) > 0 && <span className="ml-2 whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-extrabold text-amber-800">+{view.levelCoinsNext} {view.coinName}</span>}</span>
                <button type="button" className="min-h-9 cursor-pointer rounded-lg border-0 bg-green px-3 text-xs font-extrabold text-white disabled:opacity-40" disabled={busy || !view.levelReady} onClick={() => run(async () => {
                  const r = await levelUpFarm(token)
                  if (!r.error) enqueueRewards([{ kind: 'mission', key: `farm:level:${pt.level + 1}`, label: `Lên cấp ${pt.level + 1}`, extra: r.data && r.data.levelCoins > 0 ? [`+${r.data.levelCoins} ${view.coinName}`] : [] }], view.coinName)
                  return r
                }, '')}>Lên cấp</button>
              </div>
              <div className="mt-1"><Bar value={Math.min(view.xpIntoLevel, view.xpForNext)} max={Math.max(view.xpForNext, 1)} /></div>
              <p className="mt-1 text-xs text-muted">{view.levelReady ? 'Đủ XP rồi, bấm để lên cấp và mở nhiệm vụ mới.' : `Cần đủ ${view.xpForNext} XP (còn thiếu ${need}). Lên cấp xong mới mở nhiệm vụ cấp mới.`}</p>
            </div>
          )}
          {n === 0 && pt.allDone && !view.levelReady && <p className="mt-3 rounded-xl bg-green-soft px-3 py-2 text-sm font-bold text-green-dark">Bạn đã xong chuỗi nhiệm vụ của cấp này. Thu hoạch thêm cây để đủ XP lên cấp {pt.level + 1}.</p>}
        </section>
      ))}

      {branch === 'daily' && <section aria-label="Việc hôm nay" className="rounded-2xl bg-white p-4 ring-1 ring-line">
        <h2 className="m-0 text-lg font-black">Việc hôm nay</h2>
        <p className="mt-1 text-xs text-muted">Việc nhẹ, mỗi việc nhận {t.xp} XP và 1 phân bón. Xong cả 3 việc mở hộp quà {t.boxMin}-{t.boxMax} {view.coinName}. Việc không dồn sang ngày mai.</p>
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
      </section>}

      {branch === 'challenge' && <>
      {(['knowledge', 'social', 'habit'] as const).map(g => (
        <section key={g} aria-label={GROUPS[g]} className="rounded-2xl bg-white p-4 ring-1 ring-line">
          <h2 className="m-0 text-lg font-black">{GROUPS[g]}</h2>
          {g === 'knowledge' && <p className="mt-1 text-xs text-muted">Hạt Tri thức nhận khi bé đi học hoặc học video. Thử thách không cộng XP lên cấp, chỉ thưởng xu và phân bón.</p>}
          <ul className="m-0 mt-3 list-none space-y-3 p-0">
            {progress.challenges.filter(c => c.group === g).map(c => (
              <li key={c.key}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold">{c.label} ({c.progress}/{c.target})<span className="ml-2 whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-extrabold text-amber-800">+{c.coins} xu · +{c.fertilizer} phân</span></span>
                  {c.claimed ? <span className="text-xs font-extrabold text-green-dark">✓ Đã nhận</span>
                    : <button type="button" className="min-h-9 cursor-pointer rounded-lg border-0 bg-green px-3 text-xs font-extrabold text-white disabled:opacity-40" disabled={busy || !c.claimable} onClick={() => run(async () => {
                      const r = await claimChallenge(token, c.key)
                      if (!r.error) enqueueRewards([{ kind: 'mission', key: `farm:chal:${c.key}`, label: c.label, coins: c.coins, extra: [`+${c.fertilizer} phân bón`] }], view.coinName)
                      return r
                    }, '')}>Nhận</button>}
                </div>
                <div className="mt-1"><Bar value={c.progress} max={c.target} /></div>
              </li>
            ))}
          </ul>
        </section>
      ))}

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
      </>}
    </div>
  )
}
