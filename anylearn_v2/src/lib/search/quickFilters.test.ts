import { describe, expect, it } from 'vitest'
import { DEFAULT_ADVANCED, DEFAULT_FILTERS } from './query'
import { isQuickChipOn, toggleQuickChip, type QuickState } from './quickFilters'

const EMPTY: QuickState = { filters: DEFAULT_FILTERS, adv: DEFAULT_ADVANCED }

describe('toggleQuickChip', () => {
  it('online uses the format filter and clears it', () => {
    const on = toggleQuickChip('online', EMPTY)
    expect(on.filters.hinhthuc).toBe('online')
    expect(toggleQuickChip('online', on).filters.hinhthuc).toBe('all')
  })

  it('free trial and sale are plain switches', () => {
    expect(toggleQuickChip('freeTrial', EMPTY).adv.freeTrial).toBe(true)
    expect(toggleQuickChip('onSale', toggleQuickChip('onSale', EMPTY)).adv.onSale).toBe(false)
  })

  it('near is on only when a point is set', () => {
    expect(isQuickChipOn('near', EMPTY)).toBe(false)
    expect(isQuickChipOn('near', { ...EMPTY, adv: { ...DEFAULT_ADVANCED, near: { lat: 10.7, lng: 106.7 } } })).toBe(true)
  })
})
