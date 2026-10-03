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

              <h1 className="m-0 mb-3 text-[clamp(22px,3vw,34px)] font-black text-ink leading-[1.15]">
                {item.title}
              </h1>

              {rating != null ? (
                <div className="flex items-center gap-2 mb-[14px] flex-wrap">
                  <span className="text-yellow text-base tracking-[1px]">
                    {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
                  </span>
                  <span className="font-black text-ink">{rating.toFixed(1)}</span>
                  <span className="text-muted text-xs">({reviews.length} đánh giá)</span>
                  {num_favorite > 0 && (
                    <>
                      <span className="text-[#9aa5b1]">·</span>
                      <span className="text-muted text-xs">❤️ {num_favorite}</span>
                    </>
                  )}
                </div>
              ) : num_favorite > 0 ? (
                <div className="mb-[14px] text-muted text-xs">❤️ {num_favorite} yêu thích</div>
              ) : null}

              {item.shortContent && (
                <p className="text-muted mb-5 leading-[1.6]">{item.shortContent}</p>
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
                  <div className="pdp-meta-item col-span-full">
                    <span className="pdp-meta-label">Địa điểm</span>
                    <span className="pdp-meta-value">{item.location}</span>
                  </div>
                )}
              </div>

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
              <button className="btn btn--outline w-full mt-[10px]">
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
                <h3 className="m-0 mb-4 font-black text-ink text-lg">Các khóa học khác</h3>
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
      {reviews.length > 0 && (
        <section className="section section--soft">
          <div className="container">
            <span className="section-kicker">Phản hồi</span>
            <div className="mb-7">
              <h2 className="section-title">Đánh giá từ học viên</h2>
              {rating != null && (
                <p className="mt-2 mb-0 text-muted">
                  ⭐ <strong>{rating.toFixed(1)}</strong> / 5 · {reviews.length} đánh giá
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.slice(0, 6).map((r, i) => (
                <div key={i} className="bg-white border border-line rounded-[18px] p-5 shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
                  <div className="flex items-center gap-3 mb-3">
                    {r.user_image
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={r.user_image} alt={r.user_name} className="w-10 h-10 rounded-full object-cover" />
                      : <div className="w-10 h-10 rounded-full bg-[linear-gradient(135deg,#eef7ff,#e9fff3)] grid place-items-center text-lg">👤</div>
                    }
                    <div>
                      <div className="font-black text-ink text-[15px]">{r.user_name}</div>
                      <div className="text-yellow text-xs">{'★'.repeat(Math.round(Number(r.value)))}</div>
                    </div>
                  </div>
                  {r.extra_value && <p className="m-0 text-text text-sm leading-[1.6]">{r.extra_value}</p>}
                </div>
              ))}
            </div>
            {reviews.length > 6 && (
              <div className="text-center mt-6">
                <button className="btn btn--outline">Xem tất cả {reviews.length} đánh giá</button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Nội dung ── */}
      {content.content_advantage && (
        <section className="section">
          <div className="container max-w-[860px]">
            <span className="section-kicker">Nội dung</span>
            <h2 className="section-title mb-6">Thông tin khóa học</h2>
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
