import type { Rarity, StickerItem } from '@/lib/api/stickers'

export const RARITY_STYLE: Record<Rarity, { ring: string; chip: string; label: string }> = {
  common: { ring: 'border-line', chip: 'bg-slate-100 text-muted', label: 'Thường' },
  rare: { ring: 'border-blue', chip: 'bg-blue/10 text-blue', label: 'Hiếm' },
  epic: { ring: 'border-[#a855f7]', chip: 'bg-[#a855f7]/10 text-[#7e22ce]', label: 'Siêu hiếm' },
}

/** Stickers the person holds more than once and may trade. */
export function tradables(items: StickerItem[]): StickerItem[] {
  return items.filter(item => item.tradable > 0)
}

/** What can be asked for in return: the same rarity (the rule of the game) and not owned yet. */
export function wantables(items: StickerItem[], give: StickerItem | null): StickerItem[] {
  if (!give) return []
  return items.filter(item => item.rarity === give.rarity && item.qty === 0)
}

export type TradeStep = 'give' | 'want' | 'phone' | 'ready'

export function tradeStep(give: StickerItem | null, want: StickerItem | null, phone: string): TradeStep {
  if (!give) return 'give'
  if (!want) return 'want'
  return phone.replace(/\D/g, '').length >= 8 ? 'ready' : 'phone'
}

/** The invite link of the account, pointed at the sticker game so the new person lands on the album. */
export function stickerInviteLink(referralLink: string): string {
  const url = referralLink.split('?')[0]
  return `${url}?game=sticker`
}

export function progressText(owned: number, total: number): string {
  return `${owned}/${total}`
}
