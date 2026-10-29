import { SHARE_CARDS, SHARE_CARD_KEYS, isShareCardKey } from '@/config/shareCards'
import { renderShareImage } from '@/lib/og/shareImage'

// Link preview pictures of the top-level pages (`/og-image/fun`, ...), drawn once at build time from config/shareCards.ts.
export const dynamic = 'force-static'
export const dynamicParams = false

export function generateStaticParams() {
  return SHARE_CARD_KEYS.map(page => ({ page }))
}

export async function GET(_request: Request, { params }: { params: Promise<{ page: string }> }) {
  const { page } = await params
  if (!isShareCardKey(page)) return new Response('Not found', { status: 404 })
  return renderShareImage(SHARE_CARDS[page])
}
