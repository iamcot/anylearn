'use client'

import { useEffect, useRef, useState } from 'react'
import type { SearchOptions } from '@/lib/api'
import {
  FILTER_ALL, PRICE_PRESETS, PROVINCE_OPTIONS, QUICK_CHIPS, TIME_SLOT_OPTIONS, type QuickChipId,
} from '@/config/searchFilters'
import { districtChipLabel, priceChipLabel, slotChipLabel } from '@/lib/search/chipLabels'
import { isQuickChipOn, toggleQuickChip } from '@/lib/search/quickFilters'
import { activeFilterCount, type AdvancedFilters, type SearchState } from '@/lib/search/query'
import { ClockIcon, CloseIcon, CoinIcon, FilterIcon, GiftIcon, MonitorIcon, PinIcon, TagIcon } from '@/components/icons'
import { GUEST_CHIP_OFF, GUEST_CHIP_ON } from '@/components/guest/chipStyles'
import ChipMenu from './ChipMenu'
import { useNearMe } from './useNearMe'

interface Props {
  state: SearchState
  apply: (patch: Partial<SearchState>) => void
  options: SearchOptions
  total: number
  loading: boolean
  onOpenFilters: () => void
  onNeedDistrict: () => void
  // Arrived from the home page chip "Gần tôi": look for the position once, without a second tap
  autoLocate?: boolean
}

type MenuId = 'slot' | 'price' | 'district'

const QUICK_ICONS: Record<QuickChipId, React.ReactNode> = {
  near: <PinIcon className="size-4" />,
  freeTrial: <GiftIcon className="size-4" />,
  onSale: <TagIcon className="size-4" />,
  online: <MonitorIcon className="size-4" />,
}

const FILTER_BUTTON = 'inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border border-ink bg-white px-4 text-sm font-medium text-ink'

function MenuFooter({ onClear, total, loading, onClose }: { onClear: () => void; total: number; loading: boolean; onClose: () => void }) {
  return (
    <>
      <button type="button" onClick={onClear} className="min-h-11 cursor-pointer border-0 bg-transparent p-0 text-sm text-muted underline">Xóa</button>
      <button type="button" onClick={onClose} className="btn btn--green px-5 py-2 text-sm">{loading ? 'Xem kết quả' : `Xem ${total} khóa học`}</button>
    </>
  )
}

const OPTION_CHIPS = 'flex flex-wrap gap-2'

