'use client'

import { NEAR_RADIUS_KM, QUICK_CHIPS, type QuickChipId } from '@/config/searchFilters'
import { isQuickChipOn, toggleQuickChip } from '@/lib/search/quickFilters'
import type { SearchState } from '@/lib/search/query'
import { GUEST_CHIP_OFF, GUEST_CHIP_ON } from '@/components/guest/chipStyles'
import { useNearMe } from './useNearMe'

interface Props {
  state: SearchState
  apply: (patch: Partial<SearchState>) => void
  onNeedDistrict: () => void
}

// Chips under the search box: one tap switches a filter on or off (plan 04.2).
export default function QuickChips({ state, apply, onNeedDistrict }: Props) {
  const { status, locate, clearStatus } = useNearMe()

  const switchNear = async () => {
    if (state.adv.near) {
      apply({ adv: { ...state.adv, near: undefined, radiusKm: undefined }, sort: state.sort === 'nearest' ? 'popular' : state.sort })
      return
    }
    const point = await locate()
    if (point) apply({ adv: { ...state.adv, near: point, radiusKm: NEAR_RADIUS_KM }, sort: state.sort === 'popular' ? 'nearest' : state.sort })
  }

  const press = (id: QuickChipId) => {
    clearStatus()
    if (id === 'near') return void switchNear()
    const next = toggleQuickChip(id, state)
    apply({ filters: next.filters, adv: next.adv })
  }

  return (
    <div className="container pb-1">
      <div className="flex items-center gap-2 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Lọc nhanh">
        {QUICK_CHIPS.map(chip => {
          const on = isQuickChipOn(chip.id, state)
          return (
            <button key={chip.id} type="button" aria-pressed={on} disabled={chip.id === 'near' && status === 'locating'} onClick={() => press(chip.id)} className={on ? GUEST_CHIP_ON : GUEST_CHIP_OFF}>
              {chip.id === 'near' && status === 'locating' ? 'Đang lấy vị trí...' : chip.label}
            </button>
          )
        })}
      </div>
      {status === 'no-position' && (
        <p className="m-0 mt-1 text-sm text-muted">
          Chưa lấy được vị trí của bạn.{' '}
          <button type="button" onClick={() => { clearStatus(); onNeedDistrict() }} className="cursor-pointer border-0 bg-transparent p-0 font-medium text-green-dark underline">
            Chọn quận/huyện
          </button>
        </p>
      )}
    </div>
  )
}
