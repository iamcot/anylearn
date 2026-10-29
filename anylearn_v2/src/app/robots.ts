import type { MetadataRoute } from 'next'
import { siteOrigin } from '@/lib/achievements/share'
import { ROBOTS_DISALLOW } from '@/lib/seo/sitemap'

/** robots.txt (plan 19.A1): personal pages stay out of search engines; everything else is listed in the sitemap. */
export default function robots(): MetadataRoute.Robots {
  const origin = siteOrigin()
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ROBOTS_DISALLOW }],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  }
}
