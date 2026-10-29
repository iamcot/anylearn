import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { SHARE_CARDS, SHARE_CARD_KEYS, isShareCardKey, shareImagePath } from './shareCards'

describe('share cards', () => {
  it('has short enough texts for a chat preview', () => {
    for (const key of SHARE_CARD_KEYS) {
      const card = SHARE_CARDS[key]
      expect(card.title.length, key).toBeLessThanOrEqual(60)
      expect(card.description.length, key).toBeLessThanOrEqual(200)
      expect(card.headline.length, key).toBeLessThanOrEqual(40)
    }
  })

  it('points the picture at the route of the card', () => {
    expect(shareImagePath('fun')).toMatch(/^\/og-image\/fun\?v=\d+$/)
    expect(isShareCardKey('fun')).toBe(true)
    expect(isShareCardKey('toString')).toBe(false)
  })

  it('ships every picture in public (the production deploy has no src)', () => {
    const files = ['og/anylearn_logo.png', 'og/leo_front.png', 'og/leo_arena.png', 'fun/leo_rank.png', 'fun/leo_sticker.png', 'fun/leo_discovery.png', 'fun/leo_shop.png']
    for (const file of files) expect(existsSync(path.join(process.cwd(), 'public', file)), file).toBe(true)
  })
})
