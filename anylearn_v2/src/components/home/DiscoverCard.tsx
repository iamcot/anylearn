import Link from 'next/link'
import { BoltIcon, CalendarIcon, PinIcon } from '@/components/icons'

interface Props {
  childName?: string
  near: boolean
}

// Invitation to /discover: says what the list is, so a parent knows why to open it.
export default function DiscoverCard({ childName, near }: Props) {
  const who = childName ?? 'con'
  const points = [
    { icon: <BoltIcon className="size-5" />, text: `Chọn theo tuổi của ${childName ?? 'bé'}, từ các khóa được nhiều phụ huynh quan tâm` },
    near ? { icon: <PinIcon className="size-5" />, text: 'Ưu tiên khóa gần nhà bạn' } : { icon: <PinIcon className="size-5" />, text: 'Lưu địa chỉ nhà trong tài khoản để thấy khóa gần bạn hơn' },
    { icon: <CalendarIcon className="size-5" />, text: 'Mỗi ngày một danh sách mới, mở lại trong ngày vẫn thấy đúng danh sách đó' },
  ]
  return (
    <section className="pt-6 lg:pt-8">
      <div className="container">
        <div className="flex flex-col gap-5 rounded-card border border-green-line bg-gradient-to-br from-green-soft to-white p-5 shadow-card lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:p-8">
          <div className="min-w-0 lg:max-w-xl">
            <span className="mb-2 inline-flex rounded-full bg-green px-3 py-1 text-xs font-medium text-white">Gợi ý mỗi ngày</span>
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
          <Link href="/discover" className="btn btn--green shrink-0 justify-center">Khám phá hôm nay</Link>
        </div>
      </div>
    </section>
  )
}
