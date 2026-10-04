import Link from 'next/link'
import type { Metadata } from 'next'
import { getArticles, getArticleUrl } from '@/lib/api'

export const metadata: Metadata = {
  title: 'Bài viết & Kiến thức giáo dục | anyLEARN',
  description: 'Khám phá các bài viết hữu ích về giáo dục, kỹ năng và hành trình học tập của con.',
}

const PAGE_SIZE = 12

const TYPE_LABELS: Record<string, string> = {
  read: '📖 Bài viết',
  video: '🎬 Video',
  event: '📅 Sự kiện',
  promotion: '🎁 Khuyến mãi',
}

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
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <div className="section-head" style={{ marginBottom: '1.5rem' }}>
        <div>
          <span className="section-kicker">Kiến thức giáo dục</span>
          <h1 className="section-title">Học và hỏi cùng anyLEARN</h1>
          <p className="section-desc">Khám phá các bài viết hữu ích về giáo dục, kỹ năng và hành trình học tập của con</p>
        </div>
      </div>

      {/* Type filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {[undefined, 'read', 'video', 'event', 'promotion'].map(t => (
          <Link
            key={t ?? 'all'}
            href={buildUrl(0, t)}
            className={`px-4 py-1.5 rounded-full text-sm font-black border transition-colors ${
              type === t
                ? 'bg-blue text-white border-blue'
                : 'bg-white text-blue border-[#d0e3f5] hover:border-blue'
            }`}
          >
            {t ? TYPE_LABELS[t] ?? t : 'Tất cả'}
          </Link>
        ))}
      </div>

      {result.items.length === 0 ? (
        <p className="text-center text-[#6d7a8a] py-16">Chưa có bài viết nào.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {result.items.map(a => (
              <article key={a.id} className="bg-white border border-[#e6edf4] rounded-[22px] overflow-hidden flex flex-col shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <Link href={getArticleUrl(a)} className="block no-underline">
                  <div className="min-h-[180px] grid place-items-center relative overflow-hidden bg-[linear-gradient(135deg,#eef7ff,#e9fff3)]">
                    {a.image
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={a.image} alt={a.title} className="absolute inset-0 w-full h-full object-cover" />
                      : <span className="text-5xl">📚</span>
                    }
                    <span className="absolute top-3 left-3 bg-[#00539b] text-white rounded-full px-2.5 py-1 text-[11px] font-black uppercase">
                      {TYPE_LABELS[a.type] ?? a.type}
                    </span>
                  </div>
                </Link>
                <div className="p-5 flex flex-col flex-1">
                  <Link href={getArticleUrl(a)} className="no-underline">
                    <h2 className="mt-0 mb-2.5 text-[#17212f] text-[17px] font-black leading-snug hover:text-blue transition-colors">
                      {a.title}
                    </h2>
                  </Link>
                  {a.short_content && (
                    <p className="mb-4 text-[#6d7a8a] text-sm flex-1 line-clamp-2">{a.short_content}</p>
                  )}
                  <Link href={getArticleUrl(a)} className="text-[#008244] font-black text-sm no-underline mt-auto">
                    Đọc thêm →
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex gap-2 justify-center mt-10 flex-wrap">
              {page > 0 && (
                <Link href={buildUrl(page - 1, type)} className="px-4 py-2 rounded-lg border border-[#d0e3f5] text-blue font-black text-sm hover:bg-[#f0f7ff]">
                  ← Trước
                </Link>
              )}
              {Array.from({ length: totalPages }, (_, i) => (
                <Link
                  key={i}
                  href={buildUrl(i, type)}
                  className={`px-4 py-2 rounded-lg text-sm font-black ${
                    i === page
                      ? 'bg-blue text-white'
                      : 'border border-[#d0e3f5] text-blue hover:bg-[#f0f7ff]'
                  }`}
                >
                  {i + 1}
                </Link>
              ))}
              {page < totalPages - 1 && (
                <Link href={buildUrl(page + 1, type)} className="px-4 py-2 rounded-lg border border-[#d0e3f5] text-blue font-black text-sm hover:bg-[#f0f7ff]">
                  Tiếp →
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
