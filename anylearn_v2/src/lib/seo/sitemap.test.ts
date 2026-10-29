import { describe, expect, it } from 'vitest'
import { entryOf, escapeXml, fileNames, indexXml, parseFileName, pathOf, urlsetXml } from './sitemap'

describe('sitemap', () => {
  it('builds the address of each type', () => {
    expect(pathOf({ type: 'course', id: 5, slug: 'boi-cho-be', updatedAt: null })).toBe('/class/5/boi-cho-be')
    expect(pathOf({ type: 'article', id: 7, slug: 'meo', updatedAt: null })).toBe('/article/7/meo.html')
    expect(pathOf({ type: 'explore', id: 9, slug: 'clip-vui', updatedAt: null })).toBe('/fun/explore/9/clip-vui')
    expect(pathOf({ type: 'landing', id: 1, slug: 'boi/5-tuoi/quan-7', updatedAt: null })).toBe('/hoc/boi/5-tuoi/quan-7')
    expect(pathOf({ type: 'collection', id: 1, slug: null, updatedAt: null })).toBeNull()
    expect(entryOf({ type: 'partner', id: 3, slug: 'x', updatedAt: '2026-10-01' })).toMatchObject({ path: '/partner/3', lastmod: '2026-10-01' })
  })

  it('lists one file per page of every type', () => {
    expect(fileNames(null)).toEqual(['static'])
    expect(fileNames({ pageSize: 10, types: [{ type: 'course', count: 12, pages: 2 }, { type: 'explore', count: 0, pages: 0 }] }))
      .toEqual(['static', 'course-1', 'course-2'])
  })

  it('reads file names', () => {
    expect(parseFileName('course-2.xml')).toEqual({ type: 'course', page: 2 })
    expect(parseFileName('static.xml')).toEqual({ type: 'static', page: 1 })
    expect(parseFileName('course.xml')).toBeNull()
    expect(parseFileName('users-1.xml')).toBeNull()
    expect(parseFileName('course-0.xml')).toBeNull()
  })

  it('writes escaped XML', () => {
    expect(escapeXml('a&b<c>')).toBe('a&amp;b&lt;c&gt;')
    const xml = urlsetXml('https://x.vn', [{ path: '/a?b=1&c=2', lastmod: '2026-10-29', priority: 0.9 }])
    expect(xml).toContain('<loc>https://x.vn/a?b=1&amp;c=2</loc><lastmod>2026-10-29</lastmod><priority>0.9</priority>')
    expect(indexXml('https://x.vn', ['static'])).toContain('<loc>https://x.vn/sitemaps/static.xml</loc>')
  })
})
