'use client'

import { useState } from 'react'
import type { SearchMode } from '@/lib/search/query'
import { ClockIcon } from '@/components/icons'

const HERO_TITLES: Record<SearchMode, string> = {
  class: 'Tìm khóa học phù hợp cho con',
  school: 'Tìm trường học chất lượng',
  teacher: 'Tìm chuyên gia giảng dạy',
}

const HISTORY_SHOWN = 5

interface Props {
  mode: SearchMode
  initialQuery: string
  history: string[]
  onSubmit: (query: string) => void
  onPickHistory: (term: string) => void
  onClearHistory: () => void
}

// Remount with a new `key` when the committed query or mode changes, so the draft follows the URL.
export default function SearchForm({ mode, initialQuery, history, onSubmit, onPickHistory, onClearHistory }: Props) {
  const [query, setQuery] = useState(initialQuery)

  return (
    <section className="border-b border-line bg-gradient-to-br from-blue to-green py-6 text-white lg:py-8">
      <div className="container">
        <h1 className="m-0 mb-2 text-[clamp(20px,2.4vw,30px)] font-medium leading-[1.12] tracking-[-0.5px]">{HERO_TITLES[mode]}</h1>
        <p className="mb-4 mt-0 max-w-[760px] text-[15px] text-white/90">
          Nhập nhu cầu học tập, chọn bộ lọc theo độ tuổi, khu vực, hình thức học và nhận gợi ý phù hợp
        </p>

        <form
          onSubmit={event => { event.preventDefault(); onSubmit(query.trim()) }}
          className="rounded-[30px] border border-line bg-white p-3 text-ink shadow-card sm:p-[18px]"
        >
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              type="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Ví dụ: bóng đá U12, tiếng Anh, piano, trường quốc tế..."
              className="min-h-[58px] w-full rounded-full border border-blue-line bg-bg px-6 text-[17px] text-ink outline-none focus:border-green focus:bg-white"
            />
            <button type="submit" className="btn btn--green min-h-[58px] px-8 text-base">Tìm kiếm</button>
          </div>

          {history.length > 0 && (
            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              <span className="whitespace-nowrap text-xs font-medium text-muted">Đã tìm:</span>
              {history.slice(0, HISTORY_SHOWN).map(term => (
                <button
                  key={term}
                  type="button"
                  onClick={() => onPickHistory(term)}
                  className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border border-line bg-white px-3 text-[13px] font-medium text-ink hover:bg-green-soft"
                >
                  <ClockIcon className="size-3.5" />
                  {term}
                </button>
              ))}
              <button
                type="button"
                onClick={onClearHistory}
                className="min-h-9 cursor-pointer border-0 bg-transparent px-1 text-xs text-muted hover:text-ink"
              >
                Xóa
              </button>
            </div>
          )}
        </form>
      </div>
    </section>
  )
}
