'use client'

import { useState } from 'react'
import type { Category, SearchOptions } from '@/lib/api'
import {
  FILTER_ALL, FILTER_GROUPS, PARTNER_TYPE_OPTIONS, PRICE_SLIDER_MAX, PRICE_SLIDER_STEP, START_WITHIN_OPTIONS, TAG_CHIP_LIMIT, TIME_SLOT_OPTIONS,
} from '@/config/searchFilters'
import { activeFilterCount, type AdvancedFilters, type SearchFilters as Filters, type SearchState } from '@/lib/search/query'
import { formatPrice } from '@/lib/format/price'
import { GUEST_CHIP_OFF, GUEST_CHIP_ON } from '@/components/guest/chipStyles'
import { CloseIcon, FilterIcon } from '@/components/icons'

interface PanelProps {
  state: SearchState
  categories: Category[]
  onCategoryChange: (category: string | undefined) => void
  onFilterChange: (filters: Filters) => void
  onAdvancedChange: (adv: AdvancedFilters) => void
  options: SearchOptions
  onClear: () => void
  hideTitle?: boolean
}

const OPTION_BASE = 'min-h-9 w-full cursor-pointer rounded-lg border-0 px-2.5 py-1.5 text-left text-[13px]'

function CategoryList({ state, categories, onCategoryChange }: Pick<PanelProps, 'state' | 'categories' | 'onCategoryChange'>) {
  const [search, setSearch] = useState('')
  const needle = search.toLowerCase()
  const visible = categories.filter(category => !search || category.title.toLowerCase().includes(needle))

  const optionClass = (selected: boolean) =>
    `${OPTION_BASE} ${selected ? 'bg-green-soft font-medium text-green-dark' : 'bg-transparent text-text'}`

  return (
    <div className="border-t border-line py-4 first:border-t-0 first:pt-0">
      <label className={`mb-2 block font-medium ${state.category ? 'text-red' : 'text-ink'}`}>Lĩnh vực</label>
      <input
        type="search"
        placeholder="Tìm lĩnh vực..."
        value={search}
        onChange={event => setSearch(event.target.value)}
        className="mb-2 min-h-10 w-full rounded-[10px] border border-line bg-bg px-2.5 text-[13px] outline-none focus:border-green"
      />
      <div className="flex max-h-[180px] flex-col gap-0.5 overflow-y-auto">
        <button type="button" onClick={() => onCategoryChange(undefined)} className={optionClass(!state.category)}>
          Tất cả lĩnh vực
        </button>
        {visible.map(category => (
          <button key={category.url} type="button" onClick={() => onCategoryChange(category.url)} className={optionClass(state.category === category.url)}>
            {category.title}
          </button>
        ))}
      </div>
    </div>
  )
}

const SECTION = 'border-t border-line py-4'
const SELECT_CLASS = 'min-h-11 w-full rounded-[14px] border border-line bg-bg px-3 text-text outline-none'

function Section({ title, active, children }: { title: string; active: boolean; children: React.ReactNode }) {
  return (
    <div className={SECTION}>
      <div className={`mb-2 font-medium ${active ? 'text-red' : 'text-ink'}`}>{title}</div>
      {children}
    </div>
  )
}

function toggled<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter(item => item !== value) : [...list, value]
}

