import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { API_BASE } from '@/lib/apiBase'
import BackLink from '@/components/BackLink'
import { ChevronRightIcon } from '@/components/icons'

interface TopicData {
  id: number; title: string; url: string
  knowledge: { id: number; title: string; url: string }[]
}

async function fetchTopic(url: string): Promise<TopicData | null> {
  try {
    const res = await fetch(`${API_BASE}/helpcenter/topic/${url}`, { next: { revalidate: 600 } })
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
    <div className="bg-bg py-10 lg:py-14">
      <div className="container max-w-[780px]">
        <div className="mb-6">
          <BackLink href="/helpcenter">Trung tâm hỗ trợ</BackLink>
        </div>
        <h1 className="text-[clamp(22px,3vw,30px)] font-extrabold text-ink mb-6">{data.title}</h1>

        {data.knowledge.length > 0 ? (
          <div className="bg-white border border-line rounded-card overflow-hidden">
            <ul className="m-0 list-none divide-y divide-line p-0">
              {data.knowledge.map(k => (
                <li key={k.id}>
                  <Link href={`/helpcenter/${k.id}/${k.url}`}
                    className="flex min-h-12 items-center gap-2 px-5 py-3 text-sm text-ink no-underline hover:bg-bg transition-colors">
                    <ChevronRightIcon className="size-4 shrink-0 text-green" />
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
