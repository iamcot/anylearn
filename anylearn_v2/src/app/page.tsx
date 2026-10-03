import SearchCard from '@/components/SearchCard'
import CourseCard from '@/components/CourseCard'
import PromoSlider from '@/components/PromoSlider'
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const promos: any[] = (homeData as any)?.promotions ?? []

  return (
    <>
      {/* ── Hero ── */}
      <section className="hero-section flex items-center bg-[linear-gradient(135deg,#00539b,#00a651)] text-white">
        <div className="container">
          <span className="inline-flex items-center rounded-full px-3.5 py-2 text-sm font-black mb-5 bg-[rgba(255,255,255,0.16)] border border-[rgba(255,255,255,0.24)]">
            Nền tảng booking giáo dục cho phụ huynh
          </span>
          <h1 className="font-black leading-none mb-5 max-w-3xl text-[clamp(38px,5.4vw,66px)] tracking-[-1.6px]">
            Tìm khóa học, trường học và chuyên gia phù hợp cho con
          </h1>
          <p className="text-lg mb-8 max-w-2xl text-[rgba(255,255,255,0.9)]">
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
              <article key={b.title} className="bg-white border border-[#e6edf4] rounded-[18px] px-5 py-4 grid grid-cols-[44px_1fr] gap-3.5 items-center shadow-[0_10px_26px_rgba(15,23,42,0.08)]">
                <div className="feature-icon m-0">{b.emoji}</div>
                <div>
                  <h3 className="m-0 mb-1 text-[#17212f] text-base font-black">{b.title}</h3>
                  <p className="m-0 text-[#6d7a8a] text-sm leading-snug">{b.desc}</p>
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
        <div className="container grid grid-cols-3 gap-3">
          {categories.map(cat => (
            <article key={cat.id} className="bg-white border border-[#e6edf4] rounded-2xl p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
              <Link href={`/search?category=${cat.url}`} className="cat-link">
                <div className="cat-icon">{CATEGORY_EMOJIS[cat.url] ?? DEFAULT_EMOJI}</div>
                <h3 className="cat-title">{cat.title}</h3>
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
                <article key={i} className="bg-white border border-[#e6edf4] rounded-[22px] overflow-hidden">
                  <div className="min-h-[165px] grid place-items-center bg-[linear-gradient(135deg,#dff7e8,#e7f3ff)]">
                    <span className="text-5xl">📚</span>
                  </div>
                  <div className="p-4">
                    <div className="h-4 bg-[#f0f0f0] rounded-lg mb-2.5" />
                    <div className="h-3 bg-[#f0f0f0] rounded-lg w-[70%]" />
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
            <article key={e.id} className="rounded-[22px] overflow-hidden bg-white border border-[#e6edf4] flex flex-col shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <div className="min-h-[190px] grid place-items-center p-6 text-center text-white font-black text-2xl leading-tight bg-[linear-gradient(135deg,#00539b,#00a651)]">
                {e.title}
              </div>
              <div className="p-5 flex flex-col flex-1">
                {e.shortContent && <p className="text-[#6d7a8a] flex-1 mb-4">{e.shortContent}</p>}
                <Link href="/search" className="btn btn--green mt-auto">Xem chi tiết</Link>
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
          <div className="container grid grid-cols-1 md:grid-cols-3 gap-5">
            {articles.map((a: any) => (
              <article key={a.id} className="bg-white border border-[#e6edf4] rounded-[22px] overflow-hidden flex flex-col shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <div className="min-h-[160px] grid place-items-center relative overflow-hidden bg-[linear-gradient(135deg,#eef7ff,#e9fff3)]">
                  {a.image
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={a.image} alt={a.title} className="absolute inset-0 w-full h-full object-cover" />
                    : <span className="text-5xl">📚</span>
                  }
                  <span className="absolute top-3 left-3 bg-[#00539b] text-white rounded-full px-2.5 py-1 text-[11px] font-black uppercase">
                    {a.type === 'video' ? '🎬 Video' : '📖 Bài viết'}
                  </span>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="mt-0 mb-2.5 text-[#17212f] text-[17px] font-black leading-snug">{a.title}</h3>
                  {a.short_content && (
                    <p className="mb-4 text-[#6d7a8a] text-sm flex-1 line-clamp-2">{a.short_content}</p>
                  )}
                  <Link href="/search" className="text-[#008244] font-black text-sm no-underline mt-auto">
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
