// Structured data (schema.org JSON-LD) of the public pages (plan 19.A2). Pure: every builder takes plain values and
// leaves out what is missing, so a page never claims a figure it does not show.

type Ld = Record<string, unknown>

const CONTEXT = 'https://schema.org'

/** The JSON text for a <script type="application/ld+json">, safe inside HTML (no "</script>" can end it early). */
export function jsonLdText(data: Ld | Ld[]): string {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
}

function clean<T extends Ld>(data: T): T {
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0))) as T
}

function plain(text: string | null | undefined, max = 300): string | undefined {
  const t = (text ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  if (!t) return undefined
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t
}

export interface RatingInput { value: number | null | undefined; count: number | null | undefined }

/** An AggregateRating, only with at least one review and a value between 1 and 5. */
export function ratingLd(rating: RatingInput | null | undefined): Ld | undefined {
  if (!rating || !rating.count || rating.count < 1 || !rating.value || rating.value < 1 || rating.value > 5) return undefined
  return { '@type': 'AggregateRating', ratingValue: Math.round(rating.value * 10) / 10, reviewCount: rating.count, bestRating: 5, worstRating: 1 }
}

export function courseLd(c: {
  url: string; name: string; description?: string | null; image?: string | null
  provider?: { name: string; url?: string } | null; price?: number | null; rating?: RatingInput | null; online?: boolean
}): Ld {
  return clean({
    '@context': CONTEXT,
    '@type': 'Course',
    name: c.name,
    description: plain(c.description) ?? c.name,
    url: c.url,
    image: c.image ?? undefined,
    inLanguage: 'vi',
    provider: c.provider ? clean({ '@type': 'Organization', name: c.provider.name, sameAs: c.provider.url }) : undefined,
    offers: c.price != null && c.price >= 0
      ? { '@type': 'Offer', price: c.price, priceCurrency: 'VND', category: c.price === 0 ? 'Free' : 'Paid', url: c.url, availability: 'https://schema.org/InStock' }
      : undefined,
    hasCourseInstance: c.online != null ? { '@type': 'CourseInstance', courseMode: c.online ? 'online' : 'onsite' } : undefined,
    aggregateRating: ratingLd(c.rating),
  })
}

export interface PlaceInput { title?: string | null; address?: string | null; districtName?: string | null; provinceName?: string | null; lat?: number | null; lng?: number | null }

/** A partner: an EducationalOrganization, also a LocalBusiness when it has an address with coordinates. */
export function organizationLd(o: { url: string; name: string; description?: string | null; image?: string | null; places?: PlaceInput[]; rating?: RatingInput | null }): Ld {
  const places = (o.places ?? []).filter(p => p.lat != null && p.lng != null)
  const main = places[0]
  return clean({
    '@context': CONTEXT,
    '@type': main ? ['EducationalOrganization', 'LocalBusiness'] : 'EducationalOrganization',
    name: o.name,
    description: plain(o.description),
    url: o.url,
    image: o.image ?? undefined,
    logo: o.image ?? undefined,
    address: main ? clean({
      '@type': 'PostalAddress', streetAddress: main.address ?? undefined, addressLocality: main.districtName ?? undefined,
      addressRegion: main.provinceName ?? undefined, addressCountry: 'VN',
    }) : undefined,
    geo: main ? { '@type': 'GeoCoordinates', latitude: main.lat, longitude: main.lng } : undefined,
    department: places.length > 1 ? places.slice(1, 20).map(p => clean({
      '@type': 'LocalBusiness', name: p.title ? `${o.name} - ${p.title}` : o.name,
      address: clean({ '@type': 'PostalAddress', streetAddress: p.address ?? undefined, addressLocality: p.districtName ?? undefined, addressRegion: p.provinceName ?? undefined, addressCountry: 'VN' }),
      geo: { '@type': 'GeoCoordinates', latitude: p.lat, longitude: p.lng },
    })) : undefined,
    aggregateRating: ratingLd(o.rating),
  })
}

/** A Khám phá clip. `uploadDate` is required by Google, so a post without a date gets none of this. */
export function videoLd(v: { url: string; name: string; description?: string | null; thumbnailUrl?: string | null; uploadDate?: string | null; contentUrl?: string | null; embedUrl?: string | null; views?: number | null }): Ld | null {
  if (!v.uploadDate || !v.thumbnailUrl) return null
  return clean({
    '@context': CONTEXT,
    '@type': 'VideoObject',
    name: v.name,
    description: plain(v.description) ?? v.name,
    thumbnailUrl: [v.thumbnailUrl],
    uploadDate: v.uploadDate,
    contentUrl: v.contentUrl ?? undefined,
    embedUrl: v.embedUrl ?? undefined,
    url: v.url,
    inLanguage: 'vi',
    interactionStatistic: v.views ? { '@type': 'InteractionCounter', interactionType: { '@type': 'WatchAction' }, userInteractionCount: v.views } : undefined,
  })
}

/** Breadcrumbs from the home page: [{name, path}] with paths relative to `origin`. */
export function breadcrumbLd(origin: string, items: { name: string; path: string }[]): Ld {
  return {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: origin + it.path })),
  }
}

export function faqLd(items: { question: string; answer: string }[]): Ld {
  return {
    '@context': CONTEXT,
    '@type': 'FAQPage',
    mainEntity: items.map(f => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
  }
}

/** An ISO date-time with the Vietnam offset from the server's "2026-10-29T10:20:00" (no zone) or a full ISO text. */
export function isoVn(at: string | null | undefined): string | null {
  if (!at) return null
  const t = at.trim().replace(' ', 'T')
  if (/[zZ]|[+-]\d\d:?\d\d$/.test(t)) return t
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(t) ? `${t.slice(0, 19)}+07:00` : /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : null
}
