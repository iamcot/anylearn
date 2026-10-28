import Link from 'next/link'
import { enabledSlots, type SlotKind } from '@/lib/features'
import { daySeedOf, pickRotating } from '@/lib/today/format'
import { BROWSE_HOME_URL } from '@/lib/today/links'

const SLOT_CONTENT: Record<SlotKind, { label: string; title: string; action: string; href: string }> = {
  roadmap: { label: 'Lộ trình', title: 'Lộ trình học của con sẽ hiện ở đây', action: 'Xem lộ trình', href: BROWSE_HOME_URL },
  community: { label: 'Cộng đồng mẹ', title: 'Trao đổi với các mẹ cùng lớp trong nhóm lớp', action: 'Vào nhóm lớp', href: '/community' },
  search: { label: 'Tìm thêm khóa học', title: 'Gợi ý khóa học phù hợp cho con', action: 'Tìm khóa học', href: '/search' },
}

export default function SlotCard({ now, slots = enabledSlots() }: { now: Date; slots?: SlotKind[] }) {
  const kind = pickRotating(slots, daySeedOf(now))
  if (!kind) return null
  const slot = SLOT_CONTENT[kind]

  return (
    <section className="rounded-[20px] border border-green/30 bg-green-soft p-4">
      <span className="text-xs font-bold uppercase tracking-wide text-green-dark">{slot.label}</span>
      <h3 className="mt-1 text-base font-black text-ink">{slot.title}</h3>
      <Link href={slot.href} className="mt-3 inline-flex min-h-11 items-center rounded-full bg-green px-5 text-[15px] font-black text-white hover:bg-green-dark">
        {slot.action}
      </Link>
    </section>
  )
}
