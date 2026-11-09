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
  serverNow: string; coinName: string; balance: number; level: number; xp: number; xpIntoLevel: number; xpForNext: number
  plots: FarmPlot[]; inventory: Record<string, number>; crops: FarmCrop[]; fertilizerPrice: number
  market: { prices: FarmPrice[]; room: number; dayCap: number; weekCap: number }
}

export const getFarm = (token: string) => authFetch<FarmView>('/farm', token)
export const plantCrop = (token: string, slot: number, cropKey: string) => authFetch<{ planted: string; free: boolean }>('/farm/plant', token, { method: 'POST', body: JSON.stringify({ slot, cropKey }) })
export const waterPlots = (token: string, slots: number[]) => authFetch<{ watered: number }>('/farm/water', token, { method: 'POST', body: JSON.stringify({ slots }) })
export const fertilizePlot = (token: string, slot: number) => authFetch<{ fertilized: boolean }>('/farm/fertilize', token, { method: 'POST', body: JSON.stringify({ slot }) })
export const buyFertilizer = (token: string, qty: number) => authFetch<{ bought: number }>('/farm/buy-fertilizer', token, { method: 'POST', body: JSON.stringify({ qty }) })
export const harvestPlots = (token: string, slots: number[]) => authFetch<{ harvested: Record<string, number>; xp: number; levelUp: boolean; level: number }>('/farm/harvest', token, { method: 'POST', body: JSON.stringify({ slots }) })
export const sellCrops = (token: string, items: Record<string, number>) => authFetch<{ sold: Record<string, number>; coins: number; capped: boolean }>('/farm/sell', token, { method: 'POST', body: JSON.stringify({ items }) })
