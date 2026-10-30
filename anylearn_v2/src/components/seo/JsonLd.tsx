import { jsonLdText } from '@/lib/seo/jsonLd'

/** Structured data of a page for search engines (lib/seo/jsonLd.ts builds it). Nulls are skipped. */
export default function JsonLd({ data }: { data: (Record<string, unknown> | null | undefined)[] }) {
  const list = data.filter((d): d is Record<string, unknown> => !!d)
  if (list.length === 0) return null
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdText(list.length === 1 ? list[0] : list) }} />
}
