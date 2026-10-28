import type { CSSProperties } from 'react'
import type { StickerView } from '@/lib/api/stickers'

type Art = Pick<StickerView, 'image' | 'emoji' | 'name'> & { rarity?: StickerView['rarity'] }

const SPARKLES: Record<'rare' | 'epic', { x: number; y: number; s: number; d: number }[]> = {
  rare: [{ x: 14, y: 20, s: 13, d: 0 }, { x: 80, y: 30, s: 9, d: 0.9 }, { x: 70, y: 80, s: 11, d: 1.7 }],
  epic: [{ x: 12, y: 18, s: 14, d: 0 }, { x: 84, y: 22, s: 10, d: 0.5 }, { x: 88, y: 62, s: 13, d: 1.1 }, { x: 16, y: 74, s: 9, d: 1.6 }, { x: 52, y: 8, s: 8, d: 0.8 }, { x: 60, y: 88, s: 11, d: 2.1 }],
}

/** A stable hue from the name, so every common sticker has its own pastel colour. */
function hueOf(name: string): number {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.codePointAt(0)!) % 360
  return h
}

/**
 * The picture of a sticker. An uploaded image wins; without one the sticker is drawn here as a die-cut badge around its emoji,
 * and the rarity sets the effect: common = pastel, rare = glossy blue with a sweeping shine, epic = holographic with glitter and a glow.
 */
export default function StickerArt({ sticker, className = 'size-full' }: { sticker: Art; className?: string }) {
  if (sticker.image) return <PhotoArt sticker={sticker} className={className} />
  const rarity = sticker.rarity ?? 'common'
  const hue = hueOf(sticker.name)
  const style = { containerType: 'inline-size', '--stk-hue': hue } as CSSProperties
  return (
    <span className={`${className} relative block aspect-square`} role="img" aria-label={sticker.name} style={style}>
      <span className={`stk stk-${rarity}`}>
        <span className="stk-face" />
        {rarity === 'epic' && <span className="stk-holo" />}
        {rarity !== 'common' && <span className="stk-sweep" />}
        <span className="stk-emoji">{sticker.emoji ?? '⭐'}</span>
        {rarity !== 'common' && SPARKLES[rarity].map((p, i) => (
          <span key={i} className="stk-spark" style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.s}cqw`, height: `${p.s}cqw`, animationDelay: `${p.d}s` }} />
        ))}
      </span>
    </span>
  )
}

/**
 * An uploaded picture with the rarity effect drawn around its outline: the glow follows the shape of the artwork (drop-shadow),
 * a halo sits behind it, a white copy of the shape flashes in a moving band (the shine) and sparkles float around.
 * Common stickers stay plain, with a soft shadow.
 */
function PhotoArt({ sticker, className }: { sticker: Art; className: string }) {
  const rarity = sticker.rarity ?? 'common'
  if (rarity === 'common') {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={sticker.image!} alt={sticker.name} className={`${className} object-contain`} />
  }
  return (
    <span className={`${className} relative block aspect-square`} role="img" aria-label={sticker.name} style={{ containerType: 'inline-size' } as CSSProperties}>
      <span className={`stp-halo stp-halo-${rarity}`} />
      {rarity === 'epic' && <span className="stp-rays" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={sticker.image!} alt="" className={`stp-img stp-img-${rarity}`} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={sticker.image!} alt="" aria-hidden className={`stp-img stp-flash stp-flash-${rarity}`} />
      {SPARKLES[rarity].map((p, i) => (
        <span key={i} className={`stk-spark stp-spark-${rarity}`} style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.s}cqw`, height: `${p.s}cqw`, animationDelay: `${p.d}s` }} />
      ))}
    </span>
  )
}
