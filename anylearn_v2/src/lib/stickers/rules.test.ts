import { describe, expect, it } from 'vitest'
import type { StickerItem } from '@/lib/api/stickers'
import { progressText, stickerInviteLink, tradables, tradeStep, wantables } from './rules'

const item = (id: number, rarity: StickerItem['rarity'], qty: number, tradable = Math.max(qty - 1, 0)): StickerItem =>
  ({ id, name: `s${id}`, description: null, emoji: '⭐', image: null, rarity, rarityLabel: '', qty, tradable })

const items = [item(1, 'common', 3), item(2, 'common', 0), item(3, 'rare', 0), item(4, 'common', 1), item(5, 'common', 0)]

describe('stickers rules', () => {
  it('lists only stickers with a tradable duplicate', () => {
    expect(tradables(items).map(i => i.id)).toEqual([1])
  })
  it('offers only missing stickers of the same rarity', () => {
    expect(wantables(items, items[0]).map(i => i.id)).toEqual([2, 5])
    expect(wantables(items, null)).toEqual([])
  })
  it('walks the trade form step by step', () => {
    expect(tradeStep(null, null, '')).toBe('give')
    expect(tradeStep(items[0], null, '')).toBe('want')
    expect(tradeStep(items[0], items[1], '09')).toBe('phone')
    expect(tradeStep(items[0], items[1], '0912 345 678')).toBe('ready')
  })
  it('points the invite link at the sticker game', () => {
    expect(stickerInviteLink('https://anylearn.vn/ref/0912345678')).toBe('https://anylearn.vn/ref/0912345678?game=sticker')
    expect(stickerInviteLink('https://anylearn.vn/ref/0912345678?game=quiz')).toBe('https://anylearn.vn/ref/0912345678?game=sticker')
  })
  it('writes the progress', () => {
    expect(progressText(3, 12)).toBe('3/12')
  })
})
