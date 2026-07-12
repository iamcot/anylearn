'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

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
    if (initialTags.length > 0) return
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/v2/api'}/search-tags`)
      .then(r => r.json())
      .then(d => {
        const list: string[] = d?.data ?? d ?? []
        setTags(list.slice(0, 6).map(label => ({ label })))
      })
      .catch(() => {})
  }, [initialTags])

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
          className="field"
          style={{ borderRadius: 18, fontWeight: 700 }}
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
          {variant === 'about' ? 'Tìm ngay' : 'Tìm khóa học'}
        </button>
      </div>

      {searchMode === 'class' && tags.length > 0 && (
        <div className="quick-tags">
          {tags.map(tag => (
            <span key={tag.label} className="tag" style={{ cursor: 'pointer' }}
              onClick={() => handleTagClick(tag)}>
              {tag.label}
            </span>
          ))}
        </div>
      )}

      <div className="search-hint">
        💡 Gõ keyword để xem gợi ý, sau đó chuyển sang trang kết quả có filter đầy đủ
      </div>
    </form>
  )
}
