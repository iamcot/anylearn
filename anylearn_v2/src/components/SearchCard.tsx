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

export default function SearchCard({ variant = 'home', initialTags = [] }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState('')
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
    router.push(query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : '/search')
  }

  const handleTagClick = (tag: TagItem) => {
    if (tag.categoryUrl) {
      router.push(`/search?category=${tag.categoryUrl}`)
    } else {
      router.push(`/search?q=${encodeURIComponent(tag.label)}`)
    }
  }

  return (
    <form className="search-card" onSubmit={handleSubmit}>
      <div className="search-row">
        <input
          className="field"
          type="search"
          placeholder={variant === 'about' ? 'Bạn đang tìm chương trình học nào?' : 'Tìm môn học, kỹ năng, trường hoặc chuyên gia'}
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <select className="field" name="age" defaultValue="">
          <option value="" disabled>Độ tuổi</option>
          <option>3 - 5 tuổi</option>
          <option>6 - 10 tuổi</option>
          <option>11 - 15 tuổi</option>
          <option>16 tuổi trở lên</option>
        </select>
        <select className="field" name={variant === 'about' ? 'mode' : 'location'} defaultValue="">
          {variant === 'about' ? (
            <>
              <option value="" disabled>Hình thức học</option>
              <option>Offline</option>
              <option>Online</option>
              <option>Hybrid</option>
            </>
          ) : (
            <>
              <option value="" disabled>Khu vực</option>
              <option>TP.HCM</option>
              <option>Hà Nội</option>
              <option>Online</option>
            </>
          )}
        </select>
        <button type="submit" className="btn btn--green">
          {variant === 'about' ? 'Tìm ngay' : 'Tìm lớp'}
        </button>
      </div>

      {tags.length > 0 && (
        <div className="quick-tags">
          {tags.map(tag => (
            <span key={tag.label} className="tag" style={{ cursor: 'pointer' }}
              onClick={() => handleTagClick(tag)}>
              {tag.label}
            </span>
          ))}
        </div>
      )}

      <div style={{ fontSize: 13, color: '#6d7a8a', marginTop: 12 }}>
        💡 Gõ keyword để xem gợi ý lớp học, sau đó chuyển sang trang kết quả có filter đầy đủ
      </div>
    </form>
  )
}
