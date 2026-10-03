import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/v2/api'

interface ArticleData {
  id: number; title: string; url: string; content: string; updatedAt?: string
  others: { id: number; title: string; url: string }[]
}

async function fetchArticle(id: string): Promise<ArticleData | null> {
  try {
    const res = await fetch(`${BASE}/helpcenter/article/${id}`, { next: { revalidate: 3600 } })
    const json = await res.json()
    if (json?.resultCode === 1 && json?.data) return json.data
  } catch {}
  return null
}

export async function generateMetadata({ params }: { params: Promise<{ id: string; slug: string }> }): Promise<Metadata> {
  const { id } = await params
  const article = await fetchArticle(id)
  return { title: article ? `${article.title} - anyLEARN` : 'Bài viết - anyLEARN' }
}

export default async function KnowledgeArticlePage({ params }: { params: Promise<{ id: string; slug: string }> }) {
  const { id } = await params
  const article = await fetchArticle(id)
  if (!article) notFound()

  return (
    <section className="section">
      <div className="container max-w-[860px]">
        <div className="mb-4">
          <Link href="/helpcenter" className="text-sm text-muted no-underline hover:text-blue">
            ← Trung tâm hỗ trợ
          </Link>
        </div>

        <div className="flex gap-8 items-start">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            <h1 className="text-[clamp(22px,3vw,30px)] font-black text-ink mb-2">{article.title}</h1>
            {article.updatedAt && (
              <p className="text-xs text-muted mb-6">
                Cập nhật: {new Date(article.updatedAt).toLocaleDateString('vi-VN')}
              </p>
            )}
            <div
              className="prose max-w-none text-text leading-relaxed"
              dangerouslySetInnerHTML={{ __html: article.content ?? '' }}
            />
          </div>

          {/* Related articles */}
          {article.others.length > 0 && (
            <aside className="hidden md:block w-[220px] shrink-0">
              <h4 className="font-black text-sm text-ink mb-3">Bài viết liên quan</h4>
              <ul className="list-none p-0 m-0 flex flex-col gap-2">
                {article.others.map(o => (
                  <li key={o.id}>
                    <Link href={`/helpcenter/${o.id}/${o.url}`}
                      className="text-sm text-ink no-underline hover:text-green leading-snug block">
                      {o.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </div>
      </div>
    </section>
  )
}
