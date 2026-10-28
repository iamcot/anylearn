'use client'

import { useEffect, useState } from 'react'
import { CloseIcon } from '@/components/icons'
import { searchCreatorTags, type ExploreTag } from '@/lib/api/explore'

const MAX = 8

/** Tags of a post: chips of the chosen ones, and a box that searches the tag dictionary (the one shared with courses). */
export default function TagPicker({ token, value, onChange }: { token: string; value: ExploreTag[]; onChange: (tags: ExploreTag[]) => void }) {
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<ExploreTag[]>([])
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) return
    const t = setTimeout(() => searchCreatorTags(token, q.trim()).then(({ data }) => setHits(data ?? [])), 250)
    return () => clearTimeout(t)
  }, [token, q, focused])

  const chosen = new Set(value.map(t => t.id))
  const options = hits.filter(t => !chosen.has(t.id)).slice(0, 10)
  return (
    <div>
      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {value.map(t => (
            <span key={t.id} className="inline-flex items-center gap-1 rounded-full bg-green/10 py-1 pl-3 pr-1 text-sm font-bold text-green-dark">
              #{t.name}
              <button type="button" aria-label={`Bỏ tag ${t.name}`} onClick={() => onChange(value.filter(x => x.id !== t.id))} className="grid size-6 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-green-dark"><CloseIcon className="size-3" /></button>
            </span>
          ))}
        </div>
      )}
      {value.length < MAX && (
        <input type="text" value={q} onChange={e => setQ(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="Gõ để tìm tag, ví dụ: tiếng Anh, vẽ" className="min-h-11 w-full rounded-xl border border-line bg-white px-3 text-base outline-none focus:border-green" />
      )}
      {focused && options.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1.5 rounded-xl bg-white p-2 ring-1 ring-line">
          {options.map(t => (
            <button key={t.id} type="button" onMouseDown={e => e.preventDefault()} onClick={() => { onChange([...value, t]); setQ('') }}
              className="min-h-9 cursor-pointer rounded-full border border-line bg-white px-3 text-sm font-semibold text-ink">#{t.name}</button>
          ))}
        </div>
      )}
      {focused && q.trim() && options.length === 0 && <p className="mt-1 text-xs text-muted">Không có tag này. Tag mới do anyLEARN thêm, bạn chọn tag gần nghĩa nhé.</p>}
    </div>
  )
}
