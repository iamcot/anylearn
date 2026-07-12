'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { searchItems, Item, SearchResult, getCategories, Category } from '@/lib/api'
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


function SearchPageInner() {
  const router = useRouter()
  const params = useSearchParams()
  const initialQ = params.get('q') ?? ''
  const initialCategory = params.get('category') ?? undefined

  const [query, setQuery] = useState(initialQ)
  const [activeFilter, setActiveFilter] = useState('Tất cả')
  const [results, setResults] = useState<Item[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [sort, setSort] = useState('popular')
  const [activeCategory, setActiveCategory] = useState<string | undefined>(initialCategory)
  const [history, setHistory] = useState<string[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [categorySearch, setCategorySearch] = useState('')

  const [filters, setFilters] = useState({
    category: 'all', age: 'all', location: 'all',
    mode: 'all', price: 'all', schedule: 'all',
  })

  const doSearch = useCallback(async (q: string, category?: string, page = 0, sortBy?: string) => {
    setLoading(true)
    setSearched(true)
    const data: SearchResult = await searchItems(q, page, 20, category, sortBy)
    setResults(data.items)
    setTotal(data.total)
    setCurrentPage(page)
    setLoading(false)
    if (q.trim()) {
      try {
        const hist: string[] = JSON.parse(localStorage.getItem('anylearn_searches') ?? '[]')
        const updated = [q, ...hist.filter(h => h !== q)].slice(0, 8)
        localStorage.setItem('anylearn_searches', JSON.stringify(updated))
        setHistory(updated)
      } catch {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (initialCategory) {
      doSearch('', initialCategory, 0, sort)
    } else if (initialQ) {
      doSearch(initialQ, undefined, 0, sort)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQ, initialCategory])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      setActiveCategory(undefined)
      setCurrentPage(0)
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      doSearch(query.trim(), undefined, 0, sort)
    }
  }

  const filteredResults = results

  useEffect(() => {
    try {
      setHistory(JSON.parse(localStorage.getItem('anylearn_searches') ?? '[]'))
    } catch {}
  }, [])

  useEffect(() => {
    getCategories().then(setCategories)
  }, [])

  return (
    <>
      {/* ── Search hero ── */}
      <section style={{
        padding: '54px 0 34px',
        background: 'radial-gradient(circle at top right, rgba(0,166,81,0.15), transparent 32%), linear-gradient(135deg, #eef7ff, #f0fff6)',
        borderBottom: '1px solid #e6edf4',
      }}>
        <div className="container">
          <span className="section-kicker">Tìm kiếm thông minh</span>
          <h1 style={{ margin: '0 0 10px', fontSize: 'clamp(32px,4vw,52px)', fontWeight: 900, lineHeight: 1.08, letterSpacing: -1.1, color: '#17212f' }}>
            Tìm chương trình học phù hợp cho con
          </h1>
          <p style={{ margin: '0 0 24px', maxWidth: 760, color: '#6d7a8a', fontSize: 18 }}>
            Nhập nhu cầu học tập, chọn bộ lọc theo độ tuổi, khu vực, hình thức học và nhận gợi ý phù hợp
          </p>

          <form onSubmit={handleSubmit} style={{
            background: 'white', border: '1px solid #e6edf4',
            borderRadius: 30, padding: 18,
            boxShadow: '0 10px 26px rgba(15,23,42,0.08)',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
              <input
                type="search" value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Ví dụ: bóng đá U12, tiếng Anh, piano, trường quốc tế..."
                style={{
                  minHeight: 58, borderRadius: 999,
                  border: '1px solid #d7e7f4', background: '#f9fcff',
                  padding: '0 22px', fontSize: 17, outline: 'none', fontFamily: 'inherit',
                }}
                onFocus={e => { e.target.style.borderColor = '#00a651'; e.target.style.background = 'white' }}
                onBlur={e => { e.target.style.borderColor = '#d7e7f4'; e.target.style.background = '#f9fcff' }}
              />
              <button type="submit" className="btn btn--green" style={{ fontSize: 16 }}>Tìm kiếm</button>
            </div>

            {/* Recent searches */}
            {history.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14, alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: '#6d7a8a', whiteSpace: 'nowrap' }}>Đã tìm:</span>
                {history.slice(0, 5).map(h => (
                  <button key={h} type="button"
                    onClick={() => { setQuery(h); router.push(`/search?q=${encodeURIComponent(h)}`); doSearch(h, undefined, 0, sort) }}
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
                <button type="button" onClick={() => { localStorage.removeItem('anylearn_searches'); setHistory([]) }}
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
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 28, alignItems: 'start' }}>

          {/* Sidebar */}
          <aside style={{
            position: 'sticky', top: 96,
            background: 'white', border: '1px solid #e6edf4',
            borderRadius: 26, padding: 22,
            boxShadow: '0 8px 24px rgba(15,23,42,0.05)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0, color: '#17212f', fontSize: 22, fontWeight: 900 }}>Bộ lọc</h2>
              {(activeCategory || Object.values(filters).some(v => v !== 'all')) && (
                <button onClick={() => {
                  setActiveCategory(undefined)
                  setFilters({ category: 'all', age: 'all', location: 'all', mode: 'all', price: 'all', schedule: 'all' })
                  doSearch(query, undefined, 0, sort)
                }} style={{ border: 0, background: 'transparent', color: '#e73348', fontWeight: 900, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Xóa tất cả
                </button>
              )}
            </div>

            {/* Category filter — searchable list */}
            <div style={{ padding: '16px 0', borderTop: '1px solid #e6edf4' }}>
              <label style={{ display: 'block', fontWeight: 900, color: '#17212f', marginBottom: 9 }}>Lĩnh vực</label>
              <input
                type="search"
                placeholder="Tìm lĩnh vực..."
                value={categorySearch}
                onChange={e => setCategorySearch(e.target.value)}
                style={{
                  width: '100%', minHeight: 38, borderRadius: 10,
                  border: '1px solid #e6edf4', background: '#f7fafc',
                  padding: '0 10px', fontSize: 13, outline: 'none', fontFamily: 'inherit',
                  marginBottom: 8, boxSizing: 'border-box',
                }}
              />
              <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <button type="button"
                  onClick={() => { setActiveCategory(undefined); doSearch(query, undefined, 0, sort) }}
                  style={{
                    textAlign: 'left', padding: '7px 10px', borderRadius: 8, border: 0, cursor: 'pointer',
                    background: !activeCategory ? '#eef7ff' : 'transparent',
                    color: !activeCategory ? '#00539b' : '#2f3b4a',
                    fontWeight: !activeCategory ? 900 : 400, fontSize: 13, fontFamily: 'inherit',
                  }}>Tất cả lĩnh vực</button>
                {categories
                  .filter(c => !categorySearch || c.title.toLowerCase().includes(categorySearch.toLowerCase()))
                  .map(c => (
                    <button key={c.url} type="button"
                      onClick={() => { setActiveCategory(c.url); doSearch(query, c.url, 0, sort) }}
                      style={{
                        textAlign: 'left', padding: '7px 10px', borderRadius: 8, border: 0, cursor: 'pointer',
                        background: activeCategory === c.url ? '#eef7ff' : 'transparent',
                        color: activeCategory === c.url ? '#00539b' : '#2f3b4a',
                        fontWeight: activeCategory === c.url ? 900 : 400, fontSize: 13, fontFamily: 'inherit',
                      }}>{c.title}</button>
                  ))}
              </div>
            </div>

            {[
              { id: 'age', label: 'Độ tuổi', options: ['Tất cả độ tuổi', '3-5 tuổi', '6-10 tuổi', '11-15 tuổi', '16+ tuổi'] },
              { id: 'location', label: 'Khu vực', options: ['Tất cả khu vực', 'TP.HCM', 'Hà Nội', 'Online'] },
              { id: 'mode', label: 'Hình thức học', options: ['Tất cả hình thức', 'Offline', 'Online', 'Hybrid'] },
              { id: 'price', label: 'Học phí', options: ['Tất cả học phí', 'Dưới 2 triệu', '2 - 5 triệu', 'Trên 5 triệu'] },
              { id: 'schedule', label: 'Lịch học', options: ['Tất cả lịch học', 'Cuối tuần', 'Trong tuần', 'Linh hoạt'] },
            ].map(f => (
              <div key={f.id} style={{ padding: '16px 0', borderTop: '1px solid #e6edf4' }}>
                <label htmlFor={f.id} style={{ display: 'block', fontWeight: 900, color: '#17212f', marginBottom: 9 }}>{f.label}</label>
                <select id={f.id}
                  value={filters[f.id as keyof typeof filters]}
                  onChange={e => setFilters(prev => ({ ...prev, [f.id]: e.target.value }))}
                  style={{
                    width: '100%', minHeight: 44, borderRadius: 14,
                    border: '1px solid #e6edf4', background: '#f7fafc',
                    padding: '0 12px', color: '#2f3b4a', outline: 'none', fontFamily: 'inherit',
                  }}>
                  {f.options.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}

            <button onClick={() => {
              setActiveCategory(undefined)
              setFilters({ category: 'all', age: 'all', location: 'all', mode: 'all', price: 'all', schedule: 'all' })
              doSearch(query, undefined, 0, sort)
            }} className="btn btn--outline" style={{ width: '100%', marginTop: 8 }}>
              Xóa bộ lọc
            </button>

          </aside>

          {/* Results */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 18, marginBottom: 18 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 32, fontWeight: 900, color: '#17212f' }}>Kết quả phù hợp</h2>
                <p style={{ color: '#6d7a8a', margin: '4px 0 0' }}>
                  {loading ? 'Đang tìm kiếm...' : searched ? `${total} kết quả` : 'Nhập từ khóa để bắt đầu tìm kiếm'}
                </p>
              </div>
              <select value={sort} onChange={e => { setSort(e.target.value); if (searched) doSearch(query, activeCategory, 0, e.target.value) }}
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
            </div>

            {/* Result grid */}
            {filteredResults.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 20 }}>
                {filteredResults.map(item => (
                  <article key={item.id} style={{
                    display: 'grid', gridTemplateColumns: '150px 1fr', gap: 18,
                    background: 'white', border: '1px solid #e6edf4',
                    borderRadius: 24, padding: 16,
                    boxShadow: '0 8px 24px rgba(15,23,42,0.05)',
                  }}>
                    <div style={{
                      minHeight: 150, borderRadius: 20,
                      background: 'linear-gradient(135deg,#e9fff3,#eef7ff)',
                      display: 'grid', placeItems: 'center',
                      overflow: 'hidden', position: 'relative',
                    }}>
                      {item.image
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
                        : <span style={{ fontSize: 46 }}>📚</span>
                      }
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <h3 style={{ margin: '0 0 8px', color: '#008244', fontSize: 18, fontWeight: 900, lineHeight: 1.3 }}>{item.title}</h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                        {item.subtype && <span style={{ borderRadius: 999, padding: '5px 9px', background: '#e9fff3', color: '#008244', fontSize: 12, fontWeight: 900 }}>{SUBTYPE_LABELS[item.subtype] ?? item.subtype}</span>}
                      </div>
                      {item.shortContent && (
                        <p style={{ color: '#6d7a8a', fontSize: 13, margin: '0 0 10px', flex: 1,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {item.shortContent}
                        </p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 'auto' }}>
                        <span style={{ color: '#e73348', fontWeight: 900, fontSize: 18 }}>{formatPrice(item.price)}</span>
                        <Link href={`/search`} className="btn btn--green" style={{ padding: '9px 16px', fontSize: 13 }}>
                          Xem chi tiết
                        </Link>
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
                    onClick={() => doSearch(query, activeCategory, currentPage - 1, sort)}
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
                      : <button key={i} onClick={() => doSearch(query, activeCategory, i as number, sort)}
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
                    onClick={() => doSearch(query, activeCategory, currentPage + 1, sort)}
                    className="btn btn--outline" style={{ padding: '10px 16px', fontSize: 14 }}>
                    Sau →
                  </button>
                </div>
              )
            })()}

            {/* No results */}
            {searched && !loading && filteredResults.length === 0 && (
              <div style={{
                background: 'white', border: '1px solid #e6edf4',
                borderRadius: 26, padding: 34, textAlign: 'center',
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                <h2 style={{ margin: '0 0 10px', color: '#17212f', fontWeight: 900 }}>Chưa tìm thấy lớp phù hợp</h2>
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
