import { ImageResponse } from 'next/og'
import QRCode from 'qrcode'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { getPublicAchievement } from '@/lib/api/achievements'
import { bannerStyle, shareUrl } from '@/lib/achievements/share'
import AchievementIcon from '@/components/fun/share/AchievementIcon'
import { RANK_COLORS } from '@/lib/quiz/rules'

// The achievement banner as a PNG: portrait 1080x1350 for stories and chats, `?size=og` 1200x630 for link previews.
// The default font has no Vietnamese letters, so Be Vietnam Pro is read from public/og. Everything the banner reads from disk
// lives in public/ on purpose: the production deploy ships `.next`, `public` and package files, but not `src`.
const ASSET_DIR = path.join(process.cwd(), 'public')

async function fonts() {
  const read = (file: string) => readFile(path.join(ASSET_DIR, 'og', file))
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

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const og = new URL(request.url).searchParams.get('size') === 'og'
  const a = await getPublicAchievement(token)
  if (!a) return new Response('Not found', { status: 404 })

  const width = og ? 1200 : 1080
  const height = og ? 630 : 1350
  const qr = await QRCode.toDataURL(shareUrl(token), { margin: 1, width: 320, color: { dark: '#0f172a', light: '#ffffff' } })
  const leo = `data:image/png;base64,${(await readFile(path.join(ASSET_DIR, 'og', 'leo_rank.png'))).toString('base64')}`
  const { kind, key } = bannerStyle(a.icon)
  const [light, dark] = RANK_COLORS[key] ?? RANK_COLORS.dong
  // Leo climbing the steps is the background picture; a rank-up puts the medal of the new rank on it, other banners put their icon.
  const leoSize = og ? 500 : 700
  const iconSize = og ? 220 : 320
  const rankUp = kind === 'rank' && a.type === 'rankup'

  const art = (
    <div style={{ display: 'flex', position: 'relative', width: leoSize, height: leoSize, alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', position: 'absolute', left: leoSize * 0.06, top: leoSize * 0.06, width: leoSize * 0.88, height: leoSize * 0.88, borderRadius: 9999, background: `radial-gradient(circle, ${light}aa 0%, ${light}00 70%)` }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={leo} width={leoSize} height={leoSize} style={{ position: 'absolute', left: 0, top: 0 }} />
      <div style={{ display: 'flex', position: 'absolute', right: -leoSize * 0.02, bottom: leoSize * 0.0 }}>
        <AchievementIcon icon={a.icon} size={iconSize} />
      </div>
    </div>
  )
  const label = rankUp ? 'Hạng mới' : a.type === 'streak' ? 'Kỷ lục chuỗi' : 'Thành tích'

  return new ImageResponse(
    (
      <div style={{ width, height, display: 'flex', flexDirection: og ? 'row' : 'column', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(160deg, #ffffff 0%, ${light}66 55%, ${light}cc 100%)`, fontFamily: 'BVPL, BVP', padding: og ? 40 : 56, gap: og ? 40 : 4 }}>
        {art}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: og ? 'flex-start' : 'center', textAlign: og ? 'left' : 'center', ...(og ? { flex: 1 } : {}) }}>
          <div style={{ display: 'flex', fontSize: og ? 26 : 36, fontWeight: 800, color: '#15803d' }}>anyLEARN · Vui học</div>
          <div style={{ display: 'flex', marginTop: 12, padding: '6px 22px', borderRadius: 9999, background: dark, color: '#ffffff', fontSize: og ? 24 : 32, fontWeight: 800 }}>{label}</div>
          <div style={{ display: 'flex', marginTop: 14, fontSize: og ? 60 : 80, fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>{a.title}</div>
          <div style={{ display: 'flex', marginTop: 12, fontSize: og ? 28 : 38, fontWeight: 500, color: '#334155' }}>{a.subtitle}</div>
          <div style={{ display: 'flex', marginTop: 18, fontSize: og ? 32 : 46, fontWeight: 800, color: '#334155' }}>{a.name}</div>
        </div>
        {!og && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginTop: 20 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} width={190} height={190} style={{ borderRadius: 16 }} />
            <div style={{ display: 'flex', flexDirection: 'column', fontSize: 32, fontWeight: 500, color: '#334155', maxWidth: 560 }}>
              <div style={{ display: 'flex', fontWeight: 800 }}>Quét mã để cùng chơi với Leo</div>
              <div style={{ display: 'flex', marginTop: 8, fontSize: 26 }}>Quà điểm danh mỗi ngày, sưu tầm sticker, leo rank</div>
            </div>
          </div>
        )}
      </div>
    ),
    { width, height, fonts: await fonts(), headers: { 'Cache-Control': 'public, max-age=3600' } },
  )
}
