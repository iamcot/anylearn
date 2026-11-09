import { describe, expect, it } from 'vitest'
import type { FarmCrop, FarmPlot } from '@/lib/api/farm'
import { backgroundFor, cropImage, plotImage, timeOfDay } from './art'

const carrot = { cropKey: 'ca_rot_cau_vong', growMinutes: 30 } as FarmCrop
const plot = (o: Partial<FarmPlot>): FarmPlot => ({ slot: 0, phase: 'growing', cropKey: 'ca_rot_cau_vong', ...o })

describe('farm art', () => {
  it('picks the background by hour', () => {
    expect(timeOfDay(9)).toBe('day')
    expect(timeOfDay(17)).toBe('sunset')
    expect(timeOfDay(22)).toBe('night')
    expect(timeOfDay(3)).toBe('night')
    expect(backgroundFor('day', 'mobile')).toBe('/farm/bg_farm_day_mobile.webp')
  })
  it('picks the soil', () => {
    expect(plotImage(plot({ phase: 'empty' }))).toContain('plot_dry')
    expect(plotImage(plot({ phase: 'thirsty' }))).toContain('plot_dry')
    expect(plotImage(plot({ watersDone: 0 }))).toContain('plot_seeded')
    expect(plotImage(plot({ watersDone: 1 }))).toContain('plot_wet')
    expect(plotImage(plot({ fertilized: true, watersDone: 1 }))).toContain('plot_fertilized')
  })
  it('picks the crop picture by progress and skips crops without art', () => {
    expect(cropImage(plot({ secondsToRipe: 1700 }), carrot)).toContain('seedling')
    expect(cropImage(plot({ secondsToRipe: 600 }), carrot)).toContain('growing')
    expect(cropImage(plot({ phase: 'ripe' }), carrot)).toContain('ripe')
    expect(cropImage(plot({ cropKey: 'bap' }), { cropKey: 'bap', growMinutes: 30 } as FarmCrop)).toBeNull()
    expect(cropImage(plot({ phase: 'empty' }), carrot)).toBeNull()
  })
})
