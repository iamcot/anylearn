import { describe, expect, it } from 'vitest'
import { countText, postLink, videoSource } from './media'

describe('explore media helpers', () => {
  it('turns YouTube links into embeds and keeps files', () => {
    expect(videoSource('https://youtu.be/abcDEF12345')).toEqual({ kind: 'youtube', src: 'https://www.youtube.com/embed/abcDEF12345?playsinline=1&rel=0' })
    expect(videoSource('https://www.youtube.com/watch?v=abcDEF12345&t=3').kind).toBe('youtube')
    expect(videoSource('https://cdn.x.vn/a.mp4')).toEqual({ kind: 'file', src: 'https://cdn.x.vn/a.mp4' })
  })
  it('shortens counts', () => {
    expect(countText(950)).toBe('950')
    expect(countText(1234)).toBe('1,2K')
    expect(countText(2000)).toBe('2K')
    expect(countText(12500)).toBe('13K')
  })
  it('builds the post link', () => {
    expect(postLink('https://anylearn.vn/', 7)).toBe('https://anylearn.vn/today/fun/explore?p=7')
  })
})
