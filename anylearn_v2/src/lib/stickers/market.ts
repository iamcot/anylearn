import type { ListingStatus, MarketListing, MarketOffer, StickerItem } from '@/lib/api/stickers'

/** Keep in step with `StickerMarketRules.MAX_OFFERED` on the server. */
export const MAX_OFFERED = 3

/** Stickers that can be put on the market: a spare copy that is not locked or already listed. */
export function listable(items: StickerItem[]): StickerItem[] {
  return items.filter(item => item.tradable > 0)
}

/** Picks or un-picks a sticker to offer. Up to 3 of one rarity: choosing another rarity starts the pick again. */
export function toggleGive(selected: StickerItem[], item: StickerItem): StickerItem[] {
  if (selected.some(s => s.id === item.id)) return selected.filter(s => s.id !== item.id)
  if (selected.length > 0 && selected[0].rarity !== item.rarity) return [item]
  if (selected.length >= MAX_OFFERED) return selected
  return [...selected, item]
}

/** What can be asked for: a sticker of the picked rarity that the person does not own. */
export function wantChoices(items: StickerItem[], selected: StickerItem[]): StickerItem[] {
  if (selected.length === 0) return []
  return items.filter(item => item.rarity === selected[0].rarity && item.qty === 0)
}

export type CreateStep = 'give' | 'want' | 'ready'

export function createStep(selected: StickerItem[], want: StickerItem | null): CreateStep {
  if (selected.length === 0) return 'give'
  return want ? 'ready' : 'want'
}

export function slotsLeft(openCount: number, maxListings: number): number {
  return Math.max(maxListings - openCount, 0)
}

/** "còn 3 ngày", "còn 5 giờ", "sắp hết hạn". */
export function expiresText(expiresAt: string, now: Date = new Date()): string {
  const ms = new Date(expiresAt).getTime() - now.getTime()
  if (Number.isNaN(ms) || ms <= 0) return 'đã hết hạn'
  const hours = Math.floor(ms / 3_600_000)
  if (hours >= 24) return `còn ${Math.floor(hours / 24)} ngày`
  if (hours >= 1) return `còn ${hours} giờ`
  return 'sắp hết hạn'
}

export const STATUS_LABEL: Record<ListingStatus, string> = {
  open: 'Đang rao',
  done: 'Đã đổi xong',
  cancelled: 'Đã gỡ',
  expired: 'Hết hạn',
}

/** The offered stickers the viewer can pick when pressing "Đổi": only the ones they do not own. */
export function takeChoices(listing: MarketListing): MarketOffer[] {
  return listing.offers.filter(offer => offer.lacking)
}

/** The label under a tile for a copy promised on the market. */
export function listedLabel(item: Pick<StickerItem, 'listed'>): string | null {
  return item.listed > 0 ? (item.listed > 1 ? `Đang rao x${item.listed}` : 'Đang rao') : null
}
