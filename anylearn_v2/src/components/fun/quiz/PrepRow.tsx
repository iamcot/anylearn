import type { ItemKey, QuizMe } from '@/lib/api/quiz'
import { BEFORE_ITEMS, ITEM_HINT } from '@/lib/quiz/rules'
import ItemIcon from './ItemIcon'

export interface Prep { mult: ItemKey | null; shield: boolean; topic: string | null }

/** The items played before a question: lucky stars, shield and a topic of your own choice. */
export default function PrepRow({ me, items, prep, onMult, onShield, onTopic }: {
  me: QuizMe
  items: QuizMe['items']
  prep: Prep
  onMult: (item: ItemKey) => void
  onShield: () => void
  onTopic: (topic: string | null) => void
}) {
  const row = (key: ItemKey) => me.itemList.find(r => r.key === key)
  const selected = (key: ItemKey) => (key === 'shield' ? prep.shield : key === 'topic' ? prep.topic !== null : prep.mult === key)
  const click = (key: ItemKey) => {
    if (key === 'shield') onShield()
    else if (key === 'topic') onTopic(prep.topic === null ? me.topics[0]?.key ?? null : null)
    else onMult(key)
  }
  return (
    <div>
      <div className="grid grid-cols-4 gap-2">
        {BEFORE_ITEMS.map(key => {
          const qty = items[key] ?? 0
          const on = selected(key)
          return (
            <button key={key} type="button" disabled={qty < 1} onClick={() => click(key)} aria-pressed={on} title={ITEM_HINT[key]}
              className={`relative flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-2xl border-2 bg-white px-1 py-2 text-center text-[11px] font-bold leading-tight ${on ? 'border-green bg-green-soft text-green-dark' : 'border-line text-ink'} ${qty < 1 ? 'opacity-45' : 'cursor-pointer'}`}>
              <ItemIcon item={key} className="size-8" />
              <span>{row(key)?.label}</span>
              <span className={`absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-black text-white ${qty > 0 ? 'bg-green' : 'bg-slate-400'}`}>{qty}</span>
            </button>
          )
        })}
      </div>
      {prep.topic !== null && (
        <label className="mt-2 flex items-center gap-2 text-sm font-bold">
          Chủ đề
          <select className="field !min-h-10 flex-1" value={prep.topic} onChange={event => onTopic(event.target.value)}>
            {me.topics.map(topic => <option key={topic.key} value={topic.key}>{topic.label}</option>)}
          </select>
        </label>
      )}
    </div>
  )
}
