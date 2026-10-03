import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/v2/api'

interface TopicData {
  id: number; title: string; url: string
  knowledge: { id: number; title: string; url: string }[]
}

async function fetchTopic(url: string): Promise<TopicData | null> {
  try {
    const res = await fetch(`${BASE}/helpcenter/topic/${url}`, { next: { revalidate: 600 } })
    const json = await res.json()
    if (json?.resultCode === 1 && json?.data) return json.data
  } catch {}
  return null
}

export async function generateMetadata({ params }: { params: Promise<{ url: string }> }): Promise<Metadata> {
  const { url } = await params
  const data = await fetchTopic(url)
  return { title: data ? `${data.title} - anyLEARN` : 'Chủ đề hỗ trợ - anyLEARN' }
}

export default async function HelpcenterTopicPage({ params }: { params: Promise<{ url: string }> }) {
  const { url } = await params
  const data = await fetchTopic(url)
  if (!data) notFound()

  return (
    <div className="section section--soft">
      <div className="container max-w-[780px]">
        <div className="mb-6">
          <Link href="/helpcenter" className="text-sm text-muted no-underline hover:text-blue">
            ← Trung tâm hỗ trợ
          </Link>
        </div>
        <h1 className="text-[clamp(22px,3vw,30px)] font-black text-ink mb-6">{data.title}</h1>

        {data.knowledge.length > 0 ? (
          <div className="bg-white border border-line rounded-card overflow-hidden">
            <ul className="list-none p-0 m-0">
              {data.knowledge.map((k, i) => (
                <li key={k.id} className={i < data.knowledge.length - 1 ? 'border-b border-[#f0f0f0]' : ''}>
                  <Link href={`/helpcenter/${k.id}/${k.url}`}
                    className="flex items-center gap-2 px-5 py-3.5 text-sm text-ink no-underline hover:bg-bg transition-colors">
                    <span className="text-green shrink-0">›</span>
                    {k.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-muted">Chưa có bài viết trong chủ đề này.</p>
        )}
      </div>
    </div>
  )
}
