import { getPdpData, getPointsPreview, getCourseUrl, searchItems, PdpData, Item, ItemSchedule } from '@/lib/api'
import Link from 'next/link'
import ScrollRow from '@/components/ScrollRow'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import BackButton from '@/components/BackButton'
import RegisterButton from './RegisterButton'
import PointsRewardBadge from '@/components/points/PointsRewardBadge'
import PromiseStrip from '@/components/promise/PromiseStrip'
import CollectVouchers from '@/components/vouchers/CollectVouchers'
import FoundationItemLine from '@/components/foundation/FoundationItemLine'
import ReportPriceButton from '@/components/promise/ReportPriceButton'
import FavButton from '@/components/FavButton'
import ReviewsSection from '@/components/ReviewsSection'
import PathwayBlock from '@/components/recommendations/PathwayBlock'
import ItemCollections from '@/components/pdp/ItemCollections'
import TrackItemView from '@/components/pdp/TrackItemView'
import StickyAside from '@/components/pdp/StickyAside'
import CollapsibleContent from '@/components/pdp/CollapsibleContent'
import ActivityButton from '@/components/ActivityButton'
import ChevronLabel from '@/components/ChevronLabel'
import StarRating from '@/components/StarRating'
import { BookIcon, CheckIcon, SchoolIcon, UserIcon } from '@/components/icons'
import { formatPrice } from '@/lib/format/price'
import { CYCLE_LABELS, SUBTYPE_LABELS } from '@/config/itemLabels'
import { formatSchedule } from '@/lib/format/schedule'
import CompareToggle from '@/components/compare/CompareToggle'
import CompareWhenActive from '@/components/compare/CompareWhenActive'
import VideoOutline, { VideoHeroCta, VideoRegisterButton } from '@/components/learn/VideoOutline'
import { detailMeta } from '@/lib/seo/shareMeta'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbLd, courseLd } from '@/lib/seo/jsonLd'
import { siteOrigin } from '@/lib/achievements/share'

function formatAge(min?: number, max?: number) {
  if (!min && !max) return null
  if (!max || max >= 99) return `Từ ${min} tuổi`
  if (!min) return `Đến ${max} tuổi`
  return `${min} – ${max} tuổi`
}

const SCHEDULE_TYPE_LABEL: Record<string, string> = { recurring:'Lớp cố định', event:'Một buổi', open:'Khai giảng linh hoạt' }
const SCHEDULE_BADGE_CLASS: Record<string, string> = {
  recurring: 'bg-blue-soft text-blue',
  event: 'bg-warn-soft text-warn-text',
  open: 'bg-green-soft text-green-dark',
}
const PANEL = 'rounded-[26px] border border-line bg-white p-5 lg:p-7'
const SAME_FIELD_LIMIT = 5

const FEATURE_LABELS = [
  { key: 'activiyTrial', label: 'Có học thử' },
  { key: 'activiyTest', label: 'Có test đầu vào' },
  { key: 'activiyVisit', label: 'Có tham quan' },
] as const

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
  return detailMeta({ title: item.seoTitle || item.title, ogTitle: item.title, description: item.seoDesc || item.shortContent || '', image: item.image, path: getCourseUrl(item) })
}

