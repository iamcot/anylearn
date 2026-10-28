import type { StickerView } from '@/lib/api/stickers'

/** The picture of a sticker, or its emoji when the back office has not uploaded one yet. */
export default function StickerArt({ sticker, className = 'size-full' }: { sticker: Pick<StickerView, 'image' | 'emoji' | 'name'>; className?: string }) {
  if (sticker.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={sticker.image} alt={sticker.name} className={`${className} object-contain`} />
  }
  return <span className={`${className} grid place-items-center text-4xl leading-none`} role="img" aria-label={sticker.name}>{sticker.emoji ?? '⭐'}</span>
}
