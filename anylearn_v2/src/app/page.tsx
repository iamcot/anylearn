import SearchCard from '@/components/SearchCard'
import CourseCard from '@/components/CourseCard'
import { getHomeV2, Category } from '@/lib/api'
import Link from 'next/link'

const CATEGORY_EMOJIS: Record<string, string> = {
  'tieng-anh': '🇬🇧', 'ielts': '📝', 'ky-nang-song': '🎤',
  'tam-ly-hoc-duong': '🧠', 'mam-non-tu-thuc': '🏫', 'mam-non-song-ngu': '🌏',
  'mam-non-quoc-te': '🌍', 'toan-hoc': '📐', 'toan-pho-thong': '📘',
  'ngoai-ngu': '💬', 'tai-chinh': '💰', 'cam-thu-am-nhac': '🎵',
  'toan-cambridge': '🔢',
}
const DEFAULT_EMOJI = '📚'

const BENEFITS = [
  { emoji: '🔎', title: 'Dễ tìm kiếm', desc: 'Tìm trường học, khóa học và chuyên gia theo nhu cầu của con' },
  { emoji: '💬', title: 'Tư vấn miễn phí', desc: 'Nhận tư vấn từ chuyên gia giáo dục không mất phí' },
  { emoji: '⚡', title: 'Đăng ký nhanh', desc: 'Đặt lịch và thanh toán trực tuyến trong vài phút' },
  { emoji: '🎁', title: 'Tiết kiệm hơn', desc: 'Nhiều ưu đãi độc quyền và chương trình khuyến mãi' },
]

