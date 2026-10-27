'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { API_BASE } from '@/lib/apiBase'
import { LightbulbIcon } from '@/components/icons'

interface TagItem {
  label: string
  categoryUrl?: string
}

interface Props {
  variant?: 'home' | 'about'
  initialTags?: TagItem[]
}

const SEARCH_MODES = [
  { key: 'class',   label: 'Khóa học' },
  { key: 'school',  label: 'anySCHOOL' },
  { key: 'teacher', label: 'anyPROFESSOR' },
]

export default function SearchCard({ variant = 'home', initialTags = [] }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [searchMode, setSearchMode] = useState('class')
  const [tags, setTags] = useState<TagItem[]>(initialTags)

  useEffect(() => {
    if (initialTags.length > 0 || tags.length > 0) return
    fetch(`${API_BASE}/search-tags`)
      .then(r => r.json())
      .then(d => {
        const list: string[] = d?.data ?? d ?? []
        setTags(list.slice(0, 6).map(label => ({ label })))
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (searchMode !== 'class') params.set('mode', searchMode)
    router.push(`/search?${params.toString()}`)
  }

  const handleTagClick = (tag: TagItem) => {
    const params = new URLSearchParams()
    if (searchMode !== 'class') params.set('mode', searchMode)
    if (tag.categoryUrl) {
      params.set('category', tag.categoryUrl)
    } else {
      params.set('q', tag.label)
    }
    router.push(`/search?${params.toString()}`)
  }

  return (
    <form className="search-card" onSubmit={handleSubmit}>

      <div className="search-row search-row--home">
        <select
          value={searchMode}
          onChange={e => setSearchMode(e.target.value)}
          className="field font-medium"
        >
          {SEARCH_MODES.map(m => (
            <option key={m.key} value={m.key}>{m.label}</option>
          ))}
        </select>
        <input
          className="field"
          type="search"
          placeholder={variant === 'about' ? 'Bạn đang tìm chương trình học nào?' : 'Tìm khóa học, kỹ năng, trường hoặc chuyên gia'}
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button type="submit" className="btn btn--green">
          Tìm kiếm
        </button>
      </div>

      {searchMode === 'class' && tags.length > 0 && (
        <div className="quick-tags">
          {tags.map(tag => (
            <button key={tag.label} type="button" className="tag" onClick={() => handleTagClick(tag)}>
              {tag.label}
            </button>
          ))}
        </div>
      )}

      <div className="search-hint flex items-start gap-1.5">
        <LightbulbIcon className="mt-0.5 size-4 shrink-0 text-yellow" />
        Gõ keyword để xem gợi ý, sau đó chuyển sang trang kết quả có filter đầy đủ
      </div>
    </form>
  )
}
