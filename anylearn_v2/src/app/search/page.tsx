'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useCallback, Suspense, useRef } from 'react'
import { searchItems, searchUsers, Item, UserResult, SearchResult, UserSearchResult, getCategories, Category, getUserProfile, PublicUserProfile, getCourseUrl } from '@/lib/api'
import Link from 'next/link'

const SUBTYPE_LABELS: Record<string, string> = {
  extra:     'Ngoại khóa',
  offline:   'Học trực tiếp',
  online:    'Học online',
  digital:   'Kỹ thuật số',
  video:     'Video',
  preschool: 'Mầm non',
}

function formatPrice(price: number) {
  if (!price) return 'Liên hệ'
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1).replace('.0', '')} triệu`
  return price.toLocaleString('vi-VN') + ' đ'
}

const MODES = [
  { key: 'class',   label: 'Khóa học' },
  { key: 'school',  label: 'anySCHOOL' },
  { key: 'teacher', label: 'anyPROFESSOR' },
]


function FilterContent({ mode, activeCategory, filters, categorySearch, categories, sort, query, activeAuthorId, setCategorySearch, setActiveCategory, setFilters, setSort, pushSearch, doSearch, onClose, hideTitle }: {
  mode: string, activeCategory: string | undefined, filters: Record<string, string>,
  categorySearch: string, categories: { url: string, title: string }[], sort: string,
  query: string, activeAuthorId: number | undefined,
  setCategorySearch: (v: string) => void,
  setActiveCategory: (v: string | undefined) => void,
  setFilters: (v: Record<string, string>) => void,
  setSort: (v: string) => void,
  pushSearch: (q: string, cat?: string, m?: string, authorId?: number, age?: string, price?: string, sort?: string, loc?: string, ht?: string) => void,
  doSearch: (q: string, cat?: string, page?: number, sort?: string, mode?: string, authorId?: number, age?: string, price?: string, loc?: string, ht?: string) => void,
  onClose?: () => void,
  hideTitle?: boolean,
}) {
  const clearAll = () => {
    setActiveCategory(undefined)
    setCategorySearch('')
    setSort('popular')
    setFilters({ category: 'all', age: 'all', location: 'all', hinhthuc: 'all', price: 'all', schedule: 'all' })
    pushSearch(query, undefined, mode, undefined, undefined, undefined, 'popular')
    doSearch(query, undefined, 0, 'popular', mode)
    onClose?.()
  }

  const FILTER_GROUPS = [
    ...(mode === 'class' ? [{ id: 'hinhthuc', label: 'Hình thức học', options: [
      { label: 'Tất cả hình thức', value: 'all' },
      { label: 'Offline', value: 'offline' },
      { label: 'Online', value: 'online' },
      { label: 'Mã code', value: 'digital' },
    ]}] : []),
    ...(mode === 'class' ? [{ id: 'price', label: 'Học phí', options: [
      { label: 'Tất cả học phí', value: 'all' },
      { label: 'Dưới 2 triệu', value: 'under2' },
      { label: '2 - 5 triệu', value: '2to5' },
      { label: 'Trên 5 triệu', value: 'over5' },
    ]}] : []),
    ...(mode === 'class' ? [{ id: 'age', label: 'Độ tuổi', options: [
      { label: 'Tất cả độ tuổi', value: 'all' },
      { label: '3 - 5 tuổi', value: '3-5' },
      { label: '6 - 10 tuổi', value: '6-10' },
      { label: '11 - 15 tuổi', value: '11-15' },
      { label: '16 tuổi trở lên', value: '16+' },
    ]}] : []),
    { id: 'location', label: 'Khu vực', options: [
      { label: 'Tất cả khu vực', value: 'all' },
      { label: 'TP.HCM', value: '79' },
      { label: 'Hà Nội', value: '01' },
    ]},
  ]

  return (
    <>
      {!hideTitle && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, color: '#17212f', fontSize: 20, fontWeight: 900 }}>Bộ lọc</h2>
          {(activeCategory || Object.values(filters).some(v => v !== 'all')) && (
            <button onClick={clearAll} style={{ border: 0, background: 'transparent', color: '#e73348', fontWeight: 900, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              Xóa tất cả
            </button>
          )}
        </div>
      )}

      {mode === 'class' && (
        <div style={{ padding: '16px 0', borderTop: '1px solid #e6edf4' }}>
          <label style={{ display: 'block', fontWeight: 900, color: activeCategory ? '#e73348' : '#17212f', marginBottom: 9 }}>Lĩnh vực</label>
          <input type="search" placeholder="Tìm lĩnh vực..." value={categorySearch}
            onChange={e => setCategorySearch(e.target.value)}
            style={{ width: '100%', minHeight: 38, borderRadius: 10, border: '1px solid #e6edf4', background: '#f7fafc', padding: '0 10px', fontSize: 13, outline: 'none', fontFamily: 'inherit', marginBottom: 8, boxSizing: 'border-box' }}
          />
          <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <button type="button"
              onClick={() => { setActiveCategory(undefined); pushSearch(query, undefined, mode, undefined, filters.age, filters.price, sort); doSearch(query, undefined, 0, sort, mode); onClose?.() }}
              style={{ textAlign: 'left', padding: '7px 10px', borderRadius: 8, border: 0, cursor: 'pointer', background: !activeCategory ? '#eef7ff' : 'transparent', color: !activeCategory ? '#00539b' : '#2f3b4a', fontWeight: !activeCategory ? 900 : 400, fontSize: 13, fontFamily: 'inherit' }}>
              Tất cả lĩnh vực
            </button>
            {categories.filter(c => !categorySearch || c.title.toLowerCase().includes(categorySearch.toLowerCase())).map(c => (
              <button key={c.url} type="button"
                onClick={() => { setActiveCategory(c.url); pushSearch(query, c.url, mode, undefined, filters.age, filters.price, sort); doSearch(query, c.url, 0, sort, mode); onClose?.() }}
                style={{ textAlign: 'left', padding: '7px 10px', borderRadius: 8, border: 0, cursor: 'pointer', background: activeCategory === c.url ? '#eef7ff' : 'transparent', color: activeCategory === c.url ? '#00539b' : '#2f3b4a', fontWeight: activeCategory === c.url ? 900 : 400, fontSize: 13, fontFamily: 'inherit' }}>
                {c.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {FILTER_GROUPS.map(f => (
        <div key={f.id} style={{ padding: '16px 0', borderTop: '1px solid #e6edf4' }}>
          <label htmlFor={f.id} style={{ display: 'block', fontWeight: 900, color: filters[f.id] !== 'all' ? '#e73348' : '#17212f', marginBottom: 9 }}>{f.label}</label>
          <select id={f.id} value={filters[f.id]}
            onChange={e => {
              const newFilters = { ...filters, [f.id]: e.target.value }
              setFilters(newFilters)
              const age = newFilters.age !== 'all' ? newFilters.age : undefined
              const price = newFilters.price !== 'all' ? newFilters.price : undefined
              const loc = newFilters.location !== 'all' ? newFilters.location : undefined
              const ht = newFilters.hinhthuc !== 'all' ? newFilters.hinhthuc : undefined
              pushSearch(query, activeCategory, mode, activeAuthorId, age, price, sort, loc, ht)
              doSearch(query, activeCategory, 0, sort, mode, activeAuthorId, age, price, loc, ht)
            }}
            style={{ width: '100%', minHeight: 44, borderRadius: 14, border: `1px solid ${filters[f.id] !== 'all' ? '#e73348' : '#e6edf4'}`, background: filters[f.id] !== 'all' ? '#fff5f5' : '#f7fafc', padding: '0 12px', color: filters[f.id] !== 'all' ? '#e73348' : '#2f3b4a', fontWeight: filters[f.id] !== 'all' ? 900 : 400, outline: 'none', fontFamily: 'inherit' }}>
            {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      ))}

      <button onClick={clearAll} className="btn btn--outline" style={{ width: '100%', marginTop: 8 }}>
        Xóa bộ lọc
      </button>
    </>
  )
}

function SearchPageInner() {
  const router = useRouter()
  const params = useSearchParams()
  const initialQ = params.get('q') ?? ''
  const initialCategory = params.get('category') ?? undefined
  const initialMode = (params.get('mode') ?? 'class') as 'class' | 'school' | 'teacher'
  const initialAuthorId = params.get('authorId') ? Number(params.get('authorId')) : undefined
  const initialAge = params.get('age') ?? 'all'
  const initialPrice = params.get('price') ?? 'all'
  const initialSort = params.get('sort') ?? 'popular'
  const initialLocation = params.get('location') ?? 'all'
  const initialMode2 = params.get('hinhthuc') ?? 'all'

  const [mode, setMode] = useState<'class' | 'school' | 'teacher'>(initialMode)
  const [query, setQuery] = useState(initialQ)
  const [activeFilter, setActiveFilter] = useState('Tất cả')
  const [results, setResults] = useState<Item[]>([])
  const [userResults, setUserResults] = useState<UserResult[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [sort, setSort] = useState(initialSort)
  const [activeCategory, setActiveCategory] = useState<string | undefined>(initialCategory)
  const [activeAuthorId, setActiveAuthorId] = useState<number | undefined>(initialAuthorId)
  const [authorProfile, setAuthorProfile] = useState<PublicUserProfile | null>(null)
  const [showFullContent, setShowFullContent] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [categorySearch, setCategorySearch] = useState('')

  const [filters, setFilters] = useState({
    category: 'all', age: initialAge, location: initialLocation,
    hinhthuc: initialMode2, price: initialPrice, schedule: 'all',
  })

  const doSearch = useCallback(async (q: string, category?: string, page = 0, sortBy?: string, currentMode?: string, authorId?: number, age?: string, priceRange?: string, location?: string, hinhthuc?: string) => {
    const m = currentMode ?? mode
    setLoading(true)
    setSearched(true)
    if (m === 'class') {
      const data: SearchResult = await searchItems(q, page, 20, category, sortBy, authorId, age, priceRange, location, hinhthuc)
      setResults(data.items)
      setUserResults([])
      setTotal(data.total)
    } else {
      const data: UserSearchResult = await searchUsers(q, m, page, 20, sortBy, authorId)
      setUserResults(data.items)
      setResults([])
      setTotal(data.total)
    }
    setCurrentPage(page)
    setLoading(false)
    if (q.trim()) {
      try {
        const hist: string[] = JSON.parse(localStorage.getItem('anylearn_searches') ?? '[]')
        const updated = [q, ...hist.filter(h => h !== q)].slice(0, 8)
        localStorage.setItem('anylearn_searches', JSON.stringify(updated))
        setSearchHistory(updated)
      } catch {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  useEffect(() => {
    Promise.resolve().then(() => {
      setFilters(prev => ({
        ...prev,
        age: initialAge,
        price: initialPrice,
        location: initialLocation,
        hinhthuc: initialMode2,
      }))
      setSort(initialSort)
    })
  }, [initialAge, initialPrice, initialLocation, initialMode2, initialSort])

  useEffect(() => {
    const age = initialAge !== 'all' ? initialAge : undefined
    const price = initialPrice !== 'all' ? initialPrice : undefined
    const loc = initialLocation !== 'all' ? initialLocation : undefined
    const ht = initialMode2 !== 'all' ? initialMode2 : undefined
    Promise.resolve().then(() => {
      setMode(initialMode)
      if (initialAuthorId) {
        setActiveAuthorId(initialAuthorId)
        doSearch('', undefined, 0, initialSort, initialMode, initialAuthorId, age, price, loc, ht)
      } else if (initialCategory) {
        doSearch('', initialCategory, 0, initialSort, initialMode, undefined, age, price, loc, ht)
      } else if (initialQ) {
        doSearch(initialQ, undefined, 0, initialSort, initialMode, undefined, age, price, loc, ht)
      } else {
        doSearch('', undefined, 0, initialSort, initialMode, undefined, age, price, loc, ht)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQ, initialCategory, initialMode, initialAuthorId, initialAge, initialPrice, initialSort, initialLocation, initialMode2])

  const pushSearch = (q: string, cat?: string, m?: string, authorId?: number, age?: string, priceRange?: string, sortBy?: string, location?: string, hinhthuc?: string) => {
    const p = new URLSearchParams()
    if (q) p.set('q', q)
    const modeVal = m ?? mode
    if (modeVal !== 'class') p.set('mode', modeVal)
    if (cat) p.set('category', cat)
    if (authorId) p.set('authorId', String(authorId))
    if (age && age !== 'all') p.set('age', age)
    if (priceRange && priceRange !== 'all') p.set('price', priceRange)
    if (sortBy && sortBy !== 'popular') p.set('sort', sortBy)
    if (location && location !== 'all') p.set('location', location)
    if (hinhthuc && hinhthuc !== 'all') p.set('hinhthuc', hinhthuc)
    window.history.replaceState(null, '', `/search?${p.toString()}`)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    setActiveAuthorId(undefined)
    setCurrentPage(0)
    const age = filters.age !== 'all' ? filters.age : undefined
    const priceRange = filters.price !== 'all' ? filters.price : undefined
    const loc = filters.location !== 'all' ? filters.location : undefined
    const ht = filters.hinhthuc !== 'all' ? filters.hinhthuc : undefined
    pushSearch(q, activeCategory, mode, undefined, age, priceRange, sort, loc, ht)
    doSearch(q, activeCategory, 0, sort, mode, undefined, age, priceRange, loc, ht)
  }

  const handleModeChange = (newMode: 'class' | 'school' | 'teacher') => {
    setMode(newMode)
    setQuery('')
    setActiveCategory(undefined)
    setActiveAuthorId(undefined)
    setCurrentPage(0)
    pushSearch('', undefined, newMode, undefined, undefined, undefined, sort)
    doSearch('', undefined, 0, sort, newMode)
  }

  const filteredResults = results
  const resultsRef = useRef<HTMLDivElement>(null)
  const scrollToResults = () => resultsRef.current?.scrollIntoView({ behavior: 'smooth' })

  useEffect(() => {
    Promise.resolve().then(() => {
      try {
        setSearchHistory(JSON.parse(localStorage.getItem('anylearn_searches') ?? '[]'))
      } catch {}
    })
  }, [])

  useEffect(() => {
    getCategories().then(setCategories)
  }, [])

  useEffect(() => {
    if (activeAuthorId) {
      getUserProfile(activeAuthorId).then(setAuthorProfile)
    } else {
      Promise.resolve().then(() => setAuthorProfile(null))
    }
  }, [activeAuthorId])

  return (
    <>
      {/* ── Mode tabs — sits on top of hero, visually connected ── */}
      <div style={{ background: '#f7fafc', borderBottom: 'none', paddingTop: 16 }}>
        <div className="container">
          <div className="flex flex-wrap gap-1">
            {MODES.map(m => (
              <button key={m.key} type="button"
                onClick={() => handleModeChange(m.key as 'class' | 'school' | 'teacher')}
                style={{
                  padding: '8px 14px',
                  borderTop: '1px solid #e6edf4',
                  borderLeft: '1px solid #e6edf4',
                  borderRight: '1px solid #e6edf4',
                  borderBottom: mode === m.key ? '1px solid transparent' : '1px solid #e6edf4',
                  borderTopLeftRadius: 10, borderTopRightRadius: 10,
                  background: mode === m.key ? 'linear-gradient(135deg, #00539b, #00a651)' : 'white',
                  color: mode === m.key ? 'white' : '#6d7a8a',
                  fontWeight: mode === m.key ? 900 : 700,
                  fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.15s',
                  marginBottom: mode === m.key ? -1 : 0,
                  position: 'relative', zIndex: mode === m.key ? 2 : 1,
                }}>{m.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Search hero ── */}
      <section className="search-hero" style={{
        background: 'linear-gradient(135deg, #00539b, #00a651)',
        color: 'white',
        borderBottom: '1px solid #e6edf4',
      }}>
        <div className="container">
          <h1 style={{ margin: '0 0 8px', fontSize: 'clamp(20px,2.4vw,30px)', fontWeight: 900, lineHeight: 1.12, letterSpacing: -0.5, color: 'white' }}>
            {mode === 'class' ? 'Tìm khóa học phù hợp cho con' : mode === 'school' ? 'Tìm trường học chất lượng' : 'Tìm chuyên gia giảng dạy'}
          </h1>
          <p style={{ margin: '0 0 18px', maxWidth: 760, color: 'rgba(255,255,255,0.88)', fontSize: 15 }}>
            Nhập nhu cầu học tập, chọn bộ lọc theo độ tuổi, khu vực, hình thức học và nhận gợi ý phù hợp
          </p>

          <form onSubmit={handleSubmit} style={{
            background: 'white', border: '1px solid #e6edf4',
            borderRadius: 30, padding: 18,
            boxShadow: '0 10px 26px rgba(15,23,42,0.08)',
          }}>
            <div className="search-row search-row--page">
              <input
                type="search" value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Ví dụ: bóng đá U12, tiếng Anh, piano, trường quốc tế..."
                style={{
                  minHeight: 58, borderRadius: 999,
                  border: '1px solid #d7e7f4', background: '#f9fcff',
                  padding: '0 22px', fontSize: 17, outline: 'none', fontFamily: 'inherit',
                  color: '#17212f',
                }}
                onFocus={e => { e.target.style.borderColor = '#00a651'; e.target.style.background = 'white' }}
                onBlur={e => { e.target.style.borderColor = '#d7e7f4'; e.target.style.background = '#f9fcff' }}
              />
              <button type="submit" className="btn btn--green" style={{ fontSize: 16 }}>Tìm kiếm</button>
            </div>

            {/* Recent searches */}
            {searchHistory.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14, alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: '#6d7a8a', whiteSpace: 'nowrap' }}>Đã tìm:</span>
                {searchHistory.slice(0, 5).map(h => (
                  <button key={h} type="button"
                    onClick={() => { setQuery(h); router.push(`/search?q=${encodeURIComponent(h)}`); doSearch(h, undefined, 0, sort, mode) }}
                    style={{
                      display: 'inline-flex', alignItems: 'center',
                      borderRadius: 999, padding: '7px 12px',
                      background: 'white', border: '1px solid #d8e9f8',
                      color: '#00539b', fontWeight: 900, fontSize: 13,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                    🕐 {h}
                  </button>
                ))}
                <button type="button" onClick={() => { localStorage.removeItem('anylearn_searches'); setSearchHistory([]) }}
                  style={{ border: 0, background: 'transparent', color: '#6d7a8a', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', padding: '0 4px' }}>
                  Xóa
                </button>
              </div>
            )}
          </form>
        </div>
      </section>

      {/* ── Layout ── */}
      <section className="section">
        <div className="container search-layout" style={{ display: 'grid', gridTemplateColumns: mode === 'class' ? '300px 1fr' : '1fr', gap: 28, alignItems: 'start' }}>

          {/* Sidebar — desktop only, class mode only */}
          {mode === 'class' && (
            <div className="md:contents">
              {/* Mobile: filter trigger bar — spans full width */}
              <div className="md:hidden col-span-full flex items-center justify-between bg-white border border-[#e6edf4] rounded-2xl px-4 py-3"
                style={{ boxShadow: '0 4px 12px rgba(15,23,42,0.06)' }}>
                <span className="font-black text-[#17212f] text-sm">
                  Bộ lọc
                  {(activeCategory || Object.values(filters).some(v => v !== 'all')) && (
                    <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#e73348] text-white text-[10px] font-black">
                      {[activeCategory, ...Object.values(filters).filter(v => v !== 'all')].filter(Boolean).length}
                    </span>
                  )}
                </span>
                <button onClick={() => setFilterOpen(true)}
                  className="flex items-center gap-2 btn btn--outline"
                  style={{ padding: '7px 14px', fontSize: 13 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/>
                  </svg>
                  Lọc
                </button>
              </div>

              {/* Mobile: drawer overlay */}
              {filterOpen && (
                <div className="md:hidden fixed inset-0 z-50 flex justify-end"
                  onClick={() => setFilterOpen(false)}>
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="relative w-[80vw] max-w-xs bg-white h-full flex flex-col shadow-2xl"
                    style={{ borderTopLeftRadius: 20, borderBottomLeftRadius: 20 }}
                    onClick={e => e.stopPropagation()}>
                    {/* Header cố định */}
                    <div className="flex justify-between items-center px-4 py-3 border-b border-[#e6edf4] shrink-0">
                      <span className="text-[#17212f] text-base font-black">Bộ lọc</span>
                      <button onClick={() => setFilterOpen(false)}
                        className="w-8 h-8 rounded-full border border-[#e6edf4] bg-white grid place-items-center text-base cursor-pointer">✕</button>
                    </div>
                    {/* Nội dung cuộn được */}
                    <div className="flex-1 overflow-y-auto p-4">
                      <FilterContent
                        mode={mode} activeCategory={activeCategory} filters={filters}
                        categorySearch={categorySearch} categories={categories} sort={sort} query={query}
                        activeAuthorId={activeAuthorId}
                        setCategorySearch={setCategorySearch} setActiveCategory={setActiveCategory}
                        setFilters={setFilters as (v: Record<string, string>) => void} setSort={setSort}
                        pushSearch={pushSearch} doSearch={doSearch}
                        onClose={() => setFilterOpen(false)}
                        hideTitle
                      />
                  </div>
                </div>
              </div>
              )}

              {/* Desktop: sidebar */}
              <aside className="hidden md:block" style={{
                background: 'white', border: '1px solid #e6edf4',
                borderRadius: 26, padding: 22,
                boxShadow: '0 8px 24px rgba(15,23,42,0.05)',
              }}>
                <FilterContent
                  mode={mode} activeCategory={activeCategory} filters={filters}
                  categorySearch={categorySearch} categories={categories} sort={sort} query={query}
                  activeAuthorId={activeAuthorId}
                  setCategorySearch={setCategorySearch} setActiveCategory={setActiveCategory}
                  setFilters={setFilters as (v: Record<string, string>) => void} setSort={setSort}
                  pushSearch={pushSearch} doSearch={doSearch}
                />
              </aside>
            </div>
          )}

          {/* Results */}
          <div>

            {/* Author profile section */}
            {authorProfile && mode === 'class' && (
              <div style={{
                background: 'linear-gradient(135deg, #eef7ff, #e9fff3)',
                border: '1px solid #d8e9f8', borderRadius: 22,
                marginBottom: 24, overflow: 'hidden',
                display: 'flex', alignItems: 'stretch',
              }}>
                {/* Avatar — square */}
                <div className="shrink-0 self-start relative overflow-hidden" style={{ width: 160, aspectRatio: '1/1' }}>
                  {authorProfile.image
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={authorProfile.image} alt={authorProfile.name}
                        className="absolute inset-0 w-full h-full object-cover" />
                    : <div className="w-full h-full grid place-items-center text-5xl text-white" style={{ background: '#00539b' }}>
                        {authorProfile.role === 'teacher' ? '👨‍🏫' : '🏫'}
                      </div>
                  }
                </div>
                {/* Info */}
                <div style={{ flex: 1, padding: '20px 24px' }}>
                  <div style={{ fontSize: 11, fontWeight: 900, color: '#00539b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                    {authorProfile.role === 'teacher' ? 'Chuyên gia' : 'Trường học'}
                  </div>
                  <h3 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 900, color: '#17212f' }}>{authorProfile.name}</h3>
                  {authorProfile.introduce && (
                    <p style={{ margin: '0 0 12px', color: '#2f3b4a', fontSize: 14, lineHeight: 1.6 }}>{authorProfile.introduce}</p>
                  )}
                  {authorProfile.full_content && (
                    <button onClick={() => setShowFullContent(true)}
                      style={{ border: 0, background: 'transparent', color: '#00539b', fontWeight: 900, fontSize: 13, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                      Xem giới thiệu đầy đủ →
                    </button>
                  )}
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 18, marginBottom: 18 }}>
              <div>
                <h2 ref={resultsRef} className="m-0 text-xl md:text-3xl font-black text-[#17212f]">Kết quả phù hợp</h2>
                <p style={{ color: '#6d7a8a', margin: '4px 0 0' }}>
                  {loading ? 'Đang tìm kiếm...' : searched ? `${total} kết quả` : 'Nhập từ khóa để bắt đầu tìm kiếm'}
                </p>
              </div>
              {mode === 'class' && (
                <select value={sort} onChange={e => { setSort(e.target.value); if (searched) { pushSearch(query, activeCategory, mode, activeAuthorId, filters.age !== 'all' ? filters.age : undefined, filters.price !== 'all' ? filters.price : undefined, e.target.value, filters.location !== 'all' ? filters.location : undefined, filters.hinhthuc !== 'all' ? filters.hinhthuc : undefined); doSearch(query, activeCategory, 0, e.target.value, mode, activeAuthorId, filters.age !== 'all' ? filters.age : undefined, filters.price !== 'all' ? filters.price : undefined) } }}
                  style={{
                    minHeight: 42, borderRadius: 999, border: '1px solid #e6edf4',
                    background: 'white', padding: '0 14px', fontWeight: 800, color: '#2f3b4a',
                    fontFamily: 'inherit', outline: 'none',
                  }}>
                  <option value="popular">Phổ biến nhất</option>
                  <option value="newest">Mới nhất</option>
                  <option value="priceLow">Giá thấp đến cao</option>
                  <option value="priceHigh">Giá cao đến thấp</option>
                </select>
              )}
            </div>

            

            {/* Full content popup */}
            {showFullContent && authorProfile?.full_content && (
              <div style={{
                position: 'fixed', inset: 0, zIndex: 100,
                background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 20,
              }} onClick={() => setShowFullContent(false)}>
                <div style={{
                  background: 'white', borderRadius: 26, padding: 32,
                  maxWidth: 720, width: '100%', maxHeight: '80vh', overflowY: 'auto',
                  position: 'relative',
                }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => setShowFullContent(false)}
                    style={{
                      position: 'absolute', top: 16, right: 16,
                      width: 36, height: 36, borderRadius: '50%',
                      border: '1px solid #e6edf4', background: 'white',
                      cursor: 'pointer', fontSize: 18, display: 'grid', placeItems: 'center',
                    }}>✕</button>
                  <h3 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 900, color: '#17212f' }}>{authorProfile.name}</h3>
                  <div style={{ color: '#2f3b4a', lineHeight: 1.8, fontSize: 15 }}
                    dangerouslySetInnerHTML={{ __html: authorProfile.full_content }} />
                </div>
              </div>
            )}

            {/* Class result grid */}
            {mode === 'class' && filteredResults.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {filteredResults.map(item => (
                  <article key={item.id} className="bg-white border border-[#e6edf4] rounded-2xl overflow-hidden flex flex-col md:grid md:grid-cols-[160px_1fr] relative cursor-pointer"
                    style={{ boxShadow: '0 8px 24px rgba(15,23,42,0.05)' }}>
                    {/* Clickable overlay */}
                    <Link href={getCourseUrl(item)} className="absolute inset-0 z-10" aria-label={item.title} />
                    {/* Ảnh — mobile: vuông, desktop: full height */}
                    <div className="relative overflow-hidden grid place-items-center shrink-0 aspect-square md:aspect-auto"
                      style={{ background: 'linear-gradient(135deg,#e9fff3,#eef7ff)' }}>
                      {item.image
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={item.image} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
                        : <span className="text-4xl">📚</span>
                      }
                    </div>
                    {/* Body */}
                    <div className="p-3 flex flex-col flex-1 gap-1.5">
                      <h3 className="m-0 text-[#008244] text-xs md:text-base font-black leading-snug line-clamp-2">{item.title}</h3>
                      {item.authorName && (
                        <div className="flex items-center gap-1">
                          {item.authorImage
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={item.authorImage} alt={item.authorName} className="w-3.5 h-3.5 rounded-full object-cover shrink-0" />
                            : <span className="w-3.5 h-3.5 rounded-full bg-[#eef7ff] grid place-items-center text-[7px] shrink-0">👤</span>
                          }
                          <Link href={`/search?mode=class&authorId=${item.authorId}`}
                            className="relative z-20 text-[10px] md:text-xs text-[#6d7a8a] font-bold no-underline truncate"
                            onClick={e => e.stopPropagation()}>
                            {item.authorName}
                          </Link>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {item.subtype && (
                          <span className="rounded-full px-1.5 py-0.5 bg-[#e9fff3] text-[#008244] text-[9px] md:text-xs font-black">
                            {SUBTYPE_LABELS[item.subtype] ?? item.subtype}
                          </span>
                        )}
                        {item.categoryTitles && item.categoryTitles.split('|').map(cat => (
                          <span key={cat} className="rounded-full px-1.5 py-0.5 bg-[#eef7ff] text-[#00539b] text-[9px] md:text-xs font-black">
                            {cat}
                          </span>
                        ))}
                      </div>
                      {item.shortContent && (
                        <p className="m-0 text-[#6d7a8a] text-[10px] md:text-sm line-clamp-2 flex-1">{item.shortContent}</p>
                      )}
                      <div className="mt-auto pt-1">
                        <div className="text-[#e73348] font-black text-xs md:text-base mb-1">{formatPrice(item.price)}</div>
                        <div className="text-right">
                          <span className="text-[#008244] font-black text-[10px] md:text-sm">Tìm hiểu thêm →</span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* User result grid (school/teacher) */}
            {(mode === 'school' || mode === 'teacher') && userResults.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {userResults.map(u => (
                  <article key={u.id} className="bg-white border border-[#e6edf4] rounded-2xl overflow-hidden flex flex-col md:grid md:grid-cols-[160px_1fr] relative cursor-pointer"
                    style={{ boxShadow: '0 8px 24px rgba(15,23,42,0.05)' }}>
                    {/* Clickable overlay */}
                    <Link href={`/search?mode=class&authorId=${u.id}`} className="absolute inset-0 z-10" aria-label={u.name} />
                    {/* Ảnh — mobile: vuông, desktop: full height */}
                    <div className="relative overflow-hidden grid place-items-center shrink-0 aspect-square md:aspect-auto"
                      style={{ background: 'linear-gradient(135deg,#eef7ff,#e9fff3)' }}>
                      {u.image
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={u.image} alt={u.name} className="absolute inset-0 w-full h-full object-cover" />
                        : <span className="text-4xl">{mode === 'school' ? '🏫' : '👨‍🏫'}</span>
                      }
                    </div>
                    {/* Body */}
                    <div className="p-3 flex flex-col flex-1 gap-1.5">
                      <h3 className="m-0 text-[#17212f] text-xs md:text-base font-black leading-snug">{u.name}</h3>
                      {u.title && (
                        <div className="text-[10px] md:text-xs text-[#00539b] font-bold">{u.title}</div>
                      )}
                      {u.rating != null && u.rating > 0 && (
                        <div className="text-[10px] md:text-xs text-[#6d7a8a]">⭐ {u.rating.toFixed(1)}</div>
                      )}
                      {u.introduce && (
                        <p className="m-0 text-[#6d7a8a] text-[10px] md:text-sm line-clamp-2 flex-1">{u.introduce}</p>
                      )}
                      <div className="text-right mt-auto pt-1">
                        <span className="text-[#008244] font-black text-[10px] md:text-sm">Xem khóa học →</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Pagination */}
            {searched && !loading && total > 20 && (() => {
              const totalPages = Math.ceil(total / 20)
              return (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 24 }}>
                  <button disabled={currentPage === 0}
                    onClick={() => { doSearch(query, activeCategory, currentPage - 1, sort, mode, activeAuthorId, filters.age !== "all" ? filters.age : undefined, filters.price !== "all" ? filters.price : undefined); scrollToResults() }}
                    className="btn btn--outline" style={{ padding: '10px 16px', fontSize: 14 }}>
                    ← Trước
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i)
                    .filter(i => i === 0 || i === totalPages - 1 || Math.abs(i - currentPage) <= 1)
                    .reduce<(number | '...')[]>((acc, i, idx, arr) => {
                      if (idx > 0 && (i as number) - (arr[idx - 1] as number) > 1) acc.push('...')
                      acc.push(i)
                      return acc
                    }, [])
                    .map((i, idx) => i === '...'
                      ? <span key={`ellipsis-${idx}`} style={{ color: '#6d7a8a', padding: '0 4px' }}>…</span>
                      : <button key={i} onClick={() => { doSearch(query, activeCategory, i as number, sort, mode, activeAuthorId, filters.age !== "all" ? filters.age : undefined, filters.price !== "all" ? filters.price : undefined); scrollToResults() }}
                          style={{
                            minWidth: 38, height: 38, borderRadius: 999,
                            border: `1px solid ${currentPage === i ? '#00539b' : '#e6edf4'}`,
                            background: currentPage === i ? '#00539b' : 'white',
                            color: currentPage === i ? 'white' : '#2f3b4a',
                            fontWeight: 900, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
                          }}>{(i as number) + 1}</button>
                    )
                  }
                  <button disabled={currentPage >= totalPages - 1}
                    onClick={() => { doSearch(query, activeCategory, currentPage + 1, sort, mode, activeAuthorId, filters.age !== "all" ? filters.age : undefined, filters.price !== "all" ? filters.price : undefined); scrollToResults() }}
                    className="btn btn--outline" style={{ padding: '10px 16px', fontSize: 14 }}>
                    Sau →
                  </button>
                </div>
              )
            })()}

            {/* No results */}
            {searched && !loading && filteredResults.length === 0 && userResults.length === 0 && (
              <div style={{
                background: 'white', border: '1px solid #e6edf4',
                borderRadius: 26, padding: 34, textAlign: 'center',
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                <h2 style={{ margin: '0 0 10px', color: '#17212f', fontWeight: 900 }}>Chưa tìm thấy khóa học phù hợp</h2>
                <p style={{ margin: '0 auto 18px', color: '#6d7a8a', maxWidth: 520 }}>
                  Thử đổi keyword, mở rộng khu vực hoặc để anyLEARN tư vấn miễn phí chương trình phù hợp cho con
                </p>
                <button className="btn btn--green">Nhận tư vấn miễn phí</button>
              </div>
            )}

            {/* Empty state */}
            {!searched && (
              <div style={{
                background: 'linear-gradient(135deg,#f6fbff,#f5fff8)',
                border: '1px solid #d8e9f8',
                borderRadius: 26, padding: 34, textAlign: 'center',
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
                <h2 style={{ margin: '0 0 10px', color: '#17212f', fontWeight: 900 }}>Bắt đầu tìm kiếm</h2>
                <p style={{ margin: 0, color: '#6d7a8a' }}>Nhập từ khóa phía trên để tìm khóa học, trường học và chuyên gia phù hợp cho con</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 900px) {
          .search-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  )
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageInner />
    </Suspense>
  )
}
