import SearchCard from '@/components/SearchCard'
import CourseCard from '@/components/CourseCard'
import PromoSlider from '@/components/PromoSlider'
import { getHomeV2, Category, getArticleUrl, Article } from '@/lib/api'
import Link from 'next/link'
import TodayRedirect from '@/components/TodayRedirect'
import CategoryIcon from '@/components/CategoryIcon'
import { ArrowRightIcon, BoltIcon, BookIcon, ChatIcon, GiftIcon, PlayIcon, SearchIcon } from '@/components/icons'

const BENEFITS = [
  { Icon: SearchIcon, title: 'Dễ tìm kiếm', desc: 'Tìm trường học, khóa học và chuyên gia theo nhu cầu của con' },
  { Icon: ChatIcon, title: 'Tư vấn miễn phí', desc: 'Nhận tư vấn từ chuyên gia giáo dục không mất phí' },
  { Icon: BoltIcon, title: 'Đăng ký nhanh', desc: 'Đặt lịch và thanh toán trực tuyến trong vài phút' },
  { Icon: GiftIcon, title: 'Tiết kiệm hơn', desc: 'Nhiều ưu đãi độc quyền và chương trình khuyến mãi' },
]

export default async function HomePage() {
  const homeData = await getHomeV2()
  const featuredItems = homeData?.home_classes?.flatMap(b => b.classes ?? []).slice(0, 8) ?? []
  const categories: Category[] = homeData?.categories?.slice(0, 10) ?? []
  const articles: Article[] = homeData?.articles?.slice(0, 3) ?? []
  const events: Article[] = homeData?.events?.slice(0, 3) ?? []
  const promos: Article[] = homeData?.promotions ?? []

  return (
    <>
      <TodayRedirect />
      {/* ── Hero ── */}
      <section className="hero-section flex items-center bg-gradient-to-br from-blue to-green text-white">
        <div className="container">
          <span className="mb-5 inline-flex items-center rounded-full border border-white/25 bg-white/15 px-3.5 py-2 text-sm font-extrabold">
            Nền tảng booking giáo dục cho phụ huynh
          </span>
          <h1 className="mb-5 max-w-3xl text-[clamp(34px,5.4vw,66px)] font-extrabold leading-[1.05] tracking-[-1.6px]">
            Tìm khóa học, trường học và chuyên gia phù hợp cho con
          </h1>
          <p className="mb-8 max-w-2xl text-lg text-white/90">
            anyLEARN giúp phụ huynh tìm kiếm, so sánh, nhận tư vấn và đăng ký chương trình học chính quy, ngoại khóa, online và offline dễ dàng hơn
          </p>
          <SearchCard variant="home" initialTags={categories.slice(0, 6).map(c => ({ label: c.title, categoryUrl: c.url }))} />
        </div>
      </section>

      {/* ── Benefits overlap ── */}
      <div className="relative z-10 -mt-14">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {BENEFITS.map(b => (
              <article key={b.title} className="grid grid-cols-[44px_1fr] items-center gap-3.5 rounded-card border border-line bg-white px-5 py-4 shadow-card">
                <div className="grid size-11 place-items-center rounded-2xl bg-green/10 text-green"><b.Icon className="size-6" /></div>
                <div>
                  <h3 className="m-0 mb-1 text-base font-extrabold text-ink">{b.title}</h3>
                  <p className="m-0 text-sm leading-snug text-muted">{b.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      {/* ── Promo ── */}
      <PromoSlider promos={promos} />

      {/* ── Categories ── */}
      <section className="section section--soft">
        <div className="container section-head">
          <div>
            <span className="section-kicker">Bắt đầu theo nhu cầu</span>
            <h2 className="section-title">Chọn nhanh nhóm học phù hợp</h2>
            <p className="section-desc">Khám phá các nhóm chương trình theo mục tiêu học tập, độ tuổi và sở thích của con</p>
          </div>
        </div>
        <div className="container grid grid-cols-2 gap-3 sm:grid-cols-3">
          {categories.map(cat => (
            <article key={cat.id} className="rounded-2xl border border-line bg-white shadow-card">
              <Link href={`/search?category=${cat.url}`} className="flex min-h-11 flex-col items-start gap-1.5 p-4 no-underline md:flex-row md:items-center md:gap-3">
                <CategoryIcon url={cat.url} className="size-7 shrink-0 text-green" />
                <h3 className="m-0 text-sm font-extrabold leading-tight text-blue">{cat.title}</h3>
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
        <div className="container grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featuredItems.length > 0
            ? featuredItems.map(item => <CourseCard key={item.id} item={item} />)
            : Array.from({ length: 4 }).map((_, i) => (
                <article key={i} className="overflow-hidden rounded-card border border-line bg-white">
                  <div className="grid min-h-[165px] place-items-center bg-gradient-to-br from-green-soft to-blue-soft text-blue/40">
                    <BookIcon className="size-14" />
                  </div>
                  <div className="p-4">
                    <div className="mb-2.5 h-4 rounded-lg bg-surface" />
                    <div className="h-3 w-[70%] rounded-lg bg-surface" />
                  </div>
                </article>
              ))
          }
        </div>
      </section>

      {/* ── Events ── */}
      <section className="section section--soft">
        <div className="container section-head">
          <div>
            <span className="section-kicker">Dành riêng cho phụ huynh</span>
            <h2 className="section-title">Ưu đãi học tập dành riêng cho phụ huynh</h2>
            <p className="section-desc">Cập nhật các chương trình tư vấn, kiểm tra năng lực và thanh toán linh hoạt từ anyLEARN</p>
          </div>
        </div>
        <div className="container grid grid-cols-1 md:grid-cols-3 gap-5">
          {events.map(e => (
            <article key={e.id} className="relative flex cursor-pointer flex-col overflow-hidden rounded-card border border-line bg-white shadow-card">
              <Link href={getArticleUrl(e)} className="absolute inset-0 z-10" aria-label={e.title} />
              <div className="grid min-h-[190px] place-items-center bg-gradient-to-br from-blue to-green p-6 text-center text-2xl font-extrabold leading-tight text-white">
                {e.title}
              </div>
              <div className="p-5 flex flex-col flex-1">
                {e.short_content && <p className="mb-4 flex-1 text-muted">{e.short_content}</p>}
                <div className="mt-auto flex justify-end">
                  <span className="inline-flex items-center gap-1 text-sm font-extrabold text-green-dark">Xem chi tiết <ArrowRightIcon className="size-4" /></span>
                </div>
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
          <Link href="/article" className="btn btn--outline">Xem tất cả bài viết</Link>
          </div>
          <div className="container grid grid-cols-1 md:grid-cols-3 gap-5">
            {articles.map((a) => (
              <article key={a.id} className="relative flex cursor-pointer flex-col overflow-hidden rounded-card border border-line bg-white shadow-card">
                <Link href={getArticleUrl(a)} className="absolute inset-0 z-10" aria-label={a.title} />
                <div className="relative grid min-h-[160px] place-items-center overflow-hidden bg-gradient-to-br from-blue-soft to-green-soft">
                  {a.image
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={a.image} alt={a.title} className="absolute inset-0 w-full h-full object-cover" />
                    : <BookIcon className="size-14 text-blue/40" />
                  }
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-blue px-2.5 py-1 text-[11px] font-extrabold uppercase text-white">
                    {a.type === 'video' ? <PlayIcon className="size-3" /> : <BookIcon className="size-3" />}
                    {a.type === 'video' ? 'Video' : 'Bài viết'}
                  </span>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="mb-2.5 mt-0 text-[17px] font-extrabold leading-snug text-ink">{a.title}</h3>
                  {a.short_content && (
                    <p className="mb-4 line-clamp-2 flex-1 text-sm text-muted">{a.short_content}</p>
                  )}
                  <div className="mt-auto flex justify-end">
                    <span className="inline-flex items-center gap-1 text-sm font-extrabold text-green-dark">Đọc thêm <ArrowRightIcon className="size-4" /></span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
