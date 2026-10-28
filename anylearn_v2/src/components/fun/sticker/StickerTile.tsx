import type { StickerItem } from '@/lib/api/stickers'
import { RARITY_STYLE } from '@/lib/stickers/rules'
import StickerArt from './StickerArt'

export default function StickerTile({ item, selected, onClick }: { item: StickerItem; selected?: boolean; onClick?: () => void }) {
  const have = item.qty > 0
  const style = RARITY_STYLE[item.rarity]
  const body = (
    <>
      <div className={`relative grid aspect-square w-full place-items-center rounded-2xl border-2 bg-white p-2 ${style.ring} ${selected ? 'ring-4 ring-green/50' : ''} ${have ? '' : 'opacity-45 grayscale'}`}>
        <StickerArt sticker={item} className="size-[72%]" />
        {item.qty > 1 && <span className="absolute -right-1 -top-1 rounded-full bg-green px-1.5 py-0.5 text-[11px] font-black text-white">x{item.qty}</span>}
      </div>
      <div className="mt-1 line-clamp-2 text-center text-[12px] font-bold leading-tight text-ink">{have ? item.name : '???'}</div>
      <div className="text-center"><span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${style.chip}`}>{style.label}</span></div>
    </>
  )
  return onClick
    ? <button type="button" onClick={onClick} aria-pressed={selected} className="cursor-pointer border-0 bg-transparent p-0 text-left">{body}</button>
    : <div>{body}</div>
}
