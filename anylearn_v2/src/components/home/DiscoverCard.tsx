'use client'

import Link from 'next/link'
import { useAiSuggestFlow, type AiLearner } from '@/components/aisuggest/useAiSuggestFlow'
import { BoltIcon, CalendarIcon, PinIcon } from '@/components/icons'
import { useAuth } from '@/context/AuthContext'

interface Props {
  childName?: string
  // Chip of the chosen learner ('self' or 'c{childId}'); an account's AI suggestions are made for this learner.
  chipKey?: string
  near: boolean
}

function aiLearnerOf(chipKey: string | undefined, name: string | undefined, userId: number | undefined): AiLearner | undefined {
  if (chipKey === 'self' && userId) return { id: userId, name: 'Bạn', self: true }
  const childId = chipKey?.startsWith('c') ? Number(chipKey.slice(1)) : NaN
  return Number.isInteger(childId) && childId > 0 ? { id: childId, name: name ?? 'Bé', self: false } : undefined
}

// Invitation to /discover: says what the list is, so a parent knows why to open it.
export default function DiscoverCard({ childName, chipKey, near }: Props) {
  const { user } = useAuth()
  const who = childName ?? 'con'
  const { enabled: ai, busy, start, modal } = useAiSuggestFlow(aiLearnerOf(chipKey, childName, user?.id))
  const points: { icon: React.ReactNode; text: string }[] = [
    { icon: <BoltIcon className="size-5" />, text: `Chọn theo tuổi của ${childName ?? 'bé'}, từ các khóa được nhiều phụ huynh quan tâm` },
    near ? { icon: <PinIcon className="size-5" />, text: 'Ưu tiên khóa gần nhà bạn' } : { icon: <PinIcon className="size-5" />, text: 'Lưu địa chỉ nhà trong tài khoản để thấy khóa gần bạn hơn' },
    { icon: <CalendarIcon className="size-5" />, text: 'Mỗi ngày một danh sách mới, mở lại trong ngày vẫn thấy đúng danh sách đó' },
  ]
  if (ai) {
    points.push({ icon: <span aria-hidden className="text-base leading-none">✨</span>, text: `Gợi ý từ AI: danh sách hôm nay do AI chọn riêng cho ${childName ?? 'bé'}` })
  }
  return (
    <section className="pt-6 lg:pt-8">
      <div className="container">
        <div className="flex flex-col gap-5 rounded-card border border-green-line bg-gradient-to-br from-green-soft to-white p-5 shadow-card lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:p-8">
          <div className="min-w-0 lg:max-w-xl">
            <span className="mb-1 block text-xs font-medium uppercase tracking-[0.06em] text-green-dark">Gợi ý mỗi ngày</span>
            <h2 className="m-0 mb-2 text-xl font-extrabold text-ink lg:text-2xl">Thử điều mới cho {who}</h2>
            <p className="m-0 text-muted">Chưa biết cho {who} học gì tiếp? Mở danh sách hôm nay để khám phá những môn mới, hợp tuổi và dễ đi học.</p>
          </div>
          <ul className="m-0 grid list-none gap-3 p-0 lg:max-w-md">
            {points.map(point => (
              <li key={point.text} className="flex items-start gap-3 text-sm text-text">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-green shadow-card">{point.icon}</span>
                <span className="pt-1">{point.text}</span>
              </li>
            ))}
          </ul>
          {ai
            ? <button type="button" onClick={start} disabled={busy} className="btn btn--green shrink-0 justify-center disabled:opacity-60">{busy ? 'Đang mở...' : 'Khám phá hôm nay'}</button>
            : <Link href="/discover" className="btn btn--green shrink-0 justify-center">Khám phá hôm nay</Link>}
          {modal}
        </div>
      </div>
    </section>
  )
}
