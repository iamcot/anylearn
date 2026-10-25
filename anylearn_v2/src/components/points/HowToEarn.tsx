import { HOW_TO_EARN, HOW_TO_USE, type AnyPointWay } from '@/config/points'

function WayList({ title, ways }: { title: string; ways: AnyPointWay[] }) {
  return (
    <div>
      <h3 className="m-0 mb-2 text-sm font-extrabold text-ink">{title}</h3>
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {ways.map(way => (
          <li key={way.title} className="rounded-xl border border-line bg-white px-4 py-3">
            <div className="text-sm font-medium text-ink">{way.title}</div>
            <div className="mt-0.5 text-sm text-muted">{way.detail}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function HowToEarn() {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <WayList title="Cách nhận điểm" ways={HOW_TO_EARN} />
      <WayList title="Cách dùng điểm" ways={HOW_TO_USE} />
    </div>
  )
}
