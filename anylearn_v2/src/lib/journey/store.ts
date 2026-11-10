import type { Journey, Reward } from '@/lib/api/gamification'

// Small client stores shared by the journey host, Leo's reward overlay, Leo's guide and the journey cards.

type Listener = () => void

function createStore<T>(initial: T) {
  let value = initial
  const listeners = new Set<Listener>()
  return {
    get: () => value,
    set(next: T) { value = next; listeners.forEach(l => l()) },
    subscribe(l: Listener) { listeners.add(l); return () => { listeners.delete(l) } },
  }
}

/** Rewards waiting for Leo's coin animation, oldest first. */
export const rewardQueue = createStore<{ coinName: string; items: Reward[] }>({ coinName: 'Leo Xu', items: [] })

export function enqueueRewards(items: Reward[], coinName = 'Leo Xu') {
  if (items.length === 0) return
  const cur = rewardQueue.get()
  rewardQueue.set({ coinName, items: [...cur.items, ...items] })
}

export function shiftReward() {
  const cur = rewardQueue.get()
  rewardQueue.set({ ...cur, items: cur.items.slice(1) })
}

/** The latest journey of the signed-in person (null = not loaded or a visitor). */
export const journeyStore = createStore<Journey | null>(null)

/** Bumped to make the host claim right away (after an action that completes a mission). */
export const claimNudge = createStore<number>(0)

export function nudgeJourneyClaim() {
  claimNudge.set(claimNudge.get() + 1)
}

const GUIDE_OFF_KEY = 'leo-guide:off'
export const guideOff = createStore<boolean>(false)

export function readGuideOff(): boolean {
  try { return localStorage.getItem(GUIDE_OFF_KEY) === '1' } catch { return false }
}

export function setGuideOff(off: boolean) {
  try { if (off) localStorage.setItem(GUIDE_OFF_KEY, '1'); else localStorage.removeItem(GUIDE_OFF_KEY) } catch { /* private mode */ }
  guideOff.set(off)
}

/** Bumped after an order is placed or paid so Leo's farm gift is asked for at once. */
export const farmGiftNudge = createStore<number>(0)

export function nudgeFarmGift() {
  farmGiftNudge.set(farmGiftNudge.get() + 1)
}
