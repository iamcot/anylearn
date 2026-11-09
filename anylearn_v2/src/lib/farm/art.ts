import type { FarmCrop, FarmPlot } from '@/lib/api/farm'

/** Pictures that exist in public/farm (made by scripts/farm_assets.py). Crops without pictures fall back to their emoji. */
export const farmImg = (name: string) => `/farm/${name}.webp`

/** Crops that already have the 4 stage pictures. Add a key here after dropping its files into assets/farm and running the script. */
export const CROPS_WITH_ART = new Set(['ca_rot_cau_vong'])

export type TimeOfDay = 'day' | 'sunset' | 'night'

export function timeOfDay(hour: number): TimeOfDay {
  if (hour >= 6 && hour < 17) return 'day'
  if (hour >= 17 && hour < 19) return 'sunset'
  return 'night'
}

export const backgroundFor = (tod: TimeOfDay, device: 'mobile' | 'desktop') => farmImg(`bg_farm_${tod}_${device}`)

/** Which soil picture a plot shows. */
export function plotImage(p: FarmPlot): string {
  if (p.phase === 'empty' || p.phase === 'thirsty') return farmImg('plot_dry')
  if (p.fertilized) return farmImg('plot_fertilized')
  if ((p.watersDone ?? 0) > 0) return farmImg('plot_wet')
  return farmImg('plot_seeded')
}

/** The growth picture on top of the soil, or null when the crop has no art yet (the page then shows the emoji). */
export function cropImage(p: FarmPlot, crop: FarmCrop | undefined, elapsedMs = 0): string | null {
  if (!crop || !p.cropKey || !CROPS_WITH_ART.has(p.cropKey) || p.phase === 'empty') return null
  if (p.phase === 'ripe' || p.phase === 'wilting') return farmImg(`${p.cropKey}_ripe`)
  const total = crop.growMinutes * 60
  const left = Math.max((p.secondsToRipe ?? total) - elapsedMs / 1000, 0)
  const done = total > 0 ? 1 - left / total : 0
  return farmImg(`${p.cropKey}_${done < 0.4 ? 'seedling' : 'growing'}`)
}