// The chip row under the search box (plan 04.2): a "Lọc" button with the number of panel filters, chips that switch a
// filter on and off, and chips that open a small menu. Every change goes straight to the URL, so the count is live.
export default function FilterBar({ state, apply, options, total, loading, onOpenFilters, onNeedDistrict, autoLocate }: Props) {
  const { adv } = state
  const [menu, setMenu] = useState<MenuId | null>(null)
  const { status, locate, clearStatus } = useNearMe()
  const setAdv = (patch: Partial<AdvancedFilters>) => apply({ adv: { ...adv, ...patch } })
  const panelCount = activeFilterCount(state)

  const switchNear = async () => {
    if (adv.near) {
      apply({ adv: { ...adv, near: undefined, radiusKm: undefined }, sort: state.sort === 'nearest' ? 'popular' : state.sort })
      return
    }
    const point = await locate()
    if (point) apply({ adv: { ...adv, near: point }, sort: state.sort === 'popular' ? 'nearest' : state.sort })
  }

  const autoLocated = useRef(false)
  useEffect(() => {
    if (!autoLocate || autoLocated.current) return
    autoLocated.current = true
    void switchNear()
    // once, on arrival
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLocate])

  const pressQuick = (id: QuickChipId) => {
    clearStatus()
    if (id === 'near') return void switchNear()
    const next = toggleQuickChip(id, state)
    apply({ filters: next.filters, adv: next.adv })
  }

  const toggleSlot = (slot: string) => setAdv({ slots: adv.slots.includes(slot) ? adv.slots.filter(item => item !== slot) : [...adv.slots, slot] })
  const closeMenu = () => setMenu(null)
  const menuOpen = (id: MenuId) => (open: boolean) => setMenu(open ? id : null)
  const footer = (clear: () => void) => <MenuFooter onClear={clear} total={total} loading={loading} onClose={closeMenu} />

  const provinceChosen = state.filters.location !== FILTER_ALL

  return (
    <div className="sticky top-[76px] z-30 border-b border-line bg-white">
      <div className="container py-2">
        <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-wrap lg:overflow-visible" aria-label="Lọc nhanh">
          <button type="button" onClick={onOpenFilters} className={FILTER_BUTTON}>
            <FilterIcon className="size-4" />
            Lọc
            {panelCount > 0 && <span className="grid size-5 place-items-center rounded-full bg-green text-[11px] font-medium text-white">{panelCount}</span>}
          </button>

          {QUICK_CHIPS.slice(0, 1).map(chip => (
            <QuickChip key={chip.id} id={chip.id} label={status === 'locating' ? 'Đang lấy vị trí...' : chip.label} on={isQuickChipOn(chip.id, state)} busy={status === 'locating'} onPress={pressQuick} />
          ))}

          <ChipMenu
            label={slotChipLabel(adv.slots)} icon={<ClockIcon className="size-4" />} active={adv.slots.length > 0}
            open={menu === 'slot'} onOpenChange={menuOpen('slot')} title="Khung giờ học" footer={footer(() => setAdv({ slots: [] }))}
          >
            <div className={OPTION_CHIPS}>
              {TIME_SLOT_OPTIONS.map(slot => {
                const on = adv.slots.includes(slot.value)
                return <button key={slot.value} type="button" aria-pressed={on} onClick={() => toggleSlot(slot.value)} className={on ? GUEST_CHIP_ON : GUEST_CHIP_OFF}>{slot.label}</button>
              })}
            </div>
          </ChipMenu>

          {QUICK_CHIPS.slice(1).map(chip => (
            <QuickChip key={chip.id} id={chip.id} label={chip.label} on={isQuickChipOn(chip.id, state)} onPress={pressQuick} />
          ))}

          <ChipMenu
            label={priceChipLabel(adv)} icon={<CoinIcon className="size-4" />} active={adv.priceMin !== undefined || adv.priceMax !== undefined}
            open={menu === 'price'} onOpenChange={menuOpen('price')} title="Học phí" footer={footer(() => setAdv({ priceMin: undefined, priceMax: undefined }))}
          >
            <div className={OPTION_CHIPS}>
              {PRICE_PRESETS.map(preset => {
                const on = adv.priceMin === preset.min && adv.priceMax === preset.max
                return (
                  <button key={preset.label} type="button" aria-pressed={on} onClick={() => setAdv({ priceMin: on ? undefined : preset.min, priceMax: on ? undefined : preset.max })} className={on ? GUEST_CHIP_ON : GUEST_CHIP_OFF}>
                    {preset.label}
                  </button>
                )
              })}
            </div>
          </ChipMenu>

          <div className="hidden lg:block">
            <ChipMenu
              label={districtChipLabel(adv.district, options.districts)} icon={<PinIcon className="size-4" />} active={!!adv.district}
              open={menu === 'district'} onOpenChange={menuOpen('district')} title="Khu vực" footer={footer(() => apply({ filters: { ...state.filters, location: FILTER_ALL }, adv: { ...adv, district: undefined } }))}
            >
              <div className={`${OPTION_CHIPS} mb-3`}>
                {PROVINCE_OPTIONS.map(province => {
                  const on = state.filters.location === province.value
                  return (
                    <button key={province.value} type="button" aria-pressed={on} onClick={() => apply({ filters: { ...state.filters, location: province.value }, adv: { ...adv, district: undefined } })} className={on ? GUEST_CHIP_ON : GUEST_CHIP_OFF}>
                      {province.label}
                    </button>
                  )
                })}
              </div>
              {provinceChosen ? (
                <div className="flex max-h-56 flex-wrap gap-2 overflow-y-auto">
                  {options.districts.map(district => {
                    const on = adv.district === district.code
                    return <button key={district.code} type="button" aria-pressed={on} onClick={() => setAdv({ district: on ? undefined : district.code })} className={on ? GUEST_CHIP_ON : GUEST_CHIP_OFF}>{district.name}</button>
                  })}
                </div>
              ) : (
                <p className="m-0 text-[13px] text-muted">Chọn thành phố để xem các quận.</p>
              )}
            </ChipMenu>
          </div>
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
    </div>
  )
}

function QuickChip({ id, label, on, busy, onPress }: { id: QuickChipId; label: string; on: boolean; busy?: boolean; onPress: (id: QuickChipId) => void }) {
  return (
    <button type="button" aria-pressed={on} disabled={busy} onClick={() => onPress(id)} className={`${on ? GUEST_CHIP_ON : GUEST_CHIP_OFF} gap-1.5`}>
      {QUICK_ICONS[id]}
      {label}
      {on && <CloseIcon className="-mr-1 size-3.5" />}
    </button>
  )
}
