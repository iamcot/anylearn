import { describe, expect, it } from 'vitest'
import { checkCourseRequest, normalizePhone, provinceFromFilter, type CourseRequestForm } from './courseRequest'

function form(overrides: Partial<CourseRequestForm> = {}): CourseRequestForm {
  return {
    name: ' Mẹ Bin ', phone: '0912 345 678', subject: ' Cờ vua ', learnerAge: '9', provinceCode: '79', districtText: ' Quận 7 ',
    budgetMax: '2000000', preferredTime: 'weekend', mode: 'offline', note: ' gần nhà ', ...overrides,
  }
}

describe('normalizePhone', () => {
  it('accepts the usual ways to write a Vietnamese number', () => {
    expect(normalizePhone('0912 345 678')).toBe('0912345678')
    expect(normalizePhone('+84 912.345.678')).toBe('0912345678')
    expect(normalizePhone('84912345678')).toBe('0912345678')
    expect(normalizePhone('(028) 1234 5678')).toBe('02812345678')
  })

  it('rejects numbers that cannot be right', () => {
    expect(normalizePhone('12345')).toBeNull()
    expect(normalizePhone('abc')).toBeNull()
    expect(normalizePhone('1912345678')).toBeNull()
    expect(normalizePhone('')).toBeNull()
  })
})

describe('checkCourseRequest', () => {
  it('builds a clean payload', () => {
    expect(checkCourseRequest(form(), 'ref-12345678')).toEqual({
      ok: true,
      payload: {
        name: 'Mẹ Bin', phone: '0912345678', subject: 'Cờ vua', learnerAge: 9, provinceCode: '79', districtText: 'Quận 7',
        budgetMax: 2000000, preferredTime: 'weekend', mode: 'offline', note: 'gần nhà', sourceRef: 'ref-12345678',
      },
    })
  })

  it('leaves optional fields out when they are empty', () => {
    const result = checkCourseRequest(form({
      name: '', learnerAge: '', provinceCode: '', districtText: '', budgetMax: '', preferredTime: '', mode: '', note: '',
    }))
    expect(result).toEqual({ ok: true, payload: { phone: '0912345678', subject: 'Cờ vua' } })
  })

  it('reports each missing or wrong field', () => {
    const result = checkCourseRequest(form({ phone: '12', subject: ' ', learnerAge: '200' }))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(['learnerAge', 'phone', 'subject'])
  })

  it('refuses an age that is not a whole number', () => {
    const result = checkCourseRequest(form({ learnerAge: '9.5' }))
    expect(result.ok).toBe(false)
  })

  it('cuts text that is too long', () => {
    const result = checkCourseRequest(form({ subject: 'a'.repeat(400), note: 'b'.repeat(2000) }))
    expect(result.ok && result.payload.subject.length).toBe(255)
    expect(result.ok && result.payload.note?.length).toBe(1000)
  })
})

describe('provinceFromFilter', () => {
  it('keeps the two provinces the search knows', () => {
    expect(provinceFromFilter('79')).toBe('79')
    expect(provinceFromFilter('01')).toBe('01')
    expect(provinceFromFilter('all')).toBe('')
  })
})
