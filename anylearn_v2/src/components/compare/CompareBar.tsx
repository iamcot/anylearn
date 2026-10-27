'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clearCompare, removeCompare, useCompareList } from '@/lib/compare/store'
import { MAX_COMPARE } from '@/lib/compare/selection'

const HIDDEN_PREFIXES = ['/compare', '/today', '/checkout', '/login', '/register', '/join', '/order']

/** The strip above the bottom tabs once a course is picked: the picks, and the button to the table (from two courses). */
export default function CompareBar() {
  const list = useCompareList()
  const pathname = usePathname()
  if (list.length === 0 || HIDDEN_PREFIXES.some(prefix => pathname.startsWith(prefix))) return null
  const href = `/compare?ids=${list.map(entry => entry.id).join(',')}`

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white px-4 py-2.5 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
      style={{ bottom: 'var(--app-tabs-h, 0px)' }}>
      <div className="mx-auto flex max-w-[1100px] items-center gap-3">
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
          {list.map(entry => (
            <span key={entry.id} className="inline-flex max-w-[180px] shrink-0 items-center gap-1 rounded-full bg-slate-100 py-1 pl-3 pr-1 text-xs font-bold text-ink">
              <span className="truncate">{entry.title}</span>
              <button type="button" onClick={() => removeCompare(entry.id)} aria-label={`Bỏ ${entry.title}`}
                className="grid size-6 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-muted hover:text-red">×</button>
            </span>
          ))}
        </div>
        <span className="hidden text-xs text-muted sm:inline">{list.length}/{MAX_COMPARE} khóa</span>
        <button type="button" onClick={clearCompare} className="cursor-pointer border-0 bg-transparent text-xs font-bold text-muted hover:text-red">Xóa hết</button>
        {list.length >= 2 ? (
          <Link href={href} className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-green px-5 text-sm font-black text-white no-underline hover:bg-green-dark">
            So sánh ({list.length})
          </Link>
        ) : (
          <span className="shrink-0 text-xs text-muted">Chọn thêm 1 khóa</span>
        )}
      </div>
    </div>
  )
}
