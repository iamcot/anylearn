export type SlotKind = 'roadmap' | 'community' | 'search'

const SLOT_FLAGS: Record<SlotKind, boolean> = {
  roadmap: process.env.NEXT_PUBLIC_TODAY_ROADMAP === '1',
  community: process.env.NEXT_PUBLIC_TODAY_COMMUNITY === '1',
  search: process.env.NEXT_PUBLIC_TODAY_SEARCH === '1',
}

// "+X anyPoint" badge on course cards in lists (plan 02.2): on, set NEXT_PUBLIC_CARD_POINTS=0 to hide it.
export const CARD_POINTS_ENABLED = process.env.NEXT_PUBLIC_CARD_POINTS !== '0'

export function enabledSlots(): SlotKind[] {
  return (Object.keys(SLOT_FLAGS) as SlotKind[]).filter(kind => SLOT_FLAGS[kind])
}
