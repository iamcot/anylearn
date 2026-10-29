import { describe, expect, it } from 'vitest'
import { breadcrumbLd, courseLd, faqLd, isoVn, jsonLdText, organizationLd, ratingLd, videoLd } from './jsonLd'

describe('jsonLd', () => {
  it('escapes text that could close the script tag', () => {
    expect(jsonLdText({ name: '</script><b>' })).not.toContain('</script>')
  })

  it('gives a rating only with reviews', () => {
    expect(ratingLd({ value: 4.66, count: 3 })).toMatchObject({ ratingValue: 4.7, reviewCount: 3 })
    expect(ratingLd({ value: 4.5, count: 0 })).toBeUndefined()
    expect(ratingLd({ value: null, count: 2 })).toBeUndefined()
  })

  it('builds a course and leaves out missing figures', () => {
    const ld = courseLd({ url: 'https://x.vn/class/1/a', name: 'Bơi', description: '<p>Học  bơi</p>', price: 1200000, provider: { name: 'CLB A' }, rating: { value: 5, count: 1 }, online: false })
    expect(ld).toMatchObject({ '@type': 'Course', description: 'Học bơi', offers: { price: 1200000, priceCurrency: 'VND' }, aggregateRating: { reviewCount: 1 } })
    expect(courseLd({ url: 'u', name: 'Bơi' })).not.toHaveProperty('aggregateRating')
    expect(courseLd({ url: 'u', name: 'Bơi' })).not.toHaveProperty('offers')
  })

  it('marks a partner with an address as a local business', () => {
    const withPlace = organizationLd({ url: 'u', name: 'Trường A', places: [{ address: '1 Lê Lợi', provinceName: 'TP HCM', lat: 10.7, lng: 106.7 }] })
    expect(withPlace['@type']).toEqual(['EducationalOrganization', 'LocalBusiness'])
    expect(withPlace).toMatchObject({ geo: { latitude: 10.7 }, address: { streetAddress: '1 Lê Lợi' } })
    expect(organizationLd({ url: 'u', name: 'Cô B', places: [{ address: 'x' }] })['@type']).toBe('EducationalOrganization')
  })

  it('needs a date and a picture for a video', () => {
    expect(videoLd({ url: 'u', name: 'Clip', thumbnailUrl: 't.jpg', uploadDate: null })).toBeNull()
    expect(videoLd({ url: 'u', name: 'Clip', thumbnailUrl: 't.jpg', uploadDate: '2026-10-29T10:00:00+07:00', views: 3 })).toMatchObject({ '@type': 'VideoObject', uploadDate: '2026-10-29T10:00:00+07:00' })
  })

  it('lists breadcrumbs and questions', () => {
    expect(breadcrumbLd('https://x.vn', [{ name: 'Trang chủ', path: '/' }, { name: 'Bơi', path: '/class/1/boi' }]).itemListElement)
      .toEqual([{ '@type': 'ListItem', position: 1, name: 'Trang chủ', item: 'https://x.vn/' }, { '@type': 'ListItem', position: 2, name: 'Bơi', item: 'https://x.vn/class/1/boi' }])
    expect(faqLd([{ question: 'Q', answer: 'A' }]).mainEntity).toHaveLength(1)
  })

  it('adds the Vietnam offset to a server date', () => {
    expect(isoVn('2026-10-29T10:20:00')).toBe('2026-10-29T10:20:00+07:00')
    expect(isoVn('2026-10-29 10:20:00.0')).toBe('2026-10-29T10:20:00+07:00')
    expect(isoVn('2026-10-29T03:20:00Z')).toBe('2026-10-29T03:20:00Z')
    expect(isoVn(null)).toBeNull()
  })
})
