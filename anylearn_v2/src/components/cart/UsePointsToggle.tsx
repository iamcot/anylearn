'use client'

import { useState } from 'react'
import Link from 'next/link'
import Modal from '@/components/Modal'
import { CoinIcon } from '@/components/icons'
import { POINT_VALUE_VND } from '@/config/points'
import { formatExactPrice } from '@/lib/format/price'
import { formatPoints } from '@/lib/points/reward'

interface Props {
  balance: number
  maxPoints: number
  applied: number
  on: boolean
  onToggle: (on: boolean) => void
  onCustomPoints: (points: number | null) => void
}

export function AnyPointInfoModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="anyPoint là gì?" onClose={onClose}>
      <ul className="m-0 flex list-disc flex-col gap-2 pl-5 text-sm text-text">
        <li>Mỗi khóa học bạn mua đều tặng lại anyPoint. Số anyPoint hiện ngay trước khi bạn thanh toán.</li>
        <li>1 anyPoint ~ {formatExactPrice(POINT_VALUE_VND)}. Dùng anyPoint để giảm tiền cho khóa học tiếp theo.</li>
        <li>Giới thiệu bạn bè mua khóa học cũng được thêm anyPoint.</li>
      </ul>
      <Link href="/info/anypoint" className="mt-4 inline-block text-sm font-medium text-green-dark" onClick={onClose}>
        Xem chi tiết cách nhận và dùng anyPoint
      </Link>
    </Modal>
  )
}

function Switch({ on, onChange, label }: { on: boolean; onChange: (on: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-7 w-12 shrink-0 cursor-pointer rounded-full border-0 transition-colors ${on ? 'bg-green' : 'bg-line'}`}
    >
      <span className={`absolute left-0.5 top-0.5 size-6 rounded-full bg-white shadow-card transition-transform ${on ? 'translate-x-5' : ''}`} />
    </button>
  )
}

function CustomPointsInput({ maxPoints, onSubmit }: { maxPoints: number; onSubmit: (points: number | null) => void }) {
  const [value, setValue] = useState('')
  const submit = () => onSubmit(value.trim() === '' ? null : Number(value))
  return (
    <div className="mt-3 flex gap-2">
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={maxPoints}
        value={value}
        placeholder={`Tối đa ${formatPoints(maxPoints)} anyPoint`}
        onChange={event => setValue(event.target.value)}
        onKeyDown={event => { if (event.key === 'Enter') submit() }}
        className="field min-h-11 flex-1 text-sm"
      />
      <button type="button" onClick={submit} className="min-h-11 shrink-0 cursor-pointer rounded-full border border-line bg-white px-5 text-sm font-medium text-ink">
        Áp dụng
      </button>
    </div>
  )
}

export default function UsePointsToggle({ balance, maxPoints, applied, on, onToggle, onCustomPoints }: Props) {
  const [showInfo, setShowInfo] = useState(false)
  const [showCustom, setShowCustom] = useState(false)

  const infoLink = (
    <button type="button" onClick={() => setShowInfo(true)} className="cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-xs font-medium text-green-dark underline">
      anyPoint là gì?
    </button>
  )

  if (balance <= 0 || maxPoints <= 0) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
        <span className="flex items-center gap-1.5">
          <CoinIcon className="size-4 text-green" />
          {balance <= 0 ? 'Bạn chưa có anyPoint. Mua khóa này để nhận anyPoint cho lần sau.' : 'Đơn này không cần dùng anyPoint.'}
        </span>
        {infoLink}
        {showInfo && <AnyPointInfoModal onClose={() => setShowInfo(false)} />}
      </div>
    )
  }

  const shownPoints = on ? applied : maxPoints
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-ink">
            Dùng {formatPoints(shownPoints)} anyPoint, giảm {formatExactPrice(shownPoints * POINT_VALUE_VND)}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted">
            <span>Bạn có {formatPoints(balance)} anyPoint</span>
            {infoLink}
          </div>
        </div>
        <Switch on={on} onChange={onToggle} label="Dùng anyPoint cho đơn này" />
      </div>
      {on && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowCustom(open => !open)}
            className="cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-xs font-medium text-green-dark underline"
          >
            Dùng số anyPoint khác
          </button>
          {showCustom && <CustomPointsInput maxPoints={maxPoints} onSubmit={onCustomPoints} />}
        </div>
      )}
      {showInfo && <AnyPointInfoModal onClose={() => setShowInfo(false)} />}
    </div>
  )
}
