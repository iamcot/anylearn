'use client'

import { useEffect, useState } from 'react'
import Modal from '@/components/Modal'
import { getChildInterests, saveChildInterests } from '@/lib/api'
import { BUDGET_OPTIONS, INTEREST_OPTIONS, type InterestOption } from '@/config/interests'
import { toggleBudget, toggleChoice } from '@/lib/interests/choices'

interface Props {
  childId: number
  childName: string
  token: string
  onClose: () => void
  onSaved: () => void
}

function Chips({ options, isOn, onToggle }: { options: InterestOption[]; isOn: (key: string) => boolean; onToggle: (key: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(option => (
        <button
          key={option.key}
          type="button"
          aria-pressed={isOn(option.key)}
          onClick={() => onToggle(option.key)}
          className={`min-h-11 cursor-pointer rounded-full border px-3.5 text-sm ${isOn(option.key) ? 'border-green bg-green-soft font-bold text-green-dark' : 'border-line bg-white text-text'}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

// Three optional questions about a child; the answers help us suggest courses. Every question can be skipped.
export default function ChildInterestsModal({ childId, childName, token, onClose, onSaved }: Props) {
  const [likes, setLikes] = useState<string[]>([])
  const [wants, setWants] = useState<string[]>([])
  const [budget, setBudget] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getChildInterests(childId, token).then(answers => {
      if (answers) { setLikes(answers.likes); setWants(answers.wants); setBudget(answers.budget) }
      setLoaded(true)
    })
  }, [childId, token])

  const save = async () => {
    setSaving(true)
    setError('')
    const { error: problem } = await saveChildInterests(childId, { likes, wants, budget }, token)
    setSaving(false)
    if (problem) { setError(problem); return }
    onSaved()
  }

  return (
    <Modal title={`Sở thích của ${childName}`} onClose={onClose} maxWidth="max-w-[460px]">
      <p className="m-0 mb-4 text-xs text-muted">Không bắt buộc. Chọn để anyLEARN gợi ý khóa học hợp với bé hơn, có thể sửa sau.</p>
      {!loaded ? (
        <p className="py-6 text-center text-sm text-muted">Đang tải...</p>
      ) : (
        <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto">
          <section>
            <h4 className="m-0 mb-2 text-sm font-bold text-ink">Con thích gì?</h4>
            <Chips options={INTEREST_OPTIONS} isOn={key => likes.includes(key)} onToggle={key => setLikes(prev => toggleChoice(prev, key))} />
          </section>
          <section>
            <h4 className="m-0 mb-2 text-sm font-bold text-ink">Muốn con học thêm gì?</h4>
            <Chips options={INTEREST_OPTIONS} isOn={key => wants.includes(key)} onToggle={key => setWants(prev => toggleChoice(prev, key))} />
          </section>
          <section>
            <h4 className="m-0 mb-2 text-sm font-bold text-ink">Ngân sách mỗi tháng cho bé</h4>
            <Chips options={BUDGET_OPTIONS} isOn={key => budget === key} onToggle={key => setBudget(prev => toggleBudget(prev, key))} />
          </section>
        </div>
      )}
      {error && <p className="m-0 mt-2 text-xs text-red">{error}</p>}
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={onClose} className="btn btn--outline flex-1 text-sm">Bỏ qua</button>
        <button type="button" onClick={save} disabled={saving || !loaded} className="btn btn--green flex-1 text-sm disabled:opacity-50">
          {saving ? 'Đang lưu...' : 'Lưu'}
        </button>
      </div>
    </Modal>
  )
}
