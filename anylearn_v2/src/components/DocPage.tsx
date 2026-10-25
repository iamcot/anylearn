import { formatDate } from '@/lib/format/date'
import type { PolicyDoc } from '@/lib/docs/fetchDoc'

export default function DocPage({ title, doc }: { title: string; doc: PolicyDoc | null }) {
  return (
    <section className="py-10 lg:py-14">
      <div className="container max-w-[780px]">
        <h1 className="m-0 mb-2 text-[clamp(24px,4vw,36px)] font-extrabold text-ink">{title}</h1>
        {doc?.updatedAt && <p className="m-0 mb-8 text-sm text-muted">Cập nhật lần cuối: {formatDate(doc.updatedAt)}</p>}
        {doc?.content
          ? <div className="rich-content" dangerouslySetInnerHTML={{ __html: doc.content }} />
          : <p className="text-muted">Nội dung đang được cập nhật.</p>
        }
      </div>
    </section>
  )
}
