import type { Achievement } from '@/lib/api/achievements'

const DEFAULT_ORIGIN = 'https://anylearn.vn'

/** Public origin of the site, without a trailing slash (links inside the banner and the QR code). */
export function siteOrigin(env: string | undefined = process.env.NEXT_PUBLIC_SITE_URL): string {
  return (env && /^https?:\/\//.test(env) ? env : DEFAULT_ORIGIN).replace(/\/+$/, '')
}

export function shareUrl(token: string, origin = siteOrigin()): string {
  return `${origin}/share/${token}`
}

/** Where the "join us" button of the share page goes: the friend's link, remembering the banner it came from. */
export function invitePath(refCode: string, game: string, token: string): string {
  return `/ref/${encodeURIComponent(refCode)}?game=${encodeURIComponent(game)}&a=${encodeURIComponent(token)}`
}

export function shareText(a: Pick<Achievement, 'title'>, url: string): string {
  return `${a.title}! Cùng chơi Vui học với Leo trên anyLEARN nhé: ${url}`
}

export type BannerKind = 'rank' | 'streak' | 'star'

/** How the banner draws its icon: a medal in a rank colour, a flame for a streak, or a star for a set. */
export function bannerStyle(icon: string): { kind: BannerKind; key: string } {
  if (icon === 'streak') return { kind: 'streak', key: 'vang' }
  if (icon === 'sticker') return { kind: 'star', key: 'bachkim' }
  if (icon === 'place1') return { kind: 'rank', key: 'vang' }
  if (icon === 'place2') return { kind: 'rank', key: 'bac' }
  if (icon === 'place3') return { kind: 'rank', key: 'dong' }
  return { kind: 'rank', key: icon || 'dong' }
}