export default async function HomePage() {
  const homeData = await getHomeV2()
  const featuredItems = homeData?.home_classes?.flatMap(b => b.classes ?? []).slice(0, 8) ?? []
  const categories: Category[] = homeData?.categories?.slice(0, 10) ?? []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const articles: any[] = (homeData as any)?.articles?.slice(0, 3) ?? []
  const events = homeData?.events?.slice(0, 3) ?? []

  return (
    <>
      {/* ── Hero ── */}
      <section style={{
        minHeight: 650,
        background: 'linear-gradient(135deg, #00539b, #00a651)',
        color: 'white',
        display: 'flex', alignItems: 'center',
        padding: '80px 0 140px',
      }}>
        <div className="container">
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            borderRadius: 999, padding: '8px 14px',
            background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.24)',
            fontSize: 14, fontWeight: 900, marginBottom: 18,
          }}>Nền tảng booking giáo dục cho phụ huynh</span>

          <h1 style={{
            fontSize: 'clamp(38px,5.4vw,66px)', fontWeight: 900,
            lineHeight: 1.02, letterSpacing: -1.6, margin: '0 0 18px',
            maxWidth: 800,
          }}>
            Tìm khóa học, trường học và chuyên gia phù hợp cho con
          </h1>

          <p style={{ fontSize: 18, margin: '0 0 32px', color: 'rgba(255,255,255,0.9)', maxWidth: 640 }}>
            anyLEARN giúp phụ huynh tìm kiếm, so sánh, nhận tư vấn và đăng ký chương trình học chính quy, ngoại khóa, online và offline dễ dàng hơn
          </p>

          <SearchCard variant="home" initialTags={categories.slice(0, 6).map(c => ({ label: c.title, categoryUrl: c.url }))} />
        </div>
      </section>

      {/* ── Benefits overlap ── */}
      <div style={{ marginTop: -56, position: 'relative', zIndex: 5 }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            {BENEFITS.map(b => (
              <article key={b.title} style={{
                background: 'white', border: '1px solid #e6edf4',
                borderRadius: 22, padding: 24,
                boxShadow: '0 10px 26px rgba(15,23,42,0.08)',
              }}>
                <div className="feature-icon">{b.emoji}</div>
                <h3 style={{ margin: '0 0 8px', color: '#17212f', fontSize: 20, fontWeight: 900 }}>{b.title}</h3>
                <p style={{ margin: 0, color: '#6d7a8a', fontSize: 14.5 }}>{b.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </div>

      {/* ── Promo ── */}
      <section className="section">
        <div className="container">
          <div style={{
            borderRadius: 32,
            background: 'linear-gradient(100deg, rgba(0,65,120,0.96), rgba(0,166,81,0.82))',
            color: 'white',
            display: 'grid', gridTemplateColumns: '1.2fr 0.8fr',
            minHeight: 300,
            boxShadow: '0 10px 26px rgba(15,23,42,0.08)',
            overflow: 'hidden',
          }}>
            <div style={{ padding: 38 }}>
              <span style={{
                display: 'inline-flex', padding: '7px 11px', borderRadius: 999,
                background: 'rgba(255,255,255,0.16)', fontWeight: 900, marginBottom: 16, fontSize: 14,
              }}>Chương trình nổi bật</span>
              <h2 style={{ margin: '0 0 12px', fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, lineHeight: 1.08 }}>
                11 ON FIELD - Tìm kiếm 11 người ra sân
              </h2>
              <p style={{ margin: '0 0 20px', maxWidth: 630, color: 'rgba(255,255,255,0.9)' }}>
                Chương trình tuyển sinh thể thao dành cho các bạn trẻ yêu bóng đá, mong muốn thử sức trong một hành trình huấn luyện và phát triển bản thân
              </p>
              <Link href="/search?q=bóng đá" className="btn btn--yellow">Tìm hiểu chương trình</Link>
            </div>
            <div style={{ display: 'grid', placeItems: 'center', padding: 28 }}>
              <div style={{
                width: 'min(240px,100%)', aspectRatio: '1/1', borderRadius: 36,
                border: '2px solid rgba(255,255,255,0.35)',
                background: 'rgba(255,255,255,0.12)',
                display: 'grid', placeItems: 'center',
                textAlign: 'center', fontSize: 48, fontWeight: 900, color: '#ffca05', lineHeight: 1.1,
              }}>11<br />ON<br />FIELD</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="section section--soft">
        <div className="container section-head">
          <div>
            <span className="section-kicker">Bắt đầu theo nhu cầu</span>
            <h2 className="section-title">Chọn nhanh nhóm học phù hợp</h2>
            <p className="section-desc">Khám phá các nhóm chương trình theo mục tiêu học tập, độ tuổi và sở thích của con</p>
          </div>
        </div>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 16 }}>
          {categories.map(cat => (
            <article key={cat.id} style={{
              background: 'white', border: '1px solid #e6edf4',
              borderRadius: 22, padding: 24, minHeight: 218,
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              boxShadow: '0 8px 24px rgba(15,23,42,0.05)',
            }}>
              <div>
                <div className="icon-square">{CATEGORY_EMOJIS[cat.url] ?? DEFAULT_EMOJI}</div>
                <h3 style={{ margin: '0 0 8px', color: '#00539b', fontSize: 21, fontWeight: 900 }}>{cat.title}</h3>
              </div>
              <Link href={`/search?category=${cat.url}`} style={{ color: '#008244', fontWeight: 900, marginTop: 18, textDecoration: 'none' }}>
                Xem lớp →
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* ── Featured courses ── */}
      <section className="section">
        <div className="container section-head">
          <div>
            <span className="section-kicker">Khóa học nổi bật</span>
            <h2 className="section-title">Khóa học nổi bật dành cho học viên</h2>
            <p className="section-desc">Dễ dàng xem độ tuổi phù hợp, hình thức học, khu vực, học phí và lựa chọn tư vấn trước khi đăng ký</p>
          </div>
          <Link href="/search" className="btn btn--outline">Xem tất cả</Link>
        </div>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
          {featuredItems.length > 0
            ? featuredItems.map(item => <CourseCard key={item.id} item={item} />)
            : Array.from({ length: 4 }).map((_, i) => (
                <article key={i} style={{
                  background: 'white', border: '1px solid #e6edf4',
                  borderRadius: 22, overflow: 'hidden',
                }}>
                  <div style={{ minHeight: 165, background: 'linear-gradient(135deg,#dff7e8,#e7f3ff)', display: 'grid', placeItems: 'center' }}>
                    <span style={{ fontSize: 46 }}>📚</span>
                  </div>
                  <div style={{ padding: 18 }}>
                    <div style={{ height: 16, background: '#f0f0f0', borderRadius: 8, marginBottom: 10 }} />
                    <div style={{ height: 12, background: '#f0f0f0', borderRadius: 8, width: '70%' }} />
                  </div>
                </article>
              ))
          }
        </div>
      </section>

      {/* ── Promotions (static) ── */}
      <section className="section section--soft">
        <div className="container section-head">
          <div>
            <span className="section-kicker">Dành riêng cho phụ huynh</span>
            <h2 className="section-title">Ưu đãi học tập dành riêng cho phụ huynh</h2>
            <p className="section-desc">Cập nhật các chương trình tư vấn, kiểm tra năng lực và thanh toán linh hoạt từ anyLEARN</p>
          </div>
        </div>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
          {events.map(e => (
            <article key={e.id} style={{
              borderRadius: 22, overflow: 'hidden',
              background: 'white', border: '1px solid #e6edf4',
              boxShadow: '0 8px 24px rgba(15,23,42,0.06)',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{
                minHeight: 190,
                background: 'linear-gradient(135deg, #00539b, #00a651)',
                color: 'white',
                display: 'grid', placeItems: 'center',
                padding: 24, textAlign: 'center',
                fontSize: 28, fontWeight: 900, lineHeight: 1.2,
              }}>{e.title}</div>
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', flex: 1 }}>
                {e.shortContent && (
                  <p style={{ margin: '0 0 16px', color: '#6d7a8a', flex: 1 }}>{e.shortContent}</p>
                )}
                <Link href="/search" className="btn btn--green" style={{ marginTop: 'auto' }}>Xem chi tiết</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Articles ── */}
      {articles.length > 0 && (
        <section className="section">
          <div className="container section-head">
            <div>
              <span className="section-kicker">Kiến thức giáo dục</span>
              <h2 className="section-title">Học và hỏi cùng anyLEARN</h2>
              <p className="section-desc">Khám phá các bài viết hữu ích về giáo dục, kỹ năng và hành trình học tập của con</p>
            </div>
            <Link href="/search" className="btn btn--outline">Xem tất cả bài viết</Link>
          </div>
          <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
            {articles.map((a: any) => (
              <article key={a.id} style={{
                background: 'white', border: '1px solid #e6edf4',
                borderRadius: 22, overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(15,23,42,0.06)',
                display: 'flex', flexDirection: 'column',
              }}>
                <div style={{
                  minHeight: 160, background: 'linear-gradient(135deg, #eef7ff, #e9fff3)',
                  display: 'grid', placeItems: 'center', position: 'relative', overflow: 'hidden',
                }}>
                  {a.image
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={a.image} alt={a.title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
                    : <span style={{ fontSize: 46 }}>📚</span>
                  }
                  <span style={{
                    position: 'absolute', top: 12, left: 12,
                    background: '#00539b', color: 'white',
                    borderRadius: 999, padding: '5px 10px',
                    fontSize: 11, fontWeight: 900, textTransform: 'uppercase',
                  }}>{a.type === 'video' ? '🎬 Video' : '📖 Bài viết'}</span>
                </div>
                <div style={{ padding: 20, display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3 style={{ margin: '0 0 10px', color: '#17212f', fontSize: 17, fontWeight: 900, lineHeight: 1.4 }}>{a.title}</h3>
                  {a.short_content && (
                    <p style={{
                      margin: '0 0 16px', color: '#6d7a8a', fontSize: 14, flex: 1,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>{a.short_content}</p>
                  )}
                  <Link href={`/search`} style={{ color: '#008244', fontWeight: 900, fontSize: 14, textDecoration: 'none', marginTop: 'auto' }}>
                    Đọc thêm →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
