'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clearCompare, removeCompare, useCompareList } from '@/lib/compare/store'
import { MAX_COMPARE } from '@/lib/compare/selection'
import { ArrowRightIcon, CloseIcon } from '@/components/icons'

// The bar stays on every page (the compare page too) until the parent closes the comparison; only the money and sign-in flows hide it.
const HIDDEN_PREFIXES = ['/today', '/checkout', '/login', '/register', '/join', '/order']

/** The strip above the bottom tabs once a course is picked: the picks (green, like other selections), the way to the table, and "Đóng so sánh". */
export default function CompareBar() {
  const list = useCompareList()
  const pathname = usePathname()
  if (list.length === 0 || HIDDEN_PREFIXES.some(prefix => pathname.startsWith(prefix))) return null
  const href = `/compare?ids=${list.map(entry => entry.id).join(',')}`
  const onComparePage = pathname.startsWith('/compare')

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white px-4 py-2.5 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
      style={{ bottom: 'var(--app-tabs-h, 0px)' }}>
      <div className="mx-auto flex max-w-[1100px] items-center gap-3">
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
          {list.map(entry => (
            <span key={entry.id} className="inline-flex max-w-[220px] shrink-0 items-center gap-1 rounded-full border border-green bg-green-soft p-0.5 sm:gap-2 text-xs font-bold text-green-dark">
              {entry.image
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={entry.image} alt="" className="size-9 shrink-0 rounded-full bg-white object-cover" />
                : <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-sm font-black text-green-dark">{entry.title.trim().charAt(0).toUpperCase()}</span>}
              <span className="hidden truncate pr-1 sm:inline">{entry.title}</span>
              <button type="button" onClick={() => removeCompare(entry.id)} aria-label={`Bỏ ${entry.title}`}
                className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-green-dark hover:bg-white hover:text-red">
                <CloseIcon className="size-5" />
              </button>
            </span>
          ))}
        </div>
        {list.length < MAX_COMPARE && (
          <Link href="/search" aria-label="Thêm khóa học để so sánh" title="Thêm khóa học để so sánh"
            className="grid size-9 shrink-0 place-items-center rounded-full border border-dashed border-green bg-white text-xl font-black leading-none text-green-dark no-underline hover:bg-green-soft">+</Link>
        )}
        <span className="hidden text-xs text-muted sm:inline">{list.length}/{MAX_COMPARE} khóa</span>
        {!onComparePage && (
          <Link href={href} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-green px-5 text-sm font-black text-white no-underline hover:bg-green-dark">
            So sánh ({list.length}) <ArrowRightIcon className="size-4" />
          </Link>
        )}
        <button type="button" onClick={clearCompare} aria-label="Đóng so sánh" title="Đóng so sánh"
          className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full border border-line bg-white text-muted hover:border-red hover:text-red">
          <CloseIcon className="size-5" />
        </button>
      </div>
    </div>
  )
}
