import { pageItems } from '@/lib/search/pagination'
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons'

interface Props {
  currentPage: number
  totalPages: number
  onChange: (page: number) => void
}

const NAV_CLASS = 'grid size-11 cursor-pointer place-items-center rounded-full border border-line bg-white text-ink disabled:cursor-default disabled:opacity-40'

export default function Pagination({ currentPage, totalPages, onChange }: Props) {
  return (
    <nav aria-label="Phân trang" className="mt-6 flex flex-wrap items-center justify-center gap-2">
      <button type="button" aria-label="Trang trước" disabled={currentPage === 0} onClick={() => onChange(currentPage - 1)} className={NAV_CLASS}>
        <ChevronLeftIcon />
      </button>
      {pageItems(currentPage, totalPages).map((item, index) =>
        item === 'gap' ? (
          <span key={`gap-${index}`} className="px-1 text-muted">…</span>
        ) : (
          <button
            key={item}
            type="button"
            aria-current={currentPage === item ? 'page' : undefined}
            onClick={() => onChange(item)}
            className={`h-11 min-w-11 cursor-pointer rounded-full border text-sm font-medium ${
              currentPage === item ? 'border-green bg-green-soft text-green-dark' : 'border-line bg-white text-text'
            }`}
          >
            {item + 1}
          </button>
        ),
      )}
      <button type="button" aria-label="Trang sau" disabled={currentPage >= totalPages - 1} onClick={() => onChange(currentPage + 1)} className={NAV_CLASS}>
        <ChevronRightIcon />
      </button>
    </nav>
  )
}
