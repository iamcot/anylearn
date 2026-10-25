'use client'

import { useState } from 'react'
import type { Category } from '@/lib/api'
import { FILTER_ALL, FILTER_GROUPS } from '@/config/searchFilters'
import { activeFilterCount, type SearchFilters as Filters, type SearchState } from '@/lib/search/query'
import { CloseIcon, FilterIcon } from '@/components/icons'

interface PanelProps {
  state: SearchState
  categories: Category[]
  onCategoryChange: (category: string | undefined) => void
  onFilterChange: (filters: Filters) => void
  onClear: () => void
  hideTitle?: boolean
}

const OPTION_BASE = 'min-h-9 w-full cursor-pointer rounded-lg border-0 px-2.5 py-1.5 text-left text-[13px]'

function CategoryList({ state, categories, onCategoryChange }: Pick<PanelProps, 'state' | 'categories' | 'onCategoryChange'>) {
  const [search, setSearch] = useState('')
  const needle = search.toLowerCase()
  const visible = categories.filter(category => !search || category.title.toLowerCase().includes(needle))

  const optionClass = (selected: boolean) =>
    `${OPTION_BASE} ${selected ? 'bg-blue-soft font-medium text-blue' : 'bg-transparent text-text'}`

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

export function SearchFiltersPanel({ state, categories, onCategoryChange, onFilterChange, onClear, hideTitle }: PanelProps) {
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

      <button type="button" onClick={onClear} className="btn btn--outline mt-2 w-full">Xóa bộ lọc</button>
    </>
  )
}

export function MobileFilters(props: Omit<PanelProps, 'hideTitle'>) {
  const [open, setOpen] = useState(false)
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
                onCategoryChange={category => { props.onCategoryChange(category); setOpen(false) }}
                onFilterChange={filters => { props.onFilterChange(filters); setOpen(false) }}
                onClear={() => { props.onClear(); setOpen(false) }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
