'use client'

import Link from 'next/link'
import { useState } from 'react'
import BrandText from '../BrandText'
import CoinIcon from '../CoinIcon'
import ItemIcon from '../quiz/ItemIcon'
import { BoltIcon } from '@/components/icons'
import type { ItemKey } from '@/lib/api/quiz'
import type { ShopEntry } from '@/lib/api/shop'
import { buyProblem, priceOf } from '@/lib/shop/rules'

const LEVELS = [1, 2, 3, 4, 5]

function EntryIcon({ entry }: { entry: ShopEntry }) {
  if (entry.kind === 'item') return <ItemIcon item={entry.key as ItemKey} className="size-8" />
  if (entry.kind === 'energy') return <BoltIcon className="size-8 shrink-0 fill-current text-green" aria-hidden />
  const common = { viewBox: '0 0 32 32', className: 'size-8 shrink-0', 'aria-hidden': true } as const
  if (entry.kind === 'pack') {
    return (
      <svg {...common}>
        <path d="M6 5h17a3 3 0 0 1 3 3v19H9a3 3 0 0 1-3-3z" fill="#38bdf8" stroke="#0369a1" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M10 5v22" stroke="#0369a1" strokeWidth="1.6" />
        <path d="M14 11h8M14 16h8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }
  const rare = entry.key === 'chest_rare'
  return (
    <svg {...common}>
      <rect x="4" y="12" width="24" height="15" rx="2.500" fill={rare ? '#a78bfa' : '#fbbf24'} stroke={rare ? '#6d28d9' : '#b45309'} strokeWidth="1.600" />
      <path d="M4 17h24" stroke={rare ? '#6d28d9' : '#b45309'} strokeWidth="1.600" />
      <path d="M5 12a11 6 0 0 1 22 0z" fill={rare ? '#c4b5fd' : '#fde68a'} stroke={rare ? '#6d28d9' : '#b45309'} strokeWidth="1.600" strokeLinejoin="round" />
      <rect x="14" y="15" width="4" height="5" rx="1" fill="#fff" stroke={rare ? '#6d28d9' : '#b45309'} strokeWidth="1.200" />
    </svg>
  )
}

/**
 * One thing of the Leo Xu shop with a small confirm line, shared by the shop page and the shop inside Leo rank.
 * `onBuy` does the call and returns the error text (null = bought); a pack that depends on the level asks for the level first.
 */
export default function ShopEntryCard({ entry, coins, coinName, levelLabels, showGame, showLink, onBuy }: {
  entry: ShopEntry
  coins: number
  coinName: string
  levelLabels: Record<string, string>
  showGame: boolean
  showLink: boolean
  onBuy: (entry: ShopEntry, difficulty: number | null) => Promise<string | null>
}) {
  const [open, setOpen] = useState(false)
  const [difficulty, setDifficulty] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const price = priceOf(entry, difficulty)
  const problem = buyProblem(entry, coins, difficulty)
  const hardStop = problem !== null && problem !== 'Chọn cấp độ' && problem !== 'Chưa đủ xu'

  const confirm = async () => {
    setBusy(true)
    setError('')
    const err = await onBuy(entry, difficulty)
    setBusy(false)
    if (err) return setError(err)
    setOpen(false)
  }

  return (
    <li className="list-none rounded-xl border border-line bg-white p-2">
      <div className="flex items-center gap-3">
        <EntryIcon entry={entry} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold">
            {entry.label}
            {entry.kind === 'item' && <span className="font-normal text-muted"> (có {entry.qty ?? 0})</span>}
            {showGame && <span className="ml-1.5 rounded-full bg-green-soft px-2 py-0.5 align-middle text-[11px] font-bold text-green-dark">{entry.gameLabel}</span>}
          </div>
          <div className="text-xs text-muted">{entry.description}</div>
          {entry.left !== null && entry.dailyCap !== null && <div className="text-xs text-muted">Còn {entry.left}/{entry.dailyCap} lượt hôm nay</div>}
          {showLink && <Link href={entry.link} className="text-xs font-bold text-green-dark no-underline">{entry.linkLabel}</Link>}
        </div>
        <button type="button" disabled={hardStop || busy} onClick={() => setOpen(!open)} aria-expanded={open}
          className="inline-flex min-h-10 cursor-pointer items-center gap-1 rounded-full border border-line bg-white px-3 text-sm font-black text-[#b45309] disabled:cursor-not-allowed disabled:opacity-45">
          <CoinIcon className="size-4" /> {entry.price === null && price !== null ? `từ ${price}` : price}
        </button>
      </div>
      {hardStop && <p className="m-0 mt-1 text-xs font-bold text-warn-text">{problem}</p>}
      {open && (
        <div className="mt-2 grid gap-2 rounded-lg bg-green-soft p-2 text-sm">
          {entry.needsDifficulty && (
            <div>
              <div className="mb-1 font-bold">Chọn cấp độ</div>
              <div className="grid grid-cols-5 gap-1.5">
                {LEVELS.map(level => (
                  <button key={level} type="button" onClick={() => setDifficulty(level)} aria-pressed={difficulty === level}
                    className={`flex min-h-12 cursor-pointer flex-col items-center justify-center rounded-xl border-2 px-0.5 text-[11px] font-bold leading-tight ${difficulty === level ? 'border-green bg-white text-green-dark' : 'border-line bg-white text-ink'}`}>
                    <span>{levelLabels[String(level)] ?? level}</span>
                    <span className="inline-flex items-center gap-0.5 text-[#b45309]"><CoinIcon className="size-3" />{entry.levelPrices?.[level - 1]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <span>Mua <b>{entry.label}</b>{price !== null && <> với {price} <BrandText text={coinName} coinName={coinName} /></>}?</span>
            <span className="flex shrink-0 gap-2">
              <button type="button" onClick={() => setOpen(false)} className="min-h-9 cursor-pointer rounded-full border border-line bg-white px-3 font-bold">Thôi</button>
              <button type="button" disabled={busy || problem !== null} onClick={confirm} className="min-h-9 cursor-pointer rounded-full border-0 bg-green px-3 font-black text-white disabled:opacity-50">Mua</button>
            </span>
          </div>
          {problem && !hardStop && <p className="m-0 text-xs font-bold text-warn-text">{problem === 'Chọn cấp độ' ? 'Chọn cấp độ trước khi mua' : `Bạn chưa đủ ${coinName}`}</p>}
          {error && <p className="m-0 text-xs font-bold text-warn-text" role="alert">{error}</p>}
        </div>
      )}
    </li>
  )
}
