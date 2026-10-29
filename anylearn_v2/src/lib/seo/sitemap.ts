// Pure helpers of sitemap.xml (plan 19.A1). The server lists the links (`GET /api/seo/sitemap`), the site builds the
// addresses and the XML: an index at /sitemap.xml, then one file per type and page at /sitemaps/{type}-{page}.xml.

export type SitemapType = 'course' | 'partner' | 'article' | 'collection' | 'pathway' | 'explore' | 'landing'
export interface SitemapRow { type: SitemapType; id: number; slug: string | null; updatedAt: string | null }
export interface SitemapSummary { pageSize: number; types: { type: SitemapType; count: number; pages: number }[] }
export interface SitemapEntry { path: string; lastmod?: string | null; changefreq?: 'daily' | 'weekly' | 'monthly'; priority?: number }

export const SITEMAP_TYPES: SitemapType[] = ['course', 'partner', 'article', 'collection', 'pathway', 'explore', 'landing']

/** Pages of the site that are not built from data: open to visitors, worth finding on Google. */
export const STATIC_ENTRIES: SitemapEntry[] = [
  { path: '/', changefreq: 'daily', priority: 1 },
  { path: '/search', changefreq: 'daily', priority: 0.8 },
  { path: '/discover', changefreq: 'daily', priority: 0.6 },
  { path: '/article', changefreq: 'weekly', priority: 0.6 },
  { path: '/info', changefreq: 'monthly', priority: 0.5 },
  { path: '/info/why-anylearn', changefreq: 'monthly', priority: 0.6 },
  { path: '/info/anypoint', changefreq: 'monthly', priority: 0.4 },
  { path: '/info/anypoint-expiry', changefreq: 'monthly', priority: 0.3 },
  { path: '/guide', changefreq: 'monthly', priority: 0.3 },
  { path: '/helpcenter', changefreq: 'monthly', priority: 0.3 },
  { path: '/privacy', changefreq: 'monthly', priority: 0.1 },
  { path: '/terms', changefreq: 'monthly', priority: 0.1 },
]

/** Pages robots.txt keeps out of search engines: personal or one-off steps. */
export const ROBOTS_DISALLOW = ['/account', '/checkout', '/order', '/today', '/compare', '/add2cart', '/learn', '/ai-suggest']

const PRIORITY: Record<SitemapType, number> = { course: 0.9, landing: 0.8, partner: 0.7, collection: 0.7, pathway: 0.6, article: 0.6, explore: 0.5 }

/** Where a row lives on the site, or null when it cannot be linked. */
export function pathOf(row: SitemapRow): string | null {
  const slug = row.slug ? encodeURIComponent(row.slug).replace(/%2F/gi, '/') : ''
  switch (row.type) {
    case 'course': return `/class/${row.id}/${slug || 'khoa-hoc'}`
    case 'partner': return `/partner/${row.id}`
    case 'article': return `/article/${row.id}/${slug || 'bai-viet'}.html`
    case 'collection': return slug ? `/collections/${slug}` : null
    case 'pathway': return slug ? `/pathway/${slug}` : null
    case 'explore': return `/fun/explore/${row.id}/${slug || 'bai-viet'}`
    case 'landing': return slug ? `/hoc/${slug}` : null
    default: return null
  }
}

export function entryOf(row: SitemapRow): SitemapEntry | null {
  const path = pathOf(row)
  return path ? { path, lastmod: row.updatedAt, changefreq: 'weekly', priority: PRIORITY[row.type] } : null
}

/** Names of the files the index lists: "static", then "{type}-{page}" for every page of every type. */
export function fileNames(summary: SitemapSummary | null): string[] {
  const names = ['static']
  for (const t of summary?.types ?? []) {
    if (!SITEMAP_TYPES.includes(t.type)) continue
    for (let page = 1; page <= t.pages; page++) names.push(`${t.type}-${page}`)
  }
  return names
}

/** "course-2.xml" → {type: 'course', page: 2}; "static.xml" → {type: 'static', page: 1}; anything else → null. */
export function parseFileName(name: string): { type: SitemapType | 'static'; page: number } | null {
  const m = name.match(/^([a-z]+)(?:-(\d{1,4}))?\.xml$/)
  if (!m) return null
  if (m[1] === 'static') return m[2] ? null : { type: 'static', page: 1 }
  if (!SITEMAP_TYPES.includes(m[1] as SitemapType) || !m[2]) return null
  const page = Number(m[2])
  return page >= 1 ? { type: m[1] as SitemapType, page } : null
}

export function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

const HEAD = '<?xml version="1.0" encoding="UTF-8"?>\n'

export function urlsetXml(origin: string, entries: SitemapEntry[]): string {
  const urls = entries.map(e => {
    const parts = [`<loc>${escapeXml(origin + e.path)}</loc>`]
    if (e.lastmod) parts.push(`<lastmod>${escapeXml(e.lastmod)}</lastmod>`)
    if (e.changefreq) parts.push(`<changefreq>${e.changefreq}</changefreq>`)
    if (e.priority != null) parts.push(`<priority>${e.priority.toFixed(1)}</priority>`)
    return `<url>${parts.join('')}</url>`
  })
  return `${HEAD}<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
}

export function indexXml(origin: string, names: string[]): string {
  const items = names.map(n => `<sitemap><loc>${escapeXml(`${origin}/sitemaps/${n}.xml`)}</loc></sitemap>`)
  return `${HEAD}<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items.join('\n')}\n</sitemapindex>\n`
}
