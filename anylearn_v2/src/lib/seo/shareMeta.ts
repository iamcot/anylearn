import type { Metadata } from 'next'
import { SHARE_CARDS, shareImagePath, type ShareCardKey } from '@/config/shareCards'

type OgImages = NonNullable<NonNullable<Metadata['openGraph']>['images']>

/** The card picture of a page, as Open Graph images (1200x630). */
export function shareImages(key: ShareCardKey): OgImages {
  return [{ url: shareImagePath(key), width: 1200, height: 630, alt: SHARE_CARDS[key].headline }]
}

/**
 * Metadata of a page whose shared link shows a card of config/shareCards.ts. Next.js replaces `openGraph` as a whole per page,
 * so every page that has its own text sets it here: otherwise it would keep the og:title of the home page.
 */
export function shareMeta(key: ShareCardKey, override: { title?: string; description?: string; ogTitle?: string } = {}): Metadata {
  const card = SHARE_CARDS[key]
  const title = override.title ?? card.title
  const ogTitle = override.ogTitle ?? card.title
  const description = override.description ?? card.description
  const images = shareImages(key)
  return {
    title,
    description,
    openGraph: { type: 'website', siteName: 'anyLEARN', locale: 'vi_VN', title: ogTitle, description, images },
    twitter: { card: 'summary_large_image', title: ogTitle, description, images: [shareImagePath(key)] },
  }
}

/**
 * Metadata of a detail page (course, article, partner, collection): its own text and picture, the home card picture when it has
 * none. Without it the page would show the og:title of the home page that the root layout sets.
 */
export function detailMeta({ title, description, ogTitle, image }: { title: string; description?: string; ogTitle?: string; image?: string | null }): Metadata {
  const shareTitle = ogTitle ?? title
  const images: OgImages = image ? [{ url: image }] : shareImages('home')
  return {
    title,
    description,
    openGraph: { type: 'website', siteName: 'anyLEARN', locale: 'vi_VN', title: shareTitle, description, images },
    twitter: { card: 'summary_large_image', title: shareTitle, description, images: image ? [image] : [shareImagePath('home')] },
  }
}
