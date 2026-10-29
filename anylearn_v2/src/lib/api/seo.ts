import { apiFetch } from './client'
import type { SitemapRow, SitemapSummary, SitemapType } from '@/lib/seo/sitemap'

/** Kept an hour like the server's own cache. */
const HOUR = { next: { revalidate: 3600 } }

export const getSitemapSummary = () => apiFetch<SitemapSummary>('/seo/sitemap', HOUR)
export const getSitemapPage = (type: SitemapType, page: number) =>
  apiFetch<{ items: SitemapRow[] }>(`/seo/sitemap?type=${type}&page=${page}`, HOUR)
