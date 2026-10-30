import { getSitemapPage } from '@/lib/api/seo'
import { siteOrigin } from '@/lib/achievements/share'
import { entryOf, parseFileName, STATIC_ENTRIES, urlsetXml, type SitemapEntry } from '@/lib/seo/sitemap'

export const dynamic = 'force-dynamic'

/** One file of the sitemap: /sitemaps/static.xml or /sitemaps/{type}-{page}.xml. */
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const parsed = parseFileName((await params).file)
  if (!parsed) return new Response('Not found', { status: 404 })
  let entries: SitemapEntry[] = STATIC_ENTRIES
  if (parsed.type !== 'static') {
    const data = await getSitemapPage(parsed.type, parsed.page)
    // the API is down: answer an error so search engines keep the copy they have instead of an empty list
    if (!data) return new Response('Sitemap unavailable', { status: 503, headers: { 'Retry-After': '600' } })
    entries = data.items.map(entryOf).filter((e): e is SitemapEntry => e !== null)
  }
  return new Response(urlsetXml(siteOrigin(), entries), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  })
}
