import { getPdpData, getCourseUrl, PdpData, Item } from '@/lib/api'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import ScrollRow from '@/components/ScrollRow'
import BackButton from '@/components/BackButton'
import RegisterButton from './RegisterButton'

const SUBTYPE_LABELS: Record<string, string> = {
  extra: 'Ngoại khóa', offline: 'Học trực tiếp', online: 'Học online',
  digital: 'Kỹ thuật số', video: 'Video', preschool: 'Mầm non',
}

function formatPrice(p: number) {
  if (!p) return 'Liên hệ'
  if (p >= 1_000_000) return `${(p / 1_000_000).toFixed(1).replace('.0', '')} triệu`
  return p.toLocaleString('vi-VN') + ' đ'
}

function formatAge(min?: number, max?: number) {
  if (!min && !max) return null
  if (!max || max >= 99) return `Từ ${min} tuổi`
  if (!min) return `Đến ${max} tuổi`
  return `${min} – ${max} tuổi`
}

function parseContent(raw?: string) {
  if (!raw) return {} as Record<string, string>
  try { return JSON.parse(raw) as Record<string, string> } catch { return { content_advantage: raw } }
}

type Props = { params: Promise<{ id: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const data = await getPdpData(Number(id))
  if (!data) return {}
  const item = data.item
  return {
    title: item.seoTitle || item.title,
    description: item.seoDesc || item.shortContent || '',
    openGraph: { images: item.image ? [item.image] : [] },
  }
}

export default async function PdpPage({ params }: Props) {
  const { id } = await params
  const data: PdpData | null = await getPdpData(Number(id))
  if (!data) notFound()

  const { item, author, categories, reviews, rating, num_favorite, authorItems, hotItems } = data
  const content = parseContent(item.content)
  const ageLabel = formatAge(item.agesMin, item.agesMax)
  const hasDiscount = item.orgPrice && item.orgPrice > item.price
  const discountPct = hasDiscount ? Math.round((1 - item.price / item.orgPrice!) * 100) : null

  return (
    <>
      {/* ── Hero ── */}
      <section className="section--soft" style={{ paddingTop: 40, paddingBottom: 40 }}>
        <div className="container">
          <BackButton />
          <div className="pdp-hero">
            <div className="pdp-image" style={{ aspectRatio: '1/1', borderRadius: 20, overflow: 'hidden', background: 'linear-gradient(135deg,#dff7e8,#e7f3ff)', position: 'relative' }}>
              {item.image
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={item.image} alt={item.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontSize: 64 }}>📚</div>
              }
            </div>

            <div className="pdp-info-card">
              <div className="flex flex-wrap gap-2 mb-3">
                {item.subtype && (
                  <span className="rounded-full px-3 py-1 bg-[#e9fff3] text-[#008244] text-xs font-black">
                    {SUBTYPE_LABELS[item.subtype] ?? item.subtype}
                  </span>
                )}
                {categories.map(c => (
                  <Link key={c.url} href={`/search?category=${c.url}`}
                    className="rounded-full px-3 py-1 bg-[#eef7ff] text-[#00539b] text-xs font-black no-underline">
                    {c.title}
                  </Link>
                ))}
              </div>

              <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(22px,3vw,34px)', fontWeight: 900, color: '#17212f', lineHeight: 1.15 }}>
                {item.title}
              </h1>

              {rating != null ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                  <span style={{ color: '#ffca05', fontSize: 16, letterSpacing: 1 }}>
                    {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
                  </span>
                  <span style={{ fontWeight: 900, color: '#17212f' }}>{rating.toFixed(1)}</span>
                  <span style={{ color: '#6d7a8a', fontSize: 13 }}>({reviews.length} đánh giá)</span>
                  {num_favorite > 0 && (
                    <>
                      <span style={{ color: '#9aa5b1' }}>·</span>
                      <span style={{ color: '#6d7a8a', fontSize: 13 }}>❤️ {num_favorite}</span>
                    </>
                  )}
                </div>
              ) : num_favorite > 0 ? (
                <div style={{ marginBottom: 14, color: '#6d7a8a', fontSize: 13 }}>❤️ {num_favorite} yêu thích</div>
              ) : null}

              {item.shortContent && (
                <p style={{ color: '#6d7a8a', marginBottom: 20, lineHeight: 1.6 }}>{item.shortContent}</p>
              )}

              <div className="pdp-meta-grid">
                {item.locationType && (
                  <div className="pdp-meta-item">
                    <span className="pdp-meta-label">Hình thức</span>
                    <span className="pdp-meta-value">{SUBTYPE_LABELS[item.locationType] ?? item.locationType}</span>
                  </div>
                )}
                {ageLabel && (
                  <div className="pdp-meta-item">
                    <span className="pdp-meta-label">Độ tuổi</span>
                    <span className="pdp-meta-value">{ageLabel}</span>
                  </div>
                )}
                {item.dateStart && (
                  <div className="pdp-meta-item">
                    <span className="pdp-meta-label">Khai giảng</span>
                    <span className="pdp-meta-value">{new Date(item.dateStart).toLocaleDateString('vi-VN')}</span>
                  </div>
                )}
                {item.timeStart && (
                  <div className="pdp-meta-item">
                    <span className="pdp-meta-label">Giờ học</span>
                    <span className="pdp-meta-value">{item.timeStart}{item.timeEnd ? ` – ${item.timeEnd}` : ''}</span>
                  </div>
                )}
                {item.seats && (
                  <div className="pdp-meta-item">
                    <span className="pdp-meta-label">Số chỗ</span>
                    <span className="pdp-meta-value">{item.seats} học viên</span>
                  </div>
                )}
                {item.location && (
                  <div className="pdp-meta-item" style={{ gridColumn: '1/-1' }}>
                    <span className="pdp-meta-label">Địa điểm</span>
                    <span className="pdp-meta-value">{item.location}</span>
                  </div>
                )}
              </div>

              <div style={{ margin: '24px 0', display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: '#e73348' }}>{formatPrice(item.price)}</span>
                {hasDiscount && (
                  <>
                    <span style={{ fontSize: 18, color: '#9aa5b1', textDecoration: 'line-through' }}>{formatPrice(item.orgPrice!)}</span>
                    <span style={{ borderRadius: 999, padding: '4px 10px', background: '#e73348', color: 'white', fontSize: 13, fontWeight: 900 }}>-{discountPct}%</span>
                  </>
                )}
              </div>

              <RegisterButton itemId={item.id} />
              <button className="btn btn--outline" style={{ width: '100%', marginTop: 10 }}>
                Nhận tư vấn miễn phí
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tác giả ── */}
      {author && (
        <section className="section">
          <div className="container">
            <span className="section-kicker">{author.role === 'teacher' ? 'Chuyên gia' : 'Trường học'}</span>
            <h2 className="section-title" style={{ marginBottom: 24 }}>{author.name}</h2>
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: authorItems.length ? 40 : 0 }}>
              <div style={{ width: 120, aspectRatio: '1/1', borderRadius: 20, overflow: 'hidden', flexShrink: 0, background: 'linear-gradient(135deg,#eef7ff,#e9fff3)', display: 'grid', placeItems: 'center', position: 'relative' }}>
                {author.image
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={author.image} alt={author.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 48 }}>{author.role === 'teacher' ? '👨‍🏫' : '🏫'}</span>
                }
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                {author.introduce && <p style={{ margin: '0 0 16px', color: '#6d7a8a', lineHeight: 1.7 }}>{author.introduce}</p>}
                <Link href={`/search?mode=class&authorId=${author.id}`} className="btn btn--outline" style={{ fontSize: 14 }}>
                  Xem tất cả khóa học →
                </Link>
              </div>
            </div>

            {authorItems.length > 0 && (
              <>
                <h3 style={{ margin: '0 0 16px', fontWeight: 900, color: '#17212f', fontSize: 18 }}>Các khóa học khác</h3>
                <ScrollRow>
                  {(authorItems as Item[]).map(it => (
                    <Link key={it.id} href={getCourseUrl(it)} className="pdp-scroll-card" style={{ textDecoration: 'none' }}>
                      <div style={{ aspectRatio: '1/1', borderRadius: 14, overflow: 'hidden', background: 'linear-gradient(135deg,#dff7e8,#e7f3ff)', position: 'relative', marginBottom: 10 }}>
                        {it.image
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={it.image} alt={it.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontSize: 32 }}>📚</div>
                        }
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: '#008244', lineHeight: 1.3, marginBottom: 6,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {it.title}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: '#e73348' }}>{formatPrice(it.price)}</div>
                    </Link>
                  ))}
                </ScrollRow>
              </>
            )}
          </div>
        </section>
      )}

      {/* ── Đánh giá ── */}
      {reviews.length > 0 && (
        <section className="section section--soft">
          <div className="container">
            <span className="section-kicker">Phản hồi</span>
            <div style={{ marginBottom: 28 }}>
              <h2 className="section-title">Đánh giá từ học viên</h2>
              {rating != null && (
                <p style={{ margin: '8px 0 0', color: '#6d7a8a' }}>
                  ⭐ <strong>{rating.toFixed(1)}</strong> / 5 · {reviews.length} đánh giá
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.slice(0, 6).map((r, i) => (
                <div key={i} style={{ background: 'white', border: '1px solid #e6edf4', borderRadius: 18, padding: 20, boxShadow: '0 4px 12px rgba(15,23,42,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    {r.user_image
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={r.user_image} alt={r.user_name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                      : <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#eef7ff,#e9fff3)', display: 'grid', placeItems: 'center', fontSize: 18 }}>👤</div>
                    }
                    <div>
                      <div style={{ fontWeight: 900, color: '#17212f', fontSize: 15 }}>{r.user_name}</div>
                      <div style={{ color: '#ffca05', fontSize: 13 }}>{'★'.repeat(Math.round(Number(r.value)))}</div>
                    </div>
                  </div>
                  {r.extra_value && <p style={{ margin: 0, color: '#2f3b4a', fontSize: 14, lineHeight: 1.6 }}>{r.extra_value}</p>}
                </div>
              ))}
            </div>
            {reviews.length > 6 && (
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <button className="btn btn--outline">Xem tất cả {reviews.length} đánh giá</button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Nội dung ── */}
      {content.content_advantage && (
        <section className="section">
          <div className="container" style={{ maxWidth: 860 }}>
            <span className="section-kicker">Nội dung</span>
            <h2 className="section-title" style={{ marginBottom: 24 }}>Thông tin khóa học</h2>
            <div className="pdp-content"
              dangerouslySetInnerHTML={{ __html: content.content_advantage }} />
          </div>
        </section>
      )}

      {/* ── Khóa học tương tự ── */}
      {hotItems.length > 0 && (
        <section className="section section--soft">
          <div className="container">
            <span className="section-kicker">Khám phá thêm</span>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
              {(hotItems as Item[]).map(it => (
                <Link key={it.id} href={getCourseUrl(it)} style={{ textDecoration: 'none' }}>
                  <article style={{ background: 'white', border: '1px solid #e6edf4', borderRadius: 18, overflow: 'hidden', boxShadow: '0 6px 18px rgba(15,23,42,0.06)' }}>
                    <div style={{ aspectRatio: '1/1', background: 'linear-gradient(135deg,#dff7e8,#e7f3ff)', position: 'relative', overflow: 'hidden' }}>
                      {it.image
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={it.image} alt={it.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontSize: 32 }}>📚</div>
                      }
                    </div>
                    <div style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: '#008244', lineHeight: 1.3, marginBottom: 6,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {it.title}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: '#e73348' }}>{formatPrice(it.price)}</div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
