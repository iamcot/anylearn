import Link from 'next/link'
import type { LearnerView } from '@/lib/today/types'

interface Props {
  learners: LearnerView[]
  selectedId: number
  onSelect: (id: number) => void
}

export default function LearnerChips({ learners, selectedId, onSelect }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Chọn người học">
      {learners.map(learner => {
        const selected = learner.id === selectedId
        return (
          <button
            key={learner.id} type="button" role="tab" aria-selected={selected} onClick={() => onSelect(learner.id)}
            className={`min-h-11 rounded-full px-5 text-sm font-bold ${selected ? 'border-green bg-green-soft text-green-dark border' : 'border border-line bg-white text-ink hover:bg-bg'}`}
          >
            {learner.self ? 'Bạn' : learner.name}
          </button>
        )
      })}
      <Link
        href="/account/children" aria-label="Thêm bé"
        className="flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-muted text-lg font-bold text-ink"
      >
        +
      </Link>
    </div>
  )
}
