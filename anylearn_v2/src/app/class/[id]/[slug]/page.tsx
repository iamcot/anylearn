import { getPdpData, getCourseUrl, PdpData, Item, ItemSchedule } from '@/lib/api'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import ScrollRow from '@/components/ScrollRow'
import BackButton from '@/components/BackButton'
import RegisterButton from './RegisterButton'
import FavButton from '@/components/FavButton'
import ReviewsSection from '@/components/ReviewsSection'
import ActivityButton from '@/components/ActivityButton'

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

const WD_LABEL: Record<string, string> = { mon:'Thứ Hai', tue:'Thứ Ba', wed:'Thứ Tư', thu:'Thứ Năm', fri:'Thứ Sáu', sat:'Thứ Bảy', sun:'Chủ Nhật' }
const CYCLE_LABEL: Record<string, string> = { session:'buổi', day:'ngày', week:'tuần', month:'tháng', year:'năm' }
const SCHEDULE_TYPE_LABEL: Record<string, string> = { recurring:'Lớp cố định', event:'Một buổi', open:'Khai giảng linh hoạt' }

function formatSchedule(s: ItemSchedule) {
  if (s.scheduleType === 'event' && s.eventDate) {
    const d = new Date(s.eventDate).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
    return `${d}${s.timeStart ? ` · ${s.timeStart}${s.timeEnd ? '–'+s.timeEnd : ''}` : ''}`
  }
  const days = s.weekdays ? s.weekdays.split(',').map(d => WD_LABEL[d] ?? d).join(' ') : ''
  const time = s.timeStart ? `${s.timeStart}${s.timeEnd ? '–'+s.timeEnd : ''}` : ''
  const from = s.dateStart ? `từ ${new Date(s.dateStart).toLocaleDateString('vi-VN')}` : ''
  return [days, time, from].filter(Boolean).join(' · ')
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

  const { item, author, categories, reviews, rating, num_favorite, authorItems, hotItems, is_fav } = data
  const schedules: ItemSchedule[] = data.schedules ?? []
  const enrolledCount = data.enrolled_count ?? 0
  const content = parseContent(item.content)
  const ageLabel = formatAge(item.agesMin, item.agesMax)
  const hasDiscount = !!(item.orgPrice && item.orgPrice > item.price)
  const discountPct = hasDiscount ? Math.round((1 - item.price / item.orgPrice!) * 100) : null

  return (
    <>
      {/* ── Hero ── */}
      <section className="section--soft pt-10 pb-10">
        <div className="container">
          <BackButton />
          <div className="pdp-hero">
            <div className="pdp-image aspect-square rounded-card overflow-hidden bg-[linear-gradient(135deg,#dff7e8,#e7f3ff)] relative">
              {item.image
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={item.image} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
                : <div className="w-full h-full grid place-items-center text-[64px]">📚</div>
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

              <h1 className="m-0 mb-3 text-[clamp(18px,2.5vw,26px)] font-black text-ink leading-[1.2]">
                {item.title}
              </h1>

              {/* Fav + Rating row — below title */}
              <div className="flex items-center gap-4 mb-[14px] flex-wrap">
                <FavButton itemId={item.id} initialFaved={is_fav} initialCount={num_favorite} />
                <a href="#reviews-section" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {rating != null && rating > 0 ? (
                    <>
                      <span style={{ fontSize: 14, color: '#f5a623', letterSpacing: 1 }}>
                        {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#333' }}>{rating.toFixed(1)}</span>
                      <span style={{ fontSize: 12, color: '#9aa5b1' }}>({reviews.length})</span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: 14, color: '#ccc', letterSpacing: 1 }}>☆☆☆☆☆</span>
                      <span style={{ fontSize: 12, color: '#9aa5b1' }}>Chưa có đánh giá</span>
                    </>
                  )}
                </a>
              </div>

              {item.shortContent && (
                <p className="text-muted mb-5 leading-[1.6]">{item.shortContent}</p>
              )}

              <div className="pdp-meta-grid">
                {ageLabel && (
                  <div className="pdp-meta-item">
                    <span className="pdp-meta-label">Độ tuổi</span>
                    <span className="pdp-meta-value">{ageLabel}</span>
                  </div>
                )}
                {item.seats != null && item.seats > 0 && (
                  <div className="pdp-meta-item">
                    <span className="pdp-meta-label">Số chỗ còn lại</span>
                    <span className="pdp-meta-value">
                      {Math.max(0, item.seats - enrolledCount)}/{item.seats} học viên
                    </span>
                  </div>
                )}
                {(item.cycleAmount || item.cycleType) && (
                  <div className="pdp-meta-item">
                    <span className="pdp-meta-label">Chu kỳ học</span>
                    <span className="pdp-meta-value">
                      {item.cycleAmount ? `${item.cycleAmount} ` : ''}{item.cycleType ? (CYCLE_LABEL[item.cycleType] ?? item.cycleType) : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* Schedules */}
              {schedules.length > 0 && (
                <div className="mt-4 mb-1">
                  <div className="text-xs font-bold text-muted uppercase tracking-wide mb-2">Lịch học</div>
                  <div className="flex flex-col gap-2">
                    {schedules.map(s => (
                      <div key={s.id} className="flex items-start gap-2 text-sm">
                        
                        <div>
                          {s.title && <div className="font-bold text-ink">{s.title} <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, flexShrink: 0, marginTop: 2,
                          background: s.scheduleType === 'event' ? '#f3e8ff' : s.scheduleType === 'open' ? '#dcfce7' : '#e7f3ff',
                          color: s.scheduleType === 'event' ? '#7c3aed' : s.scheduleType === 'open' ? '#15803d' : '#00539b',
                        }}>
                          {SCHEDULE_TYPE_LABEL[s.scheduleType ?? ''] ?? s.scheduleType}
                        </span></div>}
                          
                          <div className="text-muted text-xs">{formatSchedule(s)}</div>
                          {s.locationNote && <div className="text-muted text-xs">{s.locationNote}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Feature checkmarks */}
              {(item.allowReRegister === 1 || item.activiyTrial === 1 || item.activiyTest === 1 || item.activiyVisit === 1) && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                  {item.activiyTrial === 1 && (
                    <span className="text-xs text-[#008244] flex items-center gap-1"><span style={{color:'#00a651',fontWeight:900}}>✓</span> Có học thử</span>
                  )}
                  {item.activiyTest === 1 && (
                    <span className="text-xs text-[#008244] flex items-center gap-1"><span style={{color:'#00a651',fontWeight:900}}>✓</span> Có test đầu vào</span>
                  )}
                  {item.activiyVisit === 1 && (
                    <span className="text-xs text-[#008244] flex items-center gap-1"><span style={{color:'#00a651',fontWeight:900}}>✓</span> Có tham quan</span>
                  )}
                </div>
              )}

              <div className="my-6 flex items-baseline gap-3 flex-wrap">
                <span className="text-[32px] font-black text-red">{formatPrice(item.price)}</span>
                {hasDiscount && (
                  <>
                    <span className="text-lg text-[#9aa5b1] line-through">{formatPrice(item.orgPrice!)}</span>
                    <span className="rounded-full py-1 px-2.5 bg-red text-white text-xs font-black">-{discountPct}%</span>
                  </>
                )}
              </div>

              <RegisterButton itemId={item.id} />
              <ActivityButton itemId={item.id}
                activiyTrial={item.activiyTrial} activiyTest={item.activiyTest} activiyVisit={item.activiyVisit} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Tác giả ── */}
      {author && (
        <section className="section">
          <div className="container">
            <span className="section-kicker">{author.role === 'teacher' ? 'Chuyên gia' : 'Trường học'}</span>
            <h2 className="section-title mb-6">{author.name}</h2>
            <div className={`flex gap-6 items-start flex-wrap ${authorItems.length ? 'mb-10' : ''}`}>
              <div className="w-[120px] aspect-square rounded-card overflow-hidden shrink-0 bg-[linear-gradient(135deg,#eef7ff,#e9fff3)] grid place-items-center relative">
                {author.image
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={author.image} alt={author.name} className="absolute inset-0 w-full h-full object-cover" />
                  : <span className="text-[48px]">{author.role === 'teacher' ? '👨‍🏫' : '🏫'}</span>
                }
              </div>
              <div className="flex-1 min-w-[200px]">
                {author.introduce && <p className="m-0 mb-4 text-muted leading-[1.7]">{author.introduce}</p>}
                <Link href={`/search?mode=class&authorId=${author.id}`} className="btn btn--outline text-sm">
                  Xem tất cả khóa học →
                </Link>
              </div>
            </div>

            {authorItems.length > 0 && (
              <>
                <h3 className="section-kicker mb-4">Các khóa học khác</h3>
                <ScrollRow>
                  {(authorItems as Item[]).map(it => (
                    <Link key={it.id} href={getCourseUrl(it)} className="pdp-scroll-card no-underline">
                      <div className="aspect-square rounded-[14px] overflow-hidden bg-[linear-gradient(135deg,#dff7e8,#e7f3ff)] relative mb-[10px]">
                        {it.image
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={it.image} alt={it.title} className="absolute inset-0 w-full h-full object-cover" />
                          : <div className="w-full h-full grid place-items-center text-[32px]">📚</div>
                        }
                      </div>
                      <div className="text-sm font-black text-green-dark leading-[1.3] mb-[6px] line-clamp-2">
                        {it.title}
                      </div>
                      <div className="text-[15px] font-black text-red">{formatPrice(it.price)}</div>
                    </Link>
                  ))}
                </ScrollRow>
              </>
            )}
          </div>
        </section>
      )}

      {/* ── Đánh giá ── */}
      <section className="section section--soft" id="reviews-section">
        <div className="container">
          <h2 className="section-kicker mb-5">Đánh giá từ học viên</h2>

          <ReviewsSection itemId={item.id} initialReviews={reviews} initialRating={rating} />
        </div>
      </section>

      {/* ── Nội dung ── */}
      {content.content_advantage && (
        <section className="section">
          <div className="container">
          <h2 className="section-kicker mb-5">Thông tin khóa học</h2>
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
                <Link key={it.id} href={getCourseUrl(it)} className="no-underline">
                  <article className="bg-white border border-line rounded-[18px] overflow-hidden shadow-[0_6px_18px_rgba(15,23,42,0.06)]">
                    <div className="aspect-square bg-[linear-gradient(135deg,#dff7e8,#e7f3ff)] relative overflow-hidden">
                      {it.image
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={it.image} alt={it.title} className="absolute inset-0 w-full h-full object-cover" />
                        : <div className="w-full h-full grid place-items-center text-[32px]">📚</div>
                      }
                    </div>
                    <div className="px-3.5 py-3">
                      <div className="text-xs font-black text-green-dark leading-[1.3] mb-[6px] line-clamp-2">
                        {it.title}
                      </div>
                      <div className="text-sm font-black text-red">{formatPrice(it.price)}</div>
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
