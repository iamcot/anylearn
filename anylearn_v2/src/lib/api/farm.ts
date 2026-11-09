import { authFetch } from './client'

export interface FarmCrop {
  cropKey: string; name: string; category: string; growMinutes: number; waterNeeds: number; seedPrice: number
  baseYield: number; xp: number; unlockLevel: number; stealable: number; emoji: string | null; imageUrl: string | null
  description: string | null; locked: boolean
}

export type FarmPhase = 'empty' | 'growing' | 'thirsty' | 'ripe' | 'wilting'

export interface FarmPlot {
  slot: number; phase: FarmPhase; cropKey?: string; fertilized?: boolean; watersDone?: number; waterNeeds?: number
  yield?: number; needsWater?: boolean; secondsToRipe?: number; ripeAt?: string | null; nextWaterAt?: string | null
}

export interface FarmPrice { cropKey: string; price: number; basePrice: number; soldToday: number; nextPercent: number }

export interface FarmView {
  serverNow: string; coinName: string; balance: number; level: number; xp: number; xpIntoLevel: number; xpForNext: number; levelReady?: boolean; levelCoinsNext?: number
  plots: FarmPlot[]; inventory: Record<string, number>; crops: FarmCrop[]; fertilizerPrice: number
  market: { prices: FarmPrice[]; room: number; dayCap: number; weekCap: number }
  allowSteal: boolean; nextPlotPrice: number; nextPlotLevel: number
}

export const getFarm = (token: string) => authFetch<FarmView>('/farm', token)
export const plantCrop = (token: string, slot: number, cropKey: string) => authFetch<{ planted: string; free: boolean }>('/farm/plant', token, { method: 'POST', body: JSON.stringify({ slot, cropKey }) })
export const waterPlots = (token: string, slots: number[]) => authFetch<{ watered: number }>('/farm/water', token, { method: 'POST', body: JSON.stringify({ slots }) })
export const fertilizePlot = (token: string, slot: number) => authFetch<{ fertilized: boolean }>('/farm/fertilize', token, { method: 'POST', body: JSON.stringify({ slot }) })
export const buyFertilizer = (token: string, qty: number) => authFetch<{ bought: number }>('/farm/buy-fertilizer', token, { method: 'POST', body: JSON.stringify({ qty }) })
export const harvestPlots = (token: string, slots: number[]) => authFetch<{ harvested: Record<string, number>; xp: number; levelUp: boolean; level: number }>('/farm/harvest', token, { method: 'POST', body: JSON.stringify({ slots }) })
export const sellCrops = (token: string, items: Record<string, number>) => authFetch<{ sold: Record<string, number>; coins: number; capped: boolean }>('/farm/sell', token, { method: 'POST', body: JSON.stringify({ items }) })

// ---- 22.3 to 22.6: compost, plots, orders, tasks, chapters, neighbours ----

export interface FarmOrder { id: number; slot: number; xp: number; coins: number; items: Record<string, number> }
export interface FarmTaskRow { index: number; label: string; progress: number; target: number; claimed: boolean; claimable: boolean }
export interface FarmQuest { label: string; progress: number; target: number }
export interface FarmChapter {
  no: number; title: string; story: string; unlockLevel: number; open: boolean; claimed: boolean; claimable: boolean
  coins: number; reward: string; quests: FarmQuest[]
}
export interface FarmPathStep { index: number; label: string; progress: number; target: number; xp: number; claimed: boolean; locked: boolean; claimable: boolean }
export interface FarmPath { level: number; steps: FarmPathStep[]; allDone: boolean; percent: number }
export interface FarmChallenge { key: string; group: 'knowledge' | 'social' | 'habit'; label: string; progress: number; target: number; coins: number; fertilizer: number; claimed: boolean; claimable: boolean }
export interface FarmProgress {
  serverNow: string; hasDog: boolean; neighbors: number
  orders: FarmOrder[]
  path: FarmPath
  olderPaths?: FarmPath[]
  challenges: FarmChallenge[]
  tasks: { items: FarmTaskRow[]; xp: number; boxClaimed: boolean; boxReady: boolean; boxMin: number; boxMax: number }
  chapters: FarmChapter[]
  compost: { units: number; minutes: number; active: { id: number; readyAt: string; ready: boolean } | null }
}

