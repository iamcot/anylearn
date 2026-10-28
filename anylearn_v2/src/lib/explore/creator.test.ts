import { describe, expect, it } from 'vitest'
import { creatorActions, mergePosts, statusLabel } from './creator'
import { thumbOf } from './media'

describe('creator tiles', () => {
  it('offers view / edit / hide on live or waiting posts and show / edit / delete on hidden ones', () => {
    expect(creatorActions({ status: 'published' })).toEqual(['view', 'edit', 'hide'])
    expect(creatorActions({ status: 'pending' })).toEqual(['view', 'edit', 'hide'])
    expect(creatorActions({ status: 'hidden' })).toEqual(['show', 'edit', 'delete'])
    expect(creatorActions({ status: 'rejected' })).toEqual(['show', 'edit', 'delete'])
  })

  it('labels every status but live', () => {
    expect(statusLabel({ status: 'published' })).toBeNull()
    expect(statusLabel({ status: 'pending' })).toBe('Chờ duyệt')
    expect(statusLabel({ status: 'hidden', hiddenBy: 'admin' })).toBe('Admin đã ẩn')
    expect(statusLabel({ status: 'draft', afterUpload: 'pending' })).toBe('Chưa tải xong')
  })

  it('merges pages without repeating a post', () => {
    expect(mergePosts([{ id: 1 }, { id: 2 }], [{ id: 2 }, { id: 3 }]).map(p => p.id)).toEqual([1, 2, 3])
  })

  it('finds a picture for a tile', () => {
    expect(thumbOf({ kind: 'image', mediaUrl: 'https://x/a.jpg', posterUrl: null })).toBe('https://x/a.jpg')
    expect(thumbOf({ kind: 'video', mediaUrl: 'https://vz.b-cdn.net/abc/playlist.m3u8', posterUrl: null })).toBe('https://vz.b-cdn.net/abc/thumbnail.jpg')
    expect(thumbOf({ kind: 'video', mediaUrl: 'https://youtu.be/abcDEF12345', posterUrl: null })).toBe('https://img.youtube.com/vi/abcDEF12345/hqdefault.jpg')
    expect(thumbOf({ kind: 'video', mediaUrl: 'https://x/a.mp4', posterUrl: 'https://x/p.jpg' })).toBe('https://x/p.jpg')
    expect(thumbOf({ kind: 'article', mediaUrl: null, posterUrl: null })).toBeNull()
  })
})
