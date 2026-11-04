'use client'

import Link from 'next/link'
import { useSyncExternalStore } from 'react'
import { journeyStore } from '@/lib/journey/store'
import { chapterPercent, chaptersDone, currentChapter } from '@/lib/journey/rules'
import { ChevronRightIcon } from '@/components/icons'
import { Leo } from '@/components/fun/Leo'
import BrandText from '@/components/fun/BrandText'

// "Hành trình HỌC không giới hạn!" on /today and /account: the chapter in progress, its bar and the next mission.
// Reads the journey the host keeps in the store, so it costs no extra call.
export default function JourneyCard() {
  const journey = useSyncExternalStore(journeyStore.subscribe, journeyStore.get, () => null)
  if (!journey || !journey.enabled) return null
  const chapter = currentChapter(journey)
  if (!chapter) return null
  const done = chaptersDone(journey)
  const allDone = done === journey.chapters.length
  const pct = chapterPercent(chapter)
  return (
    <Link href="/account/journey" className="block rounded-card border border-line bg-gradient-to-br from-green-soft to-white p-4 text-ink no-underline">
      <div className="flex items-center gap-3">
        <Leo className="size-12 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-extrabold">Hành trình HỌC không giới hạn!</span>
            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-muted">{done}/{journey.chapters.length} chương</span>
            {journey.ready > 0 && <span className="rounded-full bg-red px-2 py-0.5 text-[11px] font-extrabold text-white">{journey.ready} quà</span>}
          </div>
          {allDone ? (
            <p className="m-0 mt-1 text-sm text-muted">Bạn đã đi hết hành trình. Cảm ơn bạn!</p>
          ) : (
            <>
              <p className="m-0 mt-1 text-xs text-muted">Chương {chapter.no}: {chapter.title} · Quà: {chapter.gift}</p>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white" aria-label={`Đã xong ${pct}%`}>
                <div className="h-full rounded-full bg-green" style={{ width: `${pct}%` }} />
              </div>
              {journey.next && (
                <p className="m-0 mt-2 text-sm font-bold">
                  Tiếp theo: {journey.next.label}
                  {journey.next.coins > 0 && <span className="font-semibold text-green"> · <BrandText text={`+${journey.next.coins} ${journey.coinName}`} /></span>}
                </p>
              )}
            </>
          )}
        </div>
        <ChevronRightIcon className="size-4 shrink-0 text-muted" />
      </div>
    </Link>
  )
}
