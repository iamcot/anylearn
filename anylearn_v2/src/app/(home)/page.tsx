import SearchCard from '@/components/SearchCard'
import PromoSlider from '@/components/PromoSlider'
import { getCollections, getHomeV2, searchUsers, Category, getArticleUrl, Article, type UserResult } from '@/lib/api'
import Link from 'next/link'
import TodayRedirect from '@/components/TodayRedirect'
import { BookIcon, PlayIcon } from '@/components/icons'
import ChevronLabel from '@/components/ChevronLabel'
import CourseRequestCta from '@/components/search/CourseRequestCta'
import AiSuggestEntry from '@/components/aisuggest/AiSuggestEntry'
import HomeLearnerRow from '@/components/home/HomeLearnerRow'
import HomeQuickChips from '@/components/home/HomeQuickChips'
import HomePersonalRows from '@/components/home/HomePersonalRows'
import CollectionsRow from '@/components/home/CollectionsRow'
import FeaturedPartners from '@/components/home/FeaturedPartners'

const FEATURED_PARTNERS_PER_ROLE = 4

export default async function HomePage() {
  const [homeData, collections, schools, teachers] = await Promise.all([
    getHomeV2(),
    getCollections(),
    searchUsers('', 'school', 0, FEATURED_PARTNERS_PER_ROLE, 'popular'),
    searchUsers('', 'teacher', 0, FEATURED_PARTNERS_PER_ROLE, 'popular'),
  ])
  const categories: Category[] = homeData?.categories?.slice(0, 6) ?? []
  const articles: Article[] = homeData?.articles?.slice(0, 3) ?? []
  const promos: Article[] = homeData?.promotions ?? []
  const partners: UserResult[] = [...schools.items, ...teachers.items]

  return (
    <>
      <TodayRedirect />
      {/* ── Hero: who it is for, search, quick chips ── */}
      <section className="bg-gradient-to-br from-blue to-green py-8 text-white lg:py-14">
        <div className="container">
          <h1 className="mb-4 max-w-3xl text-[clamp(26px,4.6vw,52px)] font-extrabold leading-[1.08] tracking-[-1px]">
            Tìm khóa học, trường học và chuyên gia phù hợp cho con
          </h1>
          <SearchCard variant="home" initialTags={categories.map(c => ({ label: c.title, categoryUrl: c.url }))} />
          <HomeLearnerRow />
          <HomeQuickChips />
        </div>
      </section>

      <PromoSlider promos={promos} />

      <section className="empty:hidden pt-6">
        <div className="container empty:hidden"><AiSuggestEntry /></div>
      </section>

      <HomePersonalRows />
      <CollectionsRow collections={collections} />
      <FeaturedPartners partners={partners} />

      {/* ── Ask us to find a course ── */}
      <section className="pt-8 lg:pt-12">
        <div className="container">
          <div className="flex flex-col items-start gap-4 rounded-card border border-green-line bg-green-soft p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div>
              <h2 className="m-0 mb-1 text-xl font-extrabold text-ink">Chưa thấy khóa học bạn cần?</h2>
              <p className="m-0 text-muted">Cho anyLEARN biết con cần học gì, chúng tôi sẽ tìm đối tác phù hợp và gọi lại cho bạn.</p>
            </div>
            <CourseRequestCta label="Nhờ anyLEARN tìm giúp" variant="primary" defaults={{}} />
          </div>
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
                    <ChevronLabel className="text-sm font-extrabold text-green-dark">Đọc thêm</ChevronLabel>
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
