import Link from 'next/link'
import type { Metadata } from 'next'
import { getArticles, getArticleUrl } from '@/lib/api'
import ChevronLabel from '@/components/ChevronLabel'
import ArticleTypeLabel from '@/components/article/ArticleTypeLabel'
import { BookIcon, ChevronLeftIcon, ChevronRightIcon } from '@/components/icons'
import { ARTICLE_TYPE_FILTERS } from '@/config/articleTypes'

export const metadata: Metadata = {
  title: 'Bài viết & Kiến thức giáo dục | anyLEARN',
  description: 'Khám phá các bài viết hữu ích về giáo dục, kỹ năng và hành trình học tập của con.',
}

const PAGE_SIZE = 12

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; type?: string }>
}) {
  const params = await searchParams
  const page = Math.max(0, parseInt(params.page ?? '0', 10))
  const type = params.type

  const result = await getArticles(page, PAGE_SIZE, type)
  const totalPages = Math.ceil(result.total / PAGE_SIZE)

  function buildUrl(p: number, t?: string) {
    const q = new URLSearchParams()
    if (p > 0) q.set('page', String(p))
    if (t) q.set('type', t)
    return `/article${q.toString() ? `?${q}` : ''}`
  }

  return (
    <div className="container py-8 lg:py-12">
      <div className="section-head !mb-6">
        <div>
          <span className="section-kicker">Kiến thức giáo dục</span>
          <h1 className="section-title">Học và hỏi cùng anyLEARN</h1>
          <p className="section-desc">Khám phá các bài viết hữu ích về giáo dục, kỹ năng và hành trình học tập của con</p>
        </div>
      </div>

      {/* Type filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {ARTICLE_TYPE_FILTERS.map(t => (
          <Link
            key={t ?? 'all'}
            href={buildUrl(0, t)}
            className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold no-underline transition-colors ${
              type === t
                ? 'border-green bg-green-soft text-green-dark'
                : 'border-line bg-white text-ink hover:border-green'
            }`}
          >
            {t ? <ArticleTypeLabel type={t} /> : 'Tất cả'}
          </Link>
        ))}
      </div>

      {result.items.length === 0 ? (
        <p className="py-16 text-center text-muted">Chưa có bài viết nào.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {result.items.map(a => (
              <article key={a.id} className="flex flex-col overflow-hidden rounded-card border border-line bg-white shadow-card">
                <Link href={getArticleUrl(a)} className="block no-underline">
                  <div className="min-h-[180px] grid place-items-center relative overflow-hidden bg-gradient-to-br from-blue-soft to-green-soft">
                    {a.image
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={a.image} alt={a.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                      : <BookIcon className="size-12 text-blue/40" />
                    }
                    <span className="absolute left-3 top-3 rounded-full bg-blue px-2.5 py-1 text-[11px] font-semibold uppercase text-white">
                      <ArticleTypeLabel type={a.type} />
                    </span>
                  </div>
                </Link>
                <div className="p-5 flex flex-col flex-1">
                  <Link href={getArticleUrl(a)} className="no-underline">
                    <h2 className="mt-0 mb-2.5 text-[17px] font-semibold leading-snug text-ink hover:text-blue transition-colors">
                      {a.title}
                    </h2>
                  </Link>
                  {a.short_content && (
                    <p className="mb-4 text-sm text-muted flex-1 line-clamp-2">{a.short_content}</p>
                  )}
                  <Link href={getArticleUrl(a)} className="mt-auto text-sm font-semibold text-green-dark no-underline">
                    <ChevronLabel>Đọc thêm</ChevronLabel>
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex gap-2 justify-center mt-10 flex-wrap">
              {page > 0 && (
                <Link href={buildUrl(page - 1, type)} className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-line bg-white px-4 text-sm font-medium text-ink no-underline hover:bg-bg">
                  <ChevronLeftIcon className="size-4" /> Trước
                </Link>
              )}
              {Array.from({ length: totalPages }, (_, i) => (
                <Link
                  key={i}
                  href={buildUrl(i, type)}
                  className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-sm font-semibold no-underline ${
                    i === page
                      ? 'border-green bg-green-soft text-green-dark border'
                      : 'border border-line text-ink hover:bg-bg'
                  }`}
                >
                  {i + 1}
                </Link>
              ))}
              {page < totalPages - 1 && (
                <Link href={buildUrl(page + 1, type)} className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-line bg-white px-4 text-sm font-medium text-ink no-underline hover:bg-bg">
                  Tiếp <ChevronRightIcon className="size-4" />
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
