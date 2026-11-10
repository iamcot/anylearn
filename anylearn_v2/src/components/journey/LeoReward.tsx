'use client'

import { useEffect, useSyncExternalStore, type CSSProperties } from 'react'
import { Leo } from '@/components/fun/Leo'
import CoinIcon from '@/components/fun/CoinIcon'
import BrandText from '@/components/fun/BrandText'
import { rewardQueue, shiftReward } from '@/lib/journey/store'
import { rewardLines } from '@/lib/journey/rules'

const SHOW_MS = 2600
const EMPTY = { coinName: 'Leo Xu', items: [] }
// Coins leave Leo in every direction like sun rays; sparkles twinkle around him.
// (angles above the card only, so nothing crosses the text: 0 = straight up)
const COIN_ANGLES = [-100, -70, -40, -12, 12, 40, 70, 100]
const SPARKLES = [
  { x: 6, y: 30, s: 14, d: 0 }, { x: 88, y: 12, s: 18, d: 260 }, { x: 20, y: 6, s: 12, d: 520 },
  { x: 94, y: 40, s: 14, d: 140 }, { x: 52, y: -4, s: 12, d: 380 }, { x: 72, y: 2, s: 10, d: 640 },
  { x: 0, y: 46, s: 10, d: 800 }, { x: 34, y: 0, s: 16, d: 940 },
]

function Sparkle({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path d="M12 0c.6 5.6 2.4 7.8 12 12-9.6 4.2-11.4 6.4-12 12-.6-5.6-2.4-7.8-12-12C9.6 7.8 11.4 5.6 12 0Z" fill="#FFD23F" />
    </svg>
  )
}

// Leo hands over a reward: a short overlay (about 2.5 s, a tap skips it), one reward after another from the queue.
// Behind Leo a sun turns (golden rays + glow), coins burst out around him and sparkles blink.
// With reduced motion nothing moves; the rays stay as a still picture and the card shows for the same time.
export default function LeoReward() {
  const queue = useSyncExternalStore(rewardQueue.subscribe, rewardQueue.get, () => EMPTY)
  const current = queue.items[0]

  useEffect(() => {
    if (!current) return
    const t = window.setTimeout(shiftReward, SHOW_MS)
    return () => window.clearTimeout(t)
  }, [current])

  if (!current) return null
  const { title, gifts } = rewardLines(current, queue.coinName)
  const coins = current.coins ?? 0
  return (
    <button type="button" onClick={shiftReward} aria-label="Đóng"
      className="fixed inset-0 z-[1100] flex cursor-pointer items-center justify-center border-0 bg-black/45 p-4">
      <div key={current.key} className="relative w-full max-w-[320px]">
        {/* the sun sits behind the card, so its rays rise above the card's top edge around Leo */}
        <div className="pointer-events-none absolute left-1/2 top-0 size-72 -translate-x-1/2 -translate-y-1/2" aria-hidden>
          <div className="reward-rays absolute inset-0 rounded-full" />
          <div className="reward-glow absolute inset-[22%] rounded-full" />
        </div>
        <div className="leo-pop relative rounded-[22px] bg-white px-5 pb-5 pt-16 text-center shadow-[0_18px_40px_rgba(0,0,0,.25)]">
          <div className="absolute -top-14 left-1/2 w-28 -translate-x-1/2"><Leo waving className="w-full" /></div>
          <p className="m-0 text-base font-extrabold text-ink"><BrandText text={title} /></p>
          <ul className="m-0 mt-2 flex list-none flex-col gap-1 p-0">
            {gifts.map(g => <li key={g} className="text-sm font-bold text-green"><BrandText text={g} /></li>)}
          </ul>
          <p className="m-0 mt-3 text-xs text-muted">Chạm để tiếp tục{queue.items.length > 1 ? ` (còn ${queue.items.length - 1})` : ''}</p>
        </div>
        <div className="pointer-events-none absolute left-1/2 top-0 size-60 -translate-x-1/2 -translate-y-1/2" aria-hidden>
          {coins > 0 && COIN_ANGLES.map((a, i) => (
            <span key={a} className="reward-coin absolute left-1/2 top-1/2 -ml-3 -mt-3" style={{ '--a': `${a}deg`, animationDelay: `${(i % 2) * 120}ms` } as CSSProperties}>
              <CoinIcon className="size-6" />
            </span>
          ))}
          {SPARKLES.map((p, i) => (
            <span key={i} className="reward-sparkle absolute" style={{ left: `${p.x}%`, top: `${p.y}%`, animationDelay: `${p.d}ms` }}><Sparkle size={p.s} /></span>
          ))}
        </div>
      </div>
    </button>
  )
}
