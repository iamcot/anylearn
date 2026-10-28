import type { StickerCollection } from '@/lib/api/stickers'
import { progressText } from '@/lib/stickers/rules'

/** One chip per collection with its progress; a star marks a finished one. Scrolls sideways when there are many. */
export default function CollectionTabs({ collections, selectedId, onSelect }: { collections: StickerCollection[]; selectedId: number | null; onSelect: (id: number) => void }) {
  if (collections.length < 2) return null
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0" role="tablist" aria-label="Bộ sưu tập">
      <div className="flex w-max gap-2">
        {collections.map(c => {
          const on = c.id === selectedId
          return (
            <button key={c.id} type="button" role="tab" aria-selected={on} onClick={() => onSelect(c.id)}
              className={`flex min-h-14 cursor-pointer items-center gap-2 rounded-2xl border-2 px-3 py-2 text-left ${on ? 'border-green bg-green-soft' : 'border-line bg-white'}`}>
              <span className="grid size-8 shrink-0 place-items-center overflow-hidden text-[22px] leading-none" aria-hidden>
                {c.image
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={c.image} alt="" className="size-full object-contain" />
                  : c.emoji ?? '⭐'}
              </span>
              <span className="min-w-0">
                <span className={`block max-w-[150px] truncate text-sm font-extrabold ${on ? 'text-green-dark' : 'text-ink'}`}>{c.name}</span>
                <span className="block text-xs font-bold text-muted">{c.complete ? 'Đủ bộ ✓' : progressText(c.owned, c.total)}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
