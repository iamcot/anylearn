import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { ShareArt, ShareCard } from '@/config/shareCards'
import { splitBrand } from '@/lib/fun/brand'

// Draws the link preview picture of a page (1200x630, the size Zalo and Facebook show in full).
// Fonts and pictures are read from public/og: the production deploy ships `public`, not `src` (see the achievement banner).
const PUBLIC_DIR = path.join(process.cwd(), 'public')
const OG_DIR = path.join(PUBLIC_DIR, 'og')
// The game pictures are the ones of the Vui học shortcuts; Leo front and Leo of the Arena were drawn for these cards.
const ART_FILES: Record<Exclude<ShareArt, 'logo'>, string> = {
  leo_front: 'og/leo_front.png',
  leo_arena: 'og/leo_arena.png',
  leo_rank: 'fun/leo_rank.png',
  leo_sticker: 'fun/leo_sticker.png',
  leo_discovery: 'fun/leo_discovery.png',
  leo_shop: 'fun/leo_shop.png',
}
const WIDTH = 1200
const HEIGHT = 630
const GREEN = '#00a651'
const INK = '#17212f'

async function fonts() {
  const read = (file: string) => readFile(path.join(OG_DIR, file))
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

async function dataUri(file: string) {
  return `data:image/png;base64,${(await readFile(path.join(PUBLIC_DIR, file))).toString('base64')}`
}

/**
 * "Leo" and "Leo Xu" are brand text: bold green, like everywhere else in Vui học. The picture library needs one box per word to
 * mix colours and still wrap lines, so the text is cut into words.
 */
function Branded({ text, style }: { text: string; style: React.CSSProperties }) {
  const words = splitBrand(text).flatMap(part => part.text.split(/\s+/).filter(Boolean).map(word => ({ word, brand: part.brand })))
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', ...style }}>
      {words.map((w, i) => (
        <span key={i} style={{ marginRight: '0.27em', ...(w.brand ? { color: GREEN, fontWeight: 800 } : {}) }}>{w.word}</span>
      ))}
    </div>
  )
}

export async function renderShareImage(card: ShareCard): Promise<ImageResponse> {
  const site = card.art === 'logo'
  const [logo, art] = await Promise.all([dataUri('og/anylearn_logo.png'), card.art === 'logo' ? null : dataUri(ART_FILES[card.art])])
  const [from, to] = card.colors

  return new ImageResponse(
    (
      <div style={{ width: WIDTH, height: HEIGHT, display: 'flex', position: 'relative', background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`, fontFamily: 'BVPL, BVP', color: INK }}>
        <div style={{ display: 'flex', position: 'absolute', right: -160, top: -160, width: 560, height: 560, borderRadius: 9999, background: '#ffffff', opacity: 0.55 }} />
        <div style={{ display: 'flex', position: 'absolute', left: 0, bottom: 0, width: WIDTH, height: 14, background: `linear-gradient(90deg, ${GREEN} 0%, #00539b 100%)` }} />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '56px 0 56px 72px', width: site ? 760 : 700 }}>
          {/* The game cards keep the logo small above the text; the site cards show it big on the right instead. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {!site && <img src={logo} alt="" width={260} height={80} style={{ marginBottom: 28, flexShrink: 0 }} />}
          <div style={{ display: 'flex', alignSelf: 'flex-start', flexShrink: 0, padding: '8px 22px', borderRadius: 9999, background: GREEN, color: '#ffffff', fontSize: 26, fontWeight: 800 }}>{card.eyebrow}</div>
          <Branded text={card.headline} style={{ marginTop: 22, fontSize: 66, fontWeight: 800, lineHeight: 1.12 }} />
          <Branded text={card.sub} style={{ marginTop: 22, fontSize: 30, fontWeight: 500, lineHeight: 1.35, color: '#2f3b4a' }} />
          <div style={{ display: 'flex', marginTop: 30, fontSize: 26, fontWeight: 800, color: '#00539b' }}>anylearn.vn</div>
        </div>
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', paddingRight: 40 }}>
          {site ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" width={420} height={129} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={art!} alt="" width={440} height={440} style={{ objectFit: 'contain' }} />
          )}
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT, fonts: await fonts() },
  )
}
