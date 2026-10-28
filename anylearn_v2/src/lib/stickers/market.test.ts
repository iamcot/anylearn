import { describe, expect, it } from 'vitest'
import type { MarketListing, StickerItem, StickerView } from '@/lib/api/stickers'
import { createStep, expiresText, listable, listedLabel, slotsLeft, takeChoices, toggleGive, wantChoices } from './market'

const item = (id: number, rarity: StickerItem['rarity'], qty: number, tradable = Math.max(qty - 1, 0), listed = 0): StickerItem =>
  ({ id, name: `s${id}`, description: null, emoji: '⭐', image: null, rarity, rarityLabel: '', collectionId: 1, qty, tradable, listed })

const items = [item(1, 'rare', 3), item(2, 'rare', 2), item(3, 'rare', 2, 0, 1), item(4, 'rare', 0), item(5, 'common', 4), item(6, 'rare', 4), item(7, 'rare', 0)]

describe('sticker market helpers', () => {
  it('lists only copies that are free to give away', () => {
    expect(listable(items).map(i => i.id)).toEqual([1, 2, 5, 6])
  })

  it('picks up to three of one rarity and restarts on another rarity', () => {
    let sel: StickerItem[] = []
    sel = toggleGive(sel, items[0])
    sel = toggleGive(sel, items[1])
    sel = toggleGive(sel, items[5])
    expect(sel.map(i => i.id)).toEqual([1, 2, 6])
    expect(toggleGive(sel, items[4]).map(i => i.id)).toEqual([5])
    expect(toggleGive(sel, item(8, 'rare', 2)).map(i => i.id)).toEqual([1, 2, 6])
    expect(toggleGive(sel, items[1]).map(i => i.id)).toEqual([1, 6])
  })

  it('offers missing stickers of the picked rarity as the wish', () => {
    expect(wantChoices(items, [items[0]]).map(i => i.id)).toEqual([4, 7])
    expect(wantChoices(items, [])).toEqual([])
  })

  it('walks the create flow', () => {
    expect(createStep([], null)).toBe('give')
    expect(createStep([items[0]], null)).toBe('want')
    expect(createStep([items[0]], items[3])).toBe('ready')
  })

  it('counts free slots', () => {
    expect(slotsLeft(1, 3)).toBe(2)
    expect(slotsLeft(5, 3)).toBe(0)
  })

  it('writes the time left', () => {
    const now = new Date('2026-10-28T12:00:00')
    expect(expiresText('2026-10-31T12:30:00', now)).toBe('còn 3 ngày')
    expect(expiresText('2026-10-28T17:00:00', now)).toBe('còn 5 giờ')
    expect(expiresText('2026-10-28T12:20:00', now)).toBe('sắp hết hạn')
    expect(expiresText('2026-10-28T11:00:00', now)).toBe('đã hết hạn')
  })

  it('names listed copies', () => {
    expect(listedLabel(item(1, 'rare', 3, 0, 0))).toBeNull()
    expect(listedLabel(item(1, 'rare', 3, 0, 1))).toBe('Đang rao')
    expect(listedLabel(item(1, 'rare', 3, 0, 2))).toBe('Đang rao x2')
  })

  it('lets a taker pick only the offered stickers they lack', () => {
    const view = (id: number): StickerView => ({ id, name: `s${id}`, description: null, emoji: null, image: null, rarity: 'rare', rarityLabel: '' })
    const listing = { offers: [{ ...view(1), lacking: false }, { ...view(2), lacking: true }] } as unknown as MarketListing
    expect(takeChoices(listing).map(o => o.id)).toEqual([2])
  })
})
