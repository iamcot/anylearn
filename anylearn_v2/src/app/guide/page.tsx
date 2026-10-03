import { Metadata } from 'next'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/v2/api'

const GUIDE_TITLES: Record<string, string> = {
  guide_toc: 'Điều khoản sử dụng',
  guide_del_account: 'Điều khoản xóa tài khoản',
  guide_privacy: 'Chính sách bảo mật thông tin',
  guide_payment_term: 'Chính sách bảo mật thanh toán',
  guide_toc_partner: 'Chính sách dành cho học viên - giảng viên',
  guide_return_term: 'Chính sách đổi - trả và hoàn tiền',
  guide_dispute_resolution: 'Quy trình giải quyết tranh chấp',
  guide_about: 'Giới thiệu về anyLEARN',
  guide_member: 'Hướng dẫn thành viên',
  guide_checkout: 'Hướng dẫn thanh toán',
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ p?: string }> }): Promise<Metadata> {
  const { p } = await searchParams
  const title = p ? (GUIDE_TITLES[p] ?? 'Hướng dẫn') : 'Hướng dẫn'
  return { title: `${title} - anyLEARN` }
}

async function fetchDoc(key: string): Promise<{ content: string; updatedAt?: string } | null> {
  try {
    const res = await fetch(`${BASE}/doc/${key}`, { next: { revalidate: 3600 } })
    const json = await res.json()
    if (json?.resultCode === 1 && json?.data) return json.data
  } catch {}
  return null
}

export default async function GuidePage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const { p } = await searchParams
  if (!p) return <section className="section"><div className="container"><p className="text-muted">Trang không tìm thấy.</p></div></section>

  const doc = await fetchDoc(p)
  const title = GUIDE_TITLES[p] ?? 'Hướng dẫn'

  return (
    <section className="section">
      <div className="container max-w-[780px]">
        <h1 className="text-[clamp(24px,4vw,36px)] font-black text-ink mb-2">{title}</h1>
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
