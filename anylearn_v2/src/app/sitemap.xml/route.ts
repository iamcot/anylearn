import { getSitemapSummary } from '@/lib/api/seo'
import { siteOrigin } from '@/lib/achievements/share'
import { fileNames, indexXml } from '@/lib/seo/sitemap'

// Built when asked (the API is not reachable at build time) and kept an hour.
export const dynamic = 'force-dynamic'

/** The sitemap index (plan 19.A1): one file of fixed pages, then the files of each kind of link. */
export async function GET() {
  const summary = await getSitemapSummary()
  return new Response(indexXml(siteOrigin(), fileNames(summary)), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  })
}