function AdvancedSections({ state, options, onAdvancedChange }: Pick<PanelProps, 'state' | 'options' | 'onAdvancedChange'>) {
  const { adv } = state
  const set = (patch: Partial<AdvancedFilters>) => onAdvancedChange({ ...adv, ...patch })
  const provinceChosen = state.filters.location !== FILTER_ALL
  const priceMax = adv.priceMax ?? PRICE_SLIDER_MAX

  return (
    <>
      <Section title="Quận / huyện" active={!!adv.district}>
        {provinceChosen ? (
          <select aria-label="Quận / huyện" value={adv.district ?? ''} onChange={event => set({ district: event.target.value || undefined })} className={SELECT_CLASS}>
            <option value="">Tất cả quận / huyện</option>
            {options.districts.map(district => <option key={district.code} value={district.code}>{district.name}</option>)}
          </select>
        ) : (
          <p className="m-0 text-[13px] text-muted">Chọn khu vực ở trên để lọc theo quận / huyện.</p>
        )}
      </Section>

      <Section title="Khung giờ học" active={adv.slots.length > 0}>
        <div className="flex flex-wrap gap-2">
          {TIME_SLOT_OPTIONS.map(slot => {
            const on = adv.slots.includes(slot.value)
            return (
              <button key={slot.value} type="button" aria-pressed={on} onClick={() => set({ slots: toggled(adv.slots, slot.value) })} className={on ? GUEST_CHIP_ON : GUEST_CHIP_OFF}>
                {slot.label}
              </button>
            )
          })}
        </div>
      </Section>

      <Section title="Loại đối tác" active={!!adv.partnerType}>
        <select aria-label="Loại đối tác" value={adv.partnerType ?? ''} onChange={event => set({ partnerType: event.target.value || undefined })} className={SELECT_CLASS}>
          <option value="">Tất cả đối tác</option>
          {PARTNER_TYPE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </Section>

      <Section title="Học phí tối đa" active={adv.priceMax !== undefined}>
        <input
          type="range"
          aria-label="Học phí tối đa"
          min={0}
          max={PRICE_SLIDER_MAX}
          step={PRICE_SLIDER_STEP}
          value={priceMax}
          onChange={event => {
            const value = Number(event.target.value)
            set({ priceMax: value >= PRICE_SLIDER_MAX ? undefined : value, priceMin: undefined })
          }}
          className="w-full accent-green"
        />
        <div className="mt-1 text-[13px] text-muted">
          {adv.priceMax === undefined ? 'Không giới hạn' : `Đến ${formatPrice(adv.priceMax)}`}
        </div>
      </Section>

      <Section title="Khai giảng" active={adv.startWithin !== undefined}>
        <select aria-label="Khai giảng" value={adv.startWithin ?? ''} onChange={event => set({ startWithin: event.target.value ? Number(event.target.value) : undefined })} className={SELECT_CLASS}>
          <option value="">Bất kỳ lúc nào</option>
          {START_WITHIN_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </Section>

      {options.tags.length > 0 && (
        <Section title="Kỹ năng" active={adv.tags.length > 0}>
          <div className="flex flex-wrap gap-2">
            {options.tags.slice(0, TAG_CHIP_LIMIT).map(tag => {
              const on = adv.tags.includes(tag.id)
              return (
                <button key={tag.id} type="button" aria-pressed={on} onClick={() => set({ tags: toggled(adv.tags, tag.id) })} className={on ? GUEST_CHIP_ON : GUEST_CHIP_OFF}>
                  {tag.name}
                </button>
              )
            })}
          </div>
        </Section>
      )}
    </>
  )
}

export function SearchFiltersPanel({ state, categories, onCategoryChange, onFilterChange, onAdvancedChange, options, onClear, hideTitle }: PanelProps) {
  const hasActive = activeFilterCount(state) > 0

  return (
    <>
      {!hideTitle && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="m-0 text-xl font-medium text-ink">Bộ lọc</h2>
          {hasActive && (
            <button type="button" onClick={onClear} className="min-h-11 cursor-pointer border-0 bg-transparent text-[13px] font-medium text-red">
              Xóa tất cả
            </button>
          )}
        </div>
      )}

      <CategoryList state={state} categories={categories} onCategoryChange={onCategoryChange} />

      {FILTER_GROUPS.map(group => {
        const value = state.filters[group.id]
        const active = value !== FILTER_ALL
        return (
          <div key={group.id} className="border-t border-line py-4">
            <label htmlFor={`filter-${group.id}`} className={`mb-2 block font-medium ${active ? 'text-red' : 'text-ink'}`}>{group.label}</label>
            <select
              id={`filter-${group.id}`}
              value={value}
              onChange={event => onFilterChange({ ...state.filters, [group.id]: event.target.value })}
              className={`min-h-11 w-full rounded-[14px] border px-3 outline-none ${active ? 'border-red bg-red-soft font-medium text-red' : 'border-line bg-bg text-text'}`}
            >
              {group.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
        )
      })}

      <AdvancedSections state={state} options={options} onAdvancedChange={onAdvancedChange} />

      <button type="button" onClick={onClear} className="btn btn--outline mt-2 w-full">Xóa bộ lọc</button>
    </>
  )
}

export function MobileFilters({ open, onOpenChange, ...props }: Omit<PanelProps, 'hideTitle'> & { open: boolean; onOpenChange: (open: boolean) => void }) {
  const setOpen = onOpenChange
  const count = activeFilterCount(props.state)

  return (
    <>
      <div className="col-span-full flex items-center justify-between rounded-2xl border border-line bg-white px-4 py-2 shadow-card lg:hidden">
        <span className="flex items-center gap-2 text-sm font-extrabold text-ink">
          Bộ lọc
          {count > 0 && (
            <span className="grid size-5 place-items-center rounded-full bg-red text-[10px] font-extrabold text-white">{count}</span>
          )}
        </span>
        <button type="button" onClick={() => setOpen(true)} className="btn btn--outline min-h-11 gap-2 px-4 py-2 text-[13px]">
          <FilterIcon className="size-4" />
          Lọc
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] flex justify-end lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-ink/40" />
          <div
            role="dialog"
            aria-label="Bộ lọc"
            className="relative flex h-full w-[85vw] max-w-sm flex-col rounded-l-[20px] bg-white shadow-raised"
            onClick={event => event.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-1">
              <span className="text-base font-extrabold text-ink">Bộ lọc</span>
              <button type="button" aria-label="Đóng" onClick={() => setOpen(false)} className="-mr-2 grid size-11 cursor-pointer place-items-center border-0 bg-transparent text-muted hover:text-ink">
                <CloseIcon />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <SearchFiltersPanel
                {...props}
                hideTitle
                onCategoryChange={props.onCategoryChange}
                onFilterChange={props.onFilterChange}
                onAdvancedChange={props.onAdvancedChange}
                onClear={() => { props.onClear(); setOpen(false) }}
              />
            </div>
            <div className="shrink-0 border-t border-line p-3">
              <button type="button" onClick={() => setOpen(false)} className="btn btn--green w-full">Xem kết quả</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
