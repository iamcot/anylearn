import { FILTER_ALL, type QuickChipId } from '@/config/searchFilters'
import type { AdvancedFilters, SearchFilters } from './query'

export interface QuickState {
  filters: SearchFilters
  adv: AdvancedFilters
}

export function isQuickChipOn(chip: QuickChipId, state: QuickState): boolean {
  switch (chip) {
    case 'near': return state.adv.near !== undefined
    case 'freeTrial': return state.adv.freeTrial
    case 'onSale': return state.adv.onSale
    case 'online': return state.filters.hinhthuc === 'online'
  }
}

// Switches a chip that is not "near" (that one needs the position, see useNearMe) and returns the new filters.
export function toggleQuickChip(chip: Exclude<QuickChipId, 'near'>, state: QuickState): QuickState {
  const turnOn = !isQuickChipOn(chip, state)
  switch (chip) {
    case 'freeTrial': return { ...state, adv: { ...state.adv, freeTrial: turnOn } }
    case 'onSale': return { ...state, adv: { ...state.adv, onSale: turnOn } }
    case 'online': return { ...state, filters: { ...state.filters, hinhthuc: turnOn ? 'online' : FILTER_ALL } }
  }
}