export const getProgress = (token: string) => authFetch<FarmProgress>('/farm/progress', token)
export const startCompost = (token: string, cropKey: string) => authFetch<{ started: boolean }>('/farm/compost', token, { method: 'POST', body: JSON.stringify({ cropKey }) })
export const collectCompost = (token: string) => authFetch<{ fertilizer: number }>('/farm/compost/collect', token, { method: 'POST' })
export const expandPlots = (token: string) => authFetch<{ plots: number }>('/farm/expand', token, { method: 'POST' })
export const deliverOrder = (token: string, id: number) => authFetch<{ coins: number; xp: number; capped: boolean; levelUp: boolean; level: number }>(`/farm/orders/${id}/deliver`, token, { method: 'POST' })
export const skipOrder = (token: string, id: number) => authFetch<{ skipped: boolean }>(`/farm/orders/${id}/skip`, token, { method: 'POST' })
export const claimTask = (token: string, index: number) => authFetch<{ xp: number; levelUp: boolean }>(`/farm/tasks/${index}/claim`, token, { method: 'POST' })
export const claimTaskBox = (token: string) => authFetch<{ coins: number; capped: boolean }>('/farm/tasks/box', token, { method: 'POST' })
export const claimPath = (token: string, index: number, level?: number) => authFetch<{ xp: number; levelUp: boolean; level: number }>(`/farm/path/${index}/claim${level ? `?level=${level}` : ''}`, token, { method: 'POST' })
export const claimChallenge = (token: string, key: string) => authFetch<{ coins: number; fertilizer: number }>(`/farm/challenges/${key}/claim`, token, { method: 'POST' })
export const claimChapter = (token: string, no: number) => authFetch<{ coins: number; freePlot: boolean; dog: boolean }>(`/farm/chapters/${no}/claim`, token, { method: 'POST' })

export interface FarmNeighbor { userId: number; name: string; level: number }
export interface FarmSuggestion { userId: number; name: string; thirsty: number; pickable: number }
export interface FarmNeighbors { neighbors: FarmNeighbor[]; suggestions: FarmSuggestion[]; today: { helped: number; picked: number; caught: number } }
export interface VisitPlot { slot: number; phase: FarmPhase; cropKey?: string; emoji?: string | null; name?: string | null; stealable?: boolean; pickable?: boolean; needsWater?: boolean; fertilized?: boolean }
export interface FarmVisit { userId: number; name: string; level: number; allowSteal: boolean; hasDog: boolean; plots: VisitPlot[]; helpLeft: number; stealLeft: number }

export const getNeighbors = (token: string) => authFetch<FarmNeighbors>('/farm/neighbors', token)
export const addNeighbor = (token: string, code: string) => authFetch<{ added: string }>('/farm/neighbors', token, { method: 'POST', body: JSON.stringify({ code }) })
export const removeNeighbor = (token: string, id: number) => authFetch<{ removed: boolean }>(`/farm/neighbors/${id}`, token, { method: 'DELETE' })
export const visitFarm = (token: string, ownerId: number) => authFetch<FarmVisit>(`/farm/visit/${ownerId}`, token)
export const waterNeighbor = (token: string, ownerId: number, slots: number[]) => authFetch<{ watered: number; xp: number }>(`/farm/visit/${ownerId}/water`, token, { method: 'POST', body: JSON.stringify({ slots }) })
export const fertilizeNeighbor = (token: string, ownerId: number, slot: number) => authFetch<{ xp: number }>(`/farm/visit/${ownerId}/fertilize`, token, { method: 'POST', body: JSON.stringify({ slot }) })
export const stealFlower = (token: string, ownerId: number, slot: number) => authFetch<{ caught: boolean; message: string }>(`/farm/visit/${ownerId}/steal`, token, { method: 'POST', body: JSON.stringify({ slot }) })
export const setAllowSteal = (token: string, allowSteal: boolean) => authFetch<{ allowSteal: boolean }>('/farm/prefs', token, { method: 'PUT', body: JSON.stringify({ allowSteal }) })

/** Admins only: age the planted crops by some minutes (one slot, or all) to test the growth stages. */
export const debugAdvance = (token: string, minutes: number, slot?: number) => authFetch<{ plots: number }>('/farm/debug/advance', token, { method: 'POST', body: JSON.stringify({ minutes, slot }) })
export const debugFillOrders = (token: string) => authFetch<{ added: number }>('/farm/debug/advance', token, { method: 'POST', body: JSON.stringify({ kind: 'orders' }) })
export const debugNewOrders = (token: string) => authFetch<{ removed: number }>('/farm/debug/advance', token, { method: 'POST', body: JSON.stringify({ kind: 'new-orders' }) })

export const farmGift = (token: string) => authFetch<{ given: boolean }>('/farm/gift', token, { method: 'POST' })

export const levelUpFarm = (token: string) => authFetch<{ levelUp: boolean; level: number; levelCoins: number }>('/farm/level-up', token, { method: 'POST' })
