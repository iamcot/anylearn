import { describe, expect, it } from 'vitest'
import { bannerStyle, invitePath, shareText, shareUrl, siteOrigin } from './share'

describe('achievement share helpers', () => {
  it('builds the origin and share url', () => {
    expect(siteOrigin(undefined)).toBe('https://anylearn.vn')
    expect(siteOrigin('https://x.vn/')).toBe('https://x.vn')
    expect(siteOrigin('nonsense')).toBe('https://anylearn.vn')
    expect(shareUrl('abc', 'https://x.vn')).toBe('https://x.vn/share/abc')
  })
  it('builds the invitation path with the banner token', () => {
    expect(invitePath('0912345678', 'quiz', 'tok')).toBe('/ref/0912345678?game=quiz&a=tok')
  })
  it('writes the share text', () => {
    expect(shareText({ title: 'Lên hạng Vàng' }, 'u')).toContain('Lên hạng Vàng')
  })
  it('picks the banner style from the icon', () => {
    expect(bannerStyle('streak').kind).toBe('streak')
    expect(bannerStyle('place2')).toEqual({ kind: 'rank', key: 'bac' })
    expect(bannerStyle('kimcuong')).toEqual({ kind: 'rank', key: 'kimcuong' })
  })
})
