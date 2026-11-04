'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Leo } from '@/components/fun/Leo'
import { guideFor, shouldAutoOpen } from '@/lib/fun/leo'
import { guideOff, journeyStore, readGuideOff } from '@/lib/journey/store'
import { CloseIcon } from '@/components/icons'

const SEEN_KEY = 'leo-guide:seen'
const subscribeNever = () => () => {}

// Leo steps aside while any popup or sheet is open, so he never sits on top of (or under) its buttons.
const DIALOG_SELECTOR = '[role="dialog"], [role="alertdialog"], [aria-modal="true"], dialog[open]'
function subscribeDialogs(cb: () => void) {
  const observer = new MutationObserver(cb)
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['role', 'aria-modal', 'open'] })
  return () => observer.disconnect()
}
const dialogOpen = () => document.querySelector(DIALOG_SELECTOR) != null

function readSeen(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '{}') } catch { return {} }
}

function writeSeen(seen: Record<string, string>) {
  try { localStorage.setItem(SEEN_KEY, JSON.stringify(seen)) } catch { /* private mode */ }
}

function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

// Small Leo in the bottom corner, above the tabs and the compare bar. A tap opens his bubble; he opens it by himself
// at most once per page a day and only when he has something real to say (lines in lib/fun/leo.ts `guideFor`).
// Hidden on pages with buy / pay buttons and in games, and when the person switched him off (Tài khoản > Thông báo).
export default function LeoGuide() {
  const { token } = useAuth()
  const pathname = usePathname() || '/'
  const journey = useSyncExternalStore(journeyStore.subscribe, journeyStore.get, () => null)
  const storedOff = useSyncExternalStore(subscribeNever, readGuideOff, () => true)
  const off = useSyncExternalStore(guideOff.subscribe, guideOff.get, () => false) || storedOff
  const covered = useSyncExternalStore(subscribeDialogs, dialogOpen, () => false)
  const [openFor, setOpenFor] = useState<string | null>(null)
  const [line, setLine] = useState(0)

  const guide = useMemo(() => guideFor(pathname, {
    signedIn: !!token,
    ready: journey?.ready,
    next: journey?.next ?? null,
    coinName: journey?.coinName,
  }), [pathname, token, journey])

  useEffect(() => {
    if (off || !guide) return
    const seen = readSeen()
    if (!shouldAutoOpen(guide, seen, today())) return
    const t = window.setTimeout(() => {
      setOpenFor(pathname)
      setLine(0)
      writeSeen({ ...seen, [guide.pageKey]: today() })
    }, 1200)
    return () => window.clearTimeout(t)
  }, [guide, off, pathname])

  if (off || !guide || covered) return null
  const open = openFor === pathname
  const text = guide.lines[line % guide.lines.length]

  return (
    <div className="pointer-events-none fixed right-3 z-30 bottom-[calc(var(--app-tabs-h,0px)+var(--compare-bar-h,0px)+0.75rem)] lg:bottom-6 lg:right-6">
      <div className="pointer-events-auto relative">
        {open && (
          <div className="absolute bottom-full right-0 mb-1 w-[230px]">
            <div className="leo-pop rounded-2xl bg-white p-3 text-left text-[13px] font-semibold leading-snug text-ink shadow-[0_4px_18px_rgba(0,0,0,.18)]">
              <button type="button" onClick={() => setOpenFor(null)} aria-label="Đóng" className="float-right -mr-1 -mt-1 grid size-6 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-muted">
                <CloseIcon className="size-3.5" />
              </button>
              <span>{text}</span>
              <div className="mt-2 flex items-center gap-2">
                {guide.action && (
                  <Link href={guide.action.href} onClick={() => setOpenFor(null)} className="btn btn--green px-3 py-1.5 text-xs no-underline">{guide.action.label}</Link>
                )}
                {guide.lines.length > 1 && (
                  <button type="button" onClick={() => setLine(l => l + 1)} className="cursor-pointer border-0 bg-transparent p-0 text-xs font-bold text-blue">Tiếp ›</button>
                )}
              </div>
            </div>
          </div>
        )}
        <button type="button" onClick={() => { setOpenFor(open ? null : pathname); setLine(0) }} aria-label="Leo hướng dẫn"
          className="relative block size-14 cursor-pointer rounded-full border-0 bg-white/0 p-0">
          <Leo waving={open} className="size-14" />
          {!open && (journey?.ready ?? 0) > 0 && (
            <span className="absolute -right-0.5 top-0 grid size-5 place-items-center rounded-full bg-red text-[11px] font-extrabold text-white">{journey?.ready}</span>
          )}
        </button>
      </div>
    </div>
  )
}
