import { describe, expect, it } from 'vitest'
import { countText, postLink, videoSource } from './media'

describe('explore media helpers', () => {
  it('turns YouTube links into embeds and keeps files', () => {
    expect(videoSource('https://youtu.be/abcDEF12345')).toEqual({ kind: 'youtube', src: 'https://www.youtube.com/embed/abcDEF12345?playsinline=1&rel=0' })
    expect(videoSource('https://www.youtube.com/watch?v=abcDEF12345&t=3').kind).toBe('youtube')
    expect(videoSource('https://cdn.x.vn/a.mp4')).toEqual({ kind: 'file', src: 'https://cdn.x.vn/a.mp4' })
    expect(videoSource('https://vz-1.b-cdn.net/abc/playlist.m3u8')).toEqual({ kind: 'hls', src: 'https://vz-1.b-cdn.net/abc/playlist.m3u8' })
    expect(videoSource('https://x.net/a/playlist.M3U8?token=1').kind).toBe('hls')
    expect(videoSource('https://x.net/a.m3u8.mp4').kind).toBe('file')
  })
  it('shortens counts', () => {
    expect(countText(950)).toBe('950')
    expect(countText(1234)).toBe('1,2K')
    expect(countText(2000)).toBe('2K')
    expect(countText(12500)).toBe('13K')
  })
  it('builds the post link', () => {
    expect(postLink('https://anylearn.vn/', 7, 'Bé học bơi')).toBe('https://anylearn.vn/fun/explore/7/be-hoc-boi')
    expect(postLink('https://anylearn.vn', 7)).toBe('https://anylearn.vn/fun/explore/7/bai-viet')
  })
})