export default async function PdpPage({ params }: Props) {
  const { id } = await params
  const [data, pointsPreview]: [PdpData | null, Awaited<ReturnType<typeof getPointsPreview>>] =
    await Promise.all([getPdpData(Number(id)), getPointsPreview(Number(id))])
  if (!data) notFound()

  const { item, author, categories, reviews, rating, num_favorite, authorItems, hotItems, is_fav } = data
  const schedules: ItemSchedule[] = data.schedules ?? []
  const enrolledCount = data.enrolled_count ?? 0
  const content = parseContent(item.content)
  const ageLabel = formatAge(item.agesMin, item.agesMax)
  const hasDiscount = !!(item.orgPrice && item.orgPrice > item.price)
  const discountPct = hasDiscount ? Math.round((1 - item.price / item.orgPrice!) * 100) : null
  const features = FEATURE_LABELS.filter(f => item[f.key] === 1)
  const hasContent = !!content.content_advantage

  const origin = siteOrigin()
  const coursePath = getCourseUrl(item)
  const firstCategory = categories[0]
  // Same field = the visitors' search for the first category (visible courses, max 2 per partner); not logged
  // as a search because no `ref` is sent.
  const sameField = firstCategory
    ? (await searchItems('', 0, SAME_FIELD_LIMIT + 1, { category: firstCategory.url })).items
        .filter(it => it.id !== item.id).slice(0, SAME_FIELD_LIMIT)
    : []

  return (
    <>
      <JsonLd data={[
        courseLd({
          url: origin + coursePath, name: item.title, description: item.seoDesc || item.shortContent, image: item.image, price: item.price,
          provider: author ? { name: author.name, url: `${origin}/partner/${author.id}` } : null,
          rating: { value: rating, count: reviews.length },
          online: item.subtype ? ['online', 'video', 'digital'].includes(item.subtype) : undefined,
        }),
        breadcrumbLd(origin, [
          { name: 'Trang chủ', path: '/' },
          ...(firstCategory ? [{ name: firstCategory.title, path: `/search?category=${firstCategory.url}` }] : [{ name: 'Tìm khóa học', path: '/search' }]),
          { name: item.title, path: coursePath },
        ]),
      ]} />
      {/* ── Hero ──
          Desktop: two columns. Left = picture, video outline, partner, its other courses, course description; right =
          buy card, reviews, courses of the same field (the right column follows the scroll). Phone: one column, the
          order-* classes put the blocks as picture, buy card, video, partner, other courses, reviews, description,
          same field. */}
      <section className="section--soft pb-10 pt-6 lg:pt-10">
        <div className="container">
          <BackButton />
          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_440px] lg:items-start lg:gap-10">
            <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-8">
              <div className="relative order-1 aspect-[4/3] lg:order-none overflow-hidden rounded-card bg-gradient-to-br from-green-soft to-blue-soft">
                {item.image
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={item.image} alt={item.title} className="absolute inset-0 size-full object-cover" />
                  : <div className="grid size-full place-items-center text-blue/40"><BookIcon className="size-16" /></div>
                }
              </div>

              {item.subtype === 'video' && (
                <div className="order-3 lg:order-none"><VideoOutline itemId={item.id} embedded /></div>
              )}

              {author && (
                <div className={`${PANEL} order-4 lg:order-none`}>
                  <span className="section-kicker">{author.role === 'teacher' ? 'Chuyên gia' : 'Trường học'}</span>
                  <div className="mt-3 flex items-start gap-4">
                    <div className="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-soft to-green-soft text-blue/40">
                      {author.image
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={author.image} alt={author.name} className="absolute inset-0 size-full object-cover" />
                        : author.role === 'teacher' ? <UserIcon className="size-9" /> : <SchoolIcon className="size-9" />
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="m-0 mb-1.5 text-xl font-extrabold leading-tight text-ink">{author.name}</h2>
                      {author.introduce && <p className="m-0 mb-3 line-clamp-4 text-sm leading-[1.7] text-muted">{author.introduce}</p>}
                      <Link href={`/partner/${author.id}`} className="btn btn--outline text-sm">
                        <ChevronLabel>Xem tất cả khóa học</ChevronLabel>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {authorItems.length > 0 && (
                <div className={`${PANEL} order-4 lg:order-none`}>
                  <h3 className="section-kicker mb-4">Các khóa học khác</h3>
                  <ScrollRow>
                    {(authorItems as Item[]).map(it => (
                      <Link key={it.id} href={getCourseUrl(it)} className="w-[150px] shrink-0 no-underline sm:w-[170px]">
                        <div className="relative mb-2.5 aspect-square overflow-hidden rounded-[14px] bg-gradient-to-br from-green-soft to-blue-soft">
                          {it.image
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={it.image} alt={it.title} className="absolute inset-0 size-full object-cover" />
                            : <div className="grid size-full place-items-center text-blue/40"><BookIcon className="size-8" /></div>
                          }
                        </div>
                        <div className="mb-1.5 line-clamp-2 text-sm font-extrabold leading-[1.3] text-green-dark">{it.title}</div>
                        <div className="text-[15px] font-extrabold text-red">{formatPrice(it.price)}</div>
                        <CompareWhenActive itemId={it.id} title={it.title} image={it.image} className="mt-1" />
                      </Link>
                    ))}
                  </ScrollRow>
                </div>
              )}

              {hasContent && (
                <div className={`${PANEL} order-6 lg:order-none`}>
                  <h2 className="section-kicker mb-5">Thông tin khóa học</h2>
                  <CollapsibleContent>
                    <div className="cms-content" dangerouslySetInnerHTML={{ __html: content.content_advantage }} />
                  </CollapsibleContent>
                </div>
              )}
            </div>

            <StickyAside className="contents lg:flex lg:flex-col lg:gap-8">
              <div className="order-2 rounded-[26px] border border-line bg-white p-5 shadow-card lg:order-none lg:p-7">
                <div className="mb-3 flex flex-wrap gap-2">
                  {item.subtype && (
                    <span className="rounded-full bg-green-soft px-3 py-1 text-xs font-extrabold text-green-dark">
                      {SUBTYPE_LABELS[item.subtype] ?? item.subtype}
                    </span>
                  )}
                  {categories.map(c => (
                    <Link key={c.url} href={`/search?category=${c.url}`}
                      className="rounded-full bg-blue-soft px-3 py-1 text-xs font-extrabold text-blue no-underline">
                      {c.title}
                    </Link>
                  ))}
                </div>

                <h1 className="m-0 mb-3 text-[clamp(20px,2.5vw,26px)] font-extrabold leading-[1.2] text-ink">
                  {item.title}
                </h1>

                <div className="mb-3.5 flex flex-wrap items-center gap-4">
                  <FavButton itemId={item.id} initialFaved={is_fav} initialCount={num_favorite} />
                  <CompareToggle itemId={item.id} title={item.title} image={item.image} variant="inline" />
                  <a href="#reviews-section" className="flex min-h-11 items-center gap-1.5 no-underline">
                    {rating != null && rating > 0 ? (
                      <>
                        <StarRating value={rating} />
                        <span className="text-[13px] font-medium text-text">{rating.toFixed(1)}</span>
                        <span className="text-xs text-subtle">({reviews.length})</span>
                      </>
                    ) : (
                      <>
                        <StarRating value={0} />
                        <span className="text-xs text-subtle">Chưa có đánh giá</span>
                      </>
                    )}
                  </a>
                </div>

                {item.shortContent && (
                  <p className="mb-5 leading-[1.6] text-muted">{item.shortContent}</p>
                )}

                <div className="grid grid-cols-2 gap-3 rounded-2xl bg-bg p-4">
                  {ageLabel && <MetaItem label="Độ tuổi" value={ageLabel} />}
                  {item.seats != null && item.seats > 0 && (
                    <MetaItem label="Số chỗ còn lại" value={`${Math.max(0, item.seats - enrolledCount)}/${item.seats} học viên`} />
                  )}
                  {(item.cycleAmount || item.cycleType) && (
                    <MetaItem
                      label="Chu kỳ học"
                      value={`${item.cycleAmount ? `${item.cycleAmount} ` : ''}${item.cycleType ? (CYCLE_LABELS[item.cycleType] ?? item.cycleType) : ''}`}
                    />
                  )}
                </div>

                {schedules.length > 0 && (
                  <div className="mb-1 mt-4">
                    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Lịch học</div>
                    <div className="flex flex-col gap-2">
                      {schedules.map(s => (
                        <div key={s.id} className="text-sm">
                          {s.title && (
                            <div className="flex flex-wrap items-center gap-2 font-bold text-ink">
                              {s.title}
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${SCHEDULE_BADGE_CLASS[s.scheduleType ?? ''] ?? SCHEDULE_BADGE_CLASS.recurring}`}>
                                {SCHEDULE_TYPE_LABEL[s.scheduleType ?? ''] ?? s.scheduleType}
                              </span>
                            </div>
                          )}
                          <div className="text-xs text-muted">{formatSchedule(s)}</div>
                          {s.locationNote && <div className="text-xs text-muted">{s.locationNote}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {features.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                    {features.map(f => (
                      <span key={f.key} className="flex items-center gap-1 text-xs text-green-dark">
                        <CheckIcon className="size-4 text-green" />
                        {f.label}
                      </span>
                    ))}
                  </div>
                )}

                <div className="my-6 flex flex-wrap items-baseline gap-3">
                  <span className="text-[32px] font-extrabold text-red">{formatPrice(item.price)}</span>
                  {hasDiscount && (
                    <>
                      <span className="text-lg text-subtle line-through">{formatPrice(item.orgPrice!)}</span>
                      <span className="rounded-full bg-red px-2.5 py-1 text-xs font-extrabold text-white">-{discountPct}%</span>
                    </>
                  )}
                </div>

                {pointsPreview && pointsPreview.points > 0 && (
                  <div className="-mt-3 mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <PointsRewardBadge points={pointsPreview.points} vndValue={pointsPreview.vndValue} />
                    <Link href="/info/anypoint" className="text-xs font-medium text-green-dark underline">anyPoint là gì?</Link>
                  </div>
                )}

                {item.subtype === 'video' && <VideoHeroCta itemId={item.id} />}
                {item.subtype === 'video'
                  ? <VideoRegisterButton itemId={item.id} price={item.price} />
                  : <RegisterButton itemId={item.id} price={item.price} />}
                <ActivityButton itemId={item.id}
                  activiyTrial={item.activiyTrial} activiyTest={item.activiyTest} activiyVisit={item.activiyVisit} />
                <PromiseStrip />
                <div className="mt-3"><FoundationItemLine itemId={item.id} /></div>
                <CollectVouchers place="pdp" itemId={item.id} title="Voucher dùng cho khóa này" className="mt-4" />
                <div className="mt-3"><ReportPriceButton itemId={item.id} /></div>
              </div>

              <div className={`${PANEL} order-5 lg:order-none`} id="reviews-section">
                <h2 className="section-kicker mb-5">Đánh giá từ học viên</h2>
                <ReviewsSection itemId={item.id} authorId={author?.id} authorName={author?.name} initialReviews={reviews} />
              </div>

              {firstCategory && sameField.length > 0 && (
                <div className={`${PANEL} order-7 lg:order-none`}>
                  <h2 className="section-kicker mb-4">Khóa học cùng lĩnh vực {firstCategory.title}</h2>
                  <div className="flex flex-col gap-3">
                    {sameField.map(it => (
                      <Link key={it.id} href={getCourseUrl(it)} className="flex items-center gap-3 rounded-2xl p-1.5 no-underline hover:bg-bg">
                        <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-green-soft to-blue-soft">
                          {it.image
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={it.image} alt={it.title} className="absolute inset-0 size-full object-cover" />
                            : <div className="grid size-full place-items-center text-blue/40"><BookIcon className="size-6" /></div>
                          }
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 line-clamp-2 text-sm font-extrabold leading-[1.3] text-green-dark">{it.title}</div>
                          <div className="text-sm font-extrabold text-red">{formatPrice(it.price)}</div>
                          <CompareWhenActive itemId={it.id} title={it.title} image={it.image} className="mt-1" />
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link href={`/search?category=${encodeURIComponent(firstCategory.url)}`} className="btn btn--outline mt-4 w-full justify-center text-sm">
                    <ChevronLabel>Xem thêm khóa {firstCategory.title}</ChevronLabel>
                  </Link>
                </div>
              )}
            </StickyAside>
          </div>
        </div>
      </section>

      <PathwayBlock itemId={item.id} />
      <ItemCollections itemId={item.id} />
      <TrackItemView itemId={item.id} />

      {/* ── Khóa học tương tự ── */}
      {hotItems.length > 0 && (
        <section className="section section--soft">
          <div className="container">
            <span className="section-kicker">Khám phá thêm</span>
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-5">
              {(hotItems as Item[]).map(it => (
                <Link key={it.id} href={getCourseUrl(it)} className="no-underline">
                  <article className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
                    <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-green-soft to-blue-soft">
                      {it.image
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={it.image} alt={it.title} className="absolute inset-0 size-full object-cover" />
                        : <div className="grid size-full place-items-center text-blue/40"><BookIcon className="size-8" /></div>
                      }
                    </div>
                    <div className="px-3.5 py-3">
                      <div className="mb-1.5 line-clamp-2 text-xs font-extrabold leading-[1.3] text-green-dark">
                        {it.title}
                      </div>
                      <div className="text-sm font-extrabold text-red">{formatPrice(it.price)}</div>
                    </div>
                    <CompareWhenActive itemId={it.id} title={it.title} image={it.image} />
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

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-extrabold uppercase tracking-wide text-subtle">{label}</span>
      <span className="text-sm font-medium text-ink">{value}</span>
    </div>
  )
}
