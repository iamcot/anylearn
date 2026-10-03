import { Metadata } from 'next'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/v2/api'

export const metadata: Metadata = {
  title: 'Chính sách bảo mật thông tin - anyLEARN',
}

async function fetchDoc(key: string): Promise<{ content: string; updatedAt?: string } | null> {
  try {
    const res = await fetch(`${BASE}/doc/${key}`, { next: { revalidate: 3600 } })
    const json = await res.json()
    if (json?.resultCode === 1 && json?.data) return json.data
  } catch {}
  return null
}

export default async function PrivacyPage() {
  const doc = await fetchDoc('guide_privacy')

  return (
    <section className="section">
      <div className="container max-w-[780px]">
        <h1 className="text-[clamp(24px,4vw,36px)] font-black text-ink mb-2">Chính sách bảo mật thông tin</h1>
        {doc?.updatedAt && (
          <p className="text-muted text-sm mb-8">
            Cập nhật lần cuối: {new Date(doc.updatedAt).toLocaleDateString('vi-VN')}
          </p>
        )}
        {doc?.content ? (
          <div
            className="prose max-w-none text-text leading-relaxed"
            dangerouslySetInnerHTML={{ __html: doc.content }}
          />
        ) : (
          <p className="text-muted">Nội dung đang được cập nhật.</p>
        )}
      </div>
    </section>
  )
}
