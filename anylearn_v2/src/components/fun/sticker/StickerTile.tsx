import BrandText from '../BrandText'
import type { StickerItem } from '@/lib/api/stickers'
import { RARITY_STYLE } from '@/lib/stickers/rules'
import { listedLabel } from '@/lib/stickers/market'
import StickerArt, { UnknownArt } from './StickerArt'

export default function StickerTile({ item, selected, reveal, onClick }: { item: StickerItem; selected?: boolean; reveal?: boolean; onClick?: () => void }) {
  const have = item.qty > 0
  const style = RARITY_STYLE[item.rarity]
  const known = have || reveal
  const listed = have ? listedLabel(item) : null
  // a collected rare or epic sticker gets a band of light running round its tile
  const glow = have && item.rarity !== 'common' ? `glow-ring glow-${item.rarity}` : ''
  const body = (
    <>
      <div className={`relative grid aspect-square w-full place-items-center rounded-2xl border-2 bg-white p-1 ${style.ring} ${glow} ${selected ? 'ring-4 ring-green/50' : ''}`}>
        {known ? <StickerArt sticker={item} className="size-[94%]" /> : <UnknownArt rarity={item.rarity} className="size-[94%]" />}
        {item.qty > 1 && <span className="absolute -right-1 -top-1 z-[2] rounded-full bg-green px-1.5 py-0.5 text-[11px] font-black text-white">x{item.qty}</span>}
      </div>
      <div className="mt-1 line-clamp-2 text-center text-[12px] font-bold leading-tight text-ink">{known ? <BrandText text={item.name} /> : '???'}</div>
      <div className="flex flex-wrap items-center justify-center gap-1">
        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${style.chip}`}>{style.label}</span>
        {listed && <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">{listed}</span>}
      </div>
    </>
  )
  return onClick
    ? <button type="button" onClick={onClick} aria-pressed={selected} className="cursor-pointer border-0 bg-transparent p-0 text-left">{body}</button>
    : <div>{body}</div>
}
