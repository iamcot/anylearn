import type { FarmPlot, FarmView } from '@/lib/api/farm'

/** "1g 05p", "12p 30s" or "45s" for a number of seconds. */
export function formatWait(seconds: number): string {
  const s = Math.max(Math.round(seconds), 0)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}g ${String(m).padStart(2, '0')}p`
  if (m > 0) return `${m}p ${String(s % 60).padStart(2, '0')}s`
  return `${s}s`
}

/** Seconds from now until `iso` (a server time without zone), using the offset between the server clock and this device. */
export function secondsUntil(iso: string | null | undefined, serverNow: string, elapsedSinceLoadMs: number): number {
  if (!iso) return 0
  const diff = (Date.parse(iso) - Date.parse(serverNow)) / 1000 - elapsedSinceLoadMs / 1000
  return Math.max(diff, 0)
}

export const needsWater = (p: FarmPlot) => p.phase === 'thirsty'
export const isRipe = (p: FarmPlot) => p.phase === 'ripe' || p.phase === 'wilting'

export function slotsToWater(plots: FarmPlot[]): number[] {
  return plots.filter(needsWater).map(p => p.slot)
}

export function slotsToHarvest(plots: FarmPlot[]): number[] {
  return plots.filter(isRipe).map(p => p.slot)
}

/** Crops in the inventory that can be sold (a crop key, not a seed or fertilizer), with how many. */
export function sellable(view: FarmView): { cropKey: string; qty: number }[] {
  const crops = new Set(view.crops.map(c => c.cropKey))
  return Object.entries(view.inventory).filter(([k, q]) => crops.has(k) && q > 0).map(([cropKey, qty]) => ({ cropKey, qty }))
}

export function seedCount(view: FarmView, cropKey: string): number {
  return view.inventory[`seed:${cropKey}`] ?? 0
}

/** "Hôm nay chợ còn mua thêm được lãi X" progress, 0..100 of today's cap that is used. */
export function capUsedPercent(room: number, dayCap: number): number {
  if (dayCap <= 0) return 100
  return Math.min(Math.max(Math.round(((dayCap - room) / dayCap) * 100), 0), 100)
}
