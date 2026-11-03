'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { Leo } from '@/components/fun/Leo'
import CoinIcon from '@/components/fun/CoinIcon'
import BrandText from '@/components/fun/BrandText'
import { rewardQueue, shiftReward } from '@/lib/journey/store'
import { rewardLines } from '@/lib/journey/rules'

const SHOW_MS = 2600
const EMPTY = { coinName: 'Leo Xu', items: [] }

// Leo hands over a reward: a short overlay (about 2.5 s, a tap skips it), one reward after another from the queue.
// With reduced motion the coins do not fly; the card still shows for the same time.
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
      className="fixed inset-0 z-[90] flex cursor-pointer items-center justify-center border-0 bg-black/45 p-4">
      <div key={current.key} className="leo-pop relative w-full max-w-[320px] rounded-[22px] bg-white px-5 pb-5 pt-16 text-center shadow-[0_18px_40px_rgba(0,0,0,.25)]">
        <div className="absolute -top-14 left-1/2 w-28 -translate-x-1/2"><Leo waving className="w-full" /></div>
        {coins > 0 && (
          <div className="pointer-events-none absolute -top-6 left-1/2 flex -translate-x-1/2 gap-1" aria-hidden>
            {[0, 1, 2, 3, 4].map(i => <span key={i} className="reward-coin" style={{ animationDelay: `${i * 90}ms` }}><CoinIcon className="size-6" /></span>)}
          </div>
        )}
        <p className="m-0 text-base font-extrabold text-ink"><BrandText text={title} /></p>
        <ul className="m-0 mt-2 flex list-none flex-col gap-1 p-0">
          {gifts.map(g => <li key={g} className="text-sm font-bold text-green"><BrandText text={g} /></li>)}
        </ul>
        <p className="m-0 mt-3 text-xs text-muted">Chạm để tiếp tục{queue.items.length > 1 ? ` (còn ${queue.items.length - 1})` : ''}</p>
      </div>
    </button>
  )
}
