import { Metadata } from 'next'
import Link from 'next/link'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/v2/api'

interface KnowledgeItem { id: number; title: string; url: string }
interface HelpcenterData {
  topKnowledge: KnowledgeItem[]
  topics: { id: number; title: string; url: string; image?: string; description?: string }[]
}

export const metadata: Metadata = { title: 'Trung tâm hỗ trợ - anyLEARN' }

async function fetchHelpcenter(): Promise<HelpcenterData | null> {
  try {
    const res = await fetch(`${BASE}/helpcenter`, { next: { revalidate: 600 } })
    const json = await res.json()
    if (json?.resultCode === 1 && json?.data) return json.data
  } catch {}
  return null
}

function knowledgeUrl(k: KnowledgeItem) {
  return `/helpcenter/${k.id}/${k.url}`
}

export default async function HelpcenterPage() {
  const data = await fetchHelpcenter()

  return (
    <div className="section section--soft">
      <div className="container max-w-[860px]">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-[clamp(24px,4vw,36px)] font-black text-ink mb-2">Trung tâm hỗ trợ</h1>
          <p className="text-muted">anyLEARN giúp gì được cho bạn?</p>
        </div>

        {/* Top questions */}
        {data?.topKnowledge && data.topKnowledge.length > 0 && (
          <div className="bg-white border border-line rounded-card mb-6 overflow-hidden">
            <div className="bg-white py-3 px-5 font-black text-ink">
              Câu hỏi thường gặp
            </div>
            <ul className="grid sm:grid-cols-2 p-0 m-0 list-none">
              {data.topKnowledge.map((k) => (
                <li key={k.id}>
                  <Link href={knowledgeUrl(k)}
                    className="flex items-center gap-2 px-5 py-3.5 text-sm text-ink no-underline hover:bg-bg transition-colors">
                    <span className="text-green shrink-0">›</span>
                    {k.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Topics */}
        {data?.topics && data.topics.length > 0 && (
          <div>
            <h2 className="text-lg font-black text-ink mb-4">Các chủ đề</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {data.topics.map(t => (
                <Link key={t.id} href={`/helpcenter/topic/${t.url}`}
                  className="bg-white border border-line rounded-card p-4 text-center no-underline hover:border-green hover:shadow-sm transition-all">
                  {t.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.image} alt={t.title} className="w-10 h-10 object-contain mx-auto mb-2" />
                  )}
                  <span className="text-sm font-bold text-ink">{t.title}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {!data && (
          <p className="text-muted text-center py-8">Đang tải nội dung hỗ trợ...</p>
        )}

        {data && data.topKnowledge.length === 0 && data.topics.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted">Chưa có nội dung hỗ trợ. Vui lòng liên hệ trực tiếp.</p>
          </div>
        )}

        {/* Contact */}
        <div className="mt-10 text-center border-t border-line pt-8">
          <p className="text-muted mb-3">Bạn vẫn cần trợ giúp?</p>
          <a href="tel:0374900344" className="btn btn--green">Liên hệ ngay: 0374 900 344</a>
        </div>
      </div>
    </div>
  )
}
