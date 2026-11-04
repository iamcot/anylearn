'use client'

import { useEffect, useState } from 'react'
import { Leo, type LeoView } from '@/components/fun/Leo'
import { barPercent, housesBadge, houseTitle } from '@/lib/foundation/rules'
import { HouseIcon } from './icons'

// anyLEARN Foundation progress (plan 21, owner's sketch): a bar towards the house being built, with Leo walking on it
// up to where the money has reached, the house at the end and "X{count}" for the houses already built. No figures.
// Leo walks in from the start once per mount and the house colours in from the bottom (reduced motion: no walk).
export default function FoundationBar({ percent, housesBuilt, currentHouse, size = 'md' }: {
  percent: number
  housesBuilt: number
  currentHouse?: number
  size?: 'sm' | 'md' | 'lg'
}) {
  const target = barPercent(percent)
  const [pos, setPos] = useState(0)
  const [walking, setWalking] = useState(false)
  const walkMs = Math.round(500 + target * 18)

  useEffect(() => {
    let t = 0
    const raf = window.requestAnimationFrame(() => {
      setWalking(true)
      setPos(target)
      t = window.setTimeout(() => setWalking(false), walkMs)
    })
    return () => { window.cancelAnimationFrame(raf); window.clearTimeout(t) }
  }, [target, walkMs])

  const leo = size === 'lg' ? 'w-14' : size === 'sm' ? 'w-8' : 'w-10'
  const house = size === 'lg' ? 'size-14' : size === 'sm' ? 'size-8' : 'size-10'
  const bar = size === 'lg' ? 'h-3.5' : 'h-2.5'
  const pad = size === 'lg' ? 'pt-16' : size === 'sm' ? 'pt-9' : 'pt-11'
  const badge = housesBadge(housesBuilt)
  const view: LeoView = walking ? 'right' : 'front'

  return (
    <div className="flex w-full min-w-0 items-end gap-2" role="img"
      aria-label={`${currentHouse ? houseTitle(currentHouse) : 'Căn đang xây'}: đã góp được ${percent}%${housesBuilt > 0 ? `, đã xây xong ${housesBuilt} căn` : ''}`}>
      <div className={`relative min-w-0 flex-1 ${pad}`}>
        <div className={`${bar} overflow-hidden rounded-full bg-[#f1e4d8]`}>
          <div className="h-full rounded-full bg-gradient-to-r from-[#e9a06f] to-[#c8643b] transition-[width] ease-in-out motion-reduce:transition-none" style={{ width: `${pos}%`, transitionDuration: `${walkMs}ms` }} />
        </div>
        <div className="absolute bottom-0 -translate-x-1/2 transition-[left] ease-in-out motion-reduce:transition-none" style={{ left: `${pos}%`, transitionDuration: `${walkMs}ms` }}>
          <div className={`${leo} -mb-0.5`}><Leo view={view} moving={walking} waving={!walking && pos > 0} className="w-full" /></div>
          <div className={bar} />
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-center">
        {/* the house colours in from the bottom as the money comes in */}
        <span className={`relative ${house}`}>
          <HouseIcon className="absolute inset-0 size-full" muted />
          <span className="absolute inset-0 transition-[clip-path] ease-in-out motion-reduce:transition-none"
            style={{ clipPath: `inset(${100 - pos}% 0 0 0)`, transitionDuration: `${walkMs}ms` }}>
            <HouseIcon className="size-full" />
          </span>
        </span>
        {badge && (
          <span className="mt-0.5 flex items-center gap-0.5 text-xs font-extrabold text-ink">
            <HouseIcon className="size-3.5" />{badge}
          </span>
        )}
      </div>
    </div>
  )
}
