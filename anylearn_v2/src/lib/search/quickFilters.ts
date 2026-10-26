import { FILTER_ALL, type QuickChipId } from '@/config/searchFilters'
import type { AdvancedFilters, SearchFilters } from './query'

const WEEKEND_SLOTS = ['weekend_morning', 'weekend_afternoon', 'weekend_evening']
const WEEKDAY_EVENING = ['weekday_evening']

export interface QuickState {
  filters: SearchFilters
  adv: AdvancedFilters
}

function hasAll(slots: string[], wanted: string[]): boolean {
  return wanted.every(slot => slots.includes(slot))
}

export function isQuickChipOn(chip: QuickChipId, state: QuickState): boolean {
  switch (chip) {
    case 'near': return state.adv.near !== undefined
    case 'weekend': return hasAll(state.adv.slots, WEEKEND_SLOTS)
    case 'weekdayEvening': return hasAll(state.adv.slots, WEEKDAY_EVENING)
    case 'freeTrial': return state.adv.freeTrial
    case 'onSale': return state.adv.onSale
    case 'online': return state.filters.hinhthuc === 'online'
  }
}

function withSlots(adv: AdvancedFilters, wanted: string[], on: boolean): AdvancedFilters {
  const rest = adv.slots.filter(slot => !wanted.includes(slot))
  return { ...adv, slots: on ? [...rest, ...wanted] : rest }
}

// Switches a chip that is not "near" (that one needs the position, see useNearMe) and returns the new filters.
export function toggleQuickChip(chip: Exclude<QuickChipId, 'near'>, state: QuickState): QuickState {
  const turnOn = !isQuickChipOn(chip, state)
  switch (chip) {
    case 'weekend': return { ...state, adv: withSlots(state.adv, WEEKEND_SLOTS, turnOn) }
    case 'weekdayEvening': return { ...state, adv: withSlots(state.adv, WEEKDAY_EVENING, turnOn) }
    case 'freeTrial': return { ...state, adv: { ...state.adv, freeTrial: turnOn } }
    case 'onSale': return { ...state, adv: { ...state.adv, onSale: turnOn } }
    case 'online': return { ...state, filters: { ...state.filters, hinhthuc: turnOn ? 'online' : FILTER_ALL } }
  }
}
