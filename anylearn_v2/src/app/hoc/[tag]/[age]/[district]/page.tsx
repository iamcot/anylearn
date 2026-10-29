import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCourseUrl } from '@/lib/api'
import { getLandingPage } from '@/lib/api/landing'
import CourseCard from '@/components/CourseCard'
import BackLink from '@/components/BackLink'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbLd, faqLd, itemListLd } from '@/lib/seo/jsonLd'
import { detailMeta } from '@/lib/seo/shareMeta'
import { siteOrigin } from '@/lib/achievements/share'
import { landingHref, landingPath, landingSearchUrl } from '@/lib/landing/landing'

interface Props {
  params: Promise<{ tag: string; age: string; district: string }>
}

async function load(params: Props['params']) {
  const { tag, age, district } = await params
  const path = landingPath(tag, age, district)
  return path ? getLandingPage(path) : null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await load(params)
  if (!page) return { title: 'Trang không tồn tại | anyLEARN', robots: { index: false } }
  return detailMeta({
    title: `${page.title} | anyLEARN`,
    description: page.description,
    image: page.items.find(item => item.image)?.image,
    path: landingHref(page.path),
  })
}

/** "{Môn} cho trẻ {tuổi} tuổi tại {quận}, TP.HCM" (plan 19.A7): server rendered, shown only when switched on with 3+ live courses. */
export default async function LandingPage({ params }: Props) {
  const page = await load(params)
  if (!page) notFound()

  const origin = siteOrigin()
  const href = landingHref(page.path)
  const searchUrl = landingSearchUrl(page)

  return (
    <div className="container py-6 lg:py-10">
      <JsonLd data={[
        breadcrumbLd(origin, [{ name: 'Trang chủ', path: '/' }, { name: 'Tìm khóa học', path: '/search' }, { name: page.title, path: href }]),
        itemListLd(page.title, page.items.map(item => origin + getCourseUrl(item))),
        faqLd(page.faq),
      ]} />
      <BackLink href="/search">Tìm khóa học</BackLink>

      <header className="mb-6 mt-3">
        <h1 className="m-0 text-2xl font-extrabold text-ink lg:text-3xl">{page.title}</h1>
        <p className="m-0 mt-3 max-w-3xl leading-relaxed text-text">{page.intro}</p>
      </header>

      <section className="mb-8">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="m-0 text-lg font-extrabold text-ink lg:text-2xl">{page.total} khóa đang mở</h2>
          <Link href={searchUrl} className="shrink-0 text-sm font-semibold text-green-dark">Lọc thêm ›</Link>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {page.items.map(item => <CourseCard key={item.id} item={item} />)}
        </div>
        {page.total > page.items.length && (
          <div className="mt-5 text-center">
            <Link href={searchUrl} className="inline-flex min-h-11 items-center rounded-full border border-green px-5 font-semibold text-green-dark">
              Xem tất cả {page.total} khóa
            </Link>
          </div>
        )}
      </section>

      <section className="mb-8 max-w-3xl">
        <h2 className="mb-3 mt-0 text-lg font-extrabold text-ink lg:text-2xl">Câu hỏi thường gặp</h2>
        <div className="divide-y divide-line rounded-card border border-line bg-white">
          {page.faq.map(f => (
            <details key={f.question} className="group px-4 py-3">
              <summary className="cursor-pointer font-semibold text-ink">{f.question}</summary>
              <p className="m-0 mt-2 leading-relaxed text-text">{f.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {page.related.length > 0 && (
        <section>
          <h2 className="mb-3 mt-0 text-lg font-extrabold text-ink lg:text-2xl">Tìm thêm</h2>
          <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
            {page.related.map(r => (
              <li key={r.path}>
                <Link href={landingHref(r.path)} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3 text-ink">
                  <span className="min-w-0">{r.title}</span>
                  <span className="shrink-0 text-sm text-muted">{r.courseCount} khóa</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
