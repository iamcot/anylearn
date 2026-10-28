import { ImageResponse } from 'next/og'
import QRCode from 'qrcode'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { getPublicAchievement } from '@/lib/api/achievements'
import { bannerStyle, shareUrl } from '@/lib/achievements/share'
import { RANK_COLORS } from '@/lib/quiz/rules'

// The achievement banner as a PNG: portrait 1080x1350 for stories and chats, `?size=og` 1200x630 for link previews.
// The default font has no Vietnamese letters, so Be Vietnam Pro is read from src/assets/fonts.
const FONT_DIR = path.join(process.cwd(), 'src', 'assets', 'fonts')

async function fonts() {
  const read = (file: string) => readFile(path.join(FONT_DIR, file))
  const [vi5, la5, vi8, la8] = await Promise.all([
    read('be-vietnam-pro-vietnamese-500-normal.woff'), read('be-vietnam-pro-latin-500-normal.woff'),
    read('be-vietnam-pro-vietnamese-800-normal.woff'), read('be-vietnam-pro-latin-800-normal.woff'),
  ])
  return [
    { name: 'BVP', data: vi5, weight: 500 as const, style: 'normal' as const },
    { name: 'BVPL', data: la5, weight: 500 as const, style: 'normal' as const },
    { name: 'BVP', data: vi8, weight: 800 as const, style: 'normal' as const },
    { name: 'BVPL', data: la8, weight: 800 as const, style: 'normal' as const },
  ]
}

function Icon({ icon, size }: { icon: string; size: number }) {
  const { kind, key } = bannerStyle(icon)
  const [light, dark] = RANK_COLORS[key] ?? RANK_COLORS.dong
  if (kind === 'streak') {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64">
        <path d="M32 4c2 10 14 16 14 32a14 14 0 0 1-28 0c0-8 4-12 7-16 1 5 3 7 5 8-1-8 0-17 2-24z" fill={dark} />
        <path d="M32 24c1 6 8 9 8 18a8 8 0 0 1-16 0c0-5 3-7 5-10 1 3 2 4 3 4-1-4-1-8 0-12z" fill={light} />
      </svg>
    )
  }
  if (kind === 'star') {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64">
        <path d="M32 4l8.500 17.500 19 2.700-13.800 13.400 3.300 19L32 47.500 15 56.600l3.300-19L4.500 24.200l19-2.700z" fill={dark} />
        <path d="M32 11l6.200 12.800 14 2-10.100 9.800 2.400 13.900L32 42.900 19.500 49.500l2.400-13.900L11.800 25.800l14-2z" fill={light} />
      </svg>
    )
  }
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <path d="M32 3l22 8v18c0 15-9 26-22 32C19 55 10 44 10 29V11z" fill={dark} />
      <path d="M32 7l18 6.500V29c0 12.500-7.500 22-18 27.500C21.500 51 14 41.500 14 29V13.500z" fill={light} />
      <path d="M32 18l3.600 7.500 8.200 1.100-6 5.800 1.500 8.100L32 36.400l-7.300 4.100 1.500-8.100-6-5.800 8.200-1.100z" fill="#ffffff" />
    </svg>
  )
}

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const og = new URL(request.url).searchParams.get('size') === 'og'
  const a = await getPublicAchievement(token)
  if (!a) return new Response('Not found', { status: 404 })

  const width = og ? 1200 : 1080
  const height = og ? 630 : 1350
  const qr = await QRCode.toDataURL(shareUrl(token), { margin: 1, width: 320, color: { dark: '#0f172a', light: '#ffffff' } })
  const iconSize = og ? 260 : 440

  return new ImageResponse(
    (
      <div style={{ width, height, display: 'flex', flexDirection: og ? 'row' : 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg,#e8f8ee,#fff7e0)', fontFamily: 'BVPL, BVP', padding: og ? 56 : 72, gap: og ? 56 : 40 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Icon icon={a.icon} size={iconSize} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: og ? 'flex-start' : 'center', textAlign: og ? 'left' : 'center', ...(og ? { flex: 1 } : {}) }}>
          <div style={{ display: 'flex', fontSize: og ? 28 : 40, fontWeight: 800, color: '#15803d' }}>anyLEARN · Vui học</div>
          <div style={{ display: 'flex', marginTop: 16, fontSize: og ? 56 : 76, fontWeight: 800, color: '#0f172a', lineHeight: 1.15 }}>{a.title}</div>
          <div style={{ display: 'flex', marginTop: 16, fontSize: og ? 30 : 42, fontWeight: 500, color: '#475569' }}>{a.subtitle}</div>
          <div style={{ display: 'flex', marginTop: 24, fontSize: og ? 32 : 46, fontWeight: 800, color: '#b45309' }}>{a.name}</div>
        </div>
        {!og && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginTop: 24 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} width={220} height={220} />
            <div style={{ display: 'flex', flexDirection: 'column', fontSize: 34, fontWeight: 500, color: '#334155', maxWidth: 520 }}>
              <div style={{ display: 'flex', fontWeight: 800 }}>Quét mã để cùng chơi với Leo</div>
              <div style={{ display: 'flex', marginTop: 8, fontSize: 28 }}>Quà điểm danh mỗi ngày, sưu tầm sticker, leo rank</div>
            </div>
          </div>
        )}
      </div>
    ),
    { width, height, fonts: await fonts(), headers: { 'Cache-Control': 'public, max-age=3600' } },
  )
}
