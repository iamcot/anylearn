import { MAX_NOTE_LENGTH, MAX_SUBJECT_LENGTH } from '@/config/courseRequest'

export interface CourseRequestForm {
  name: string
  phone: string
  subject: string
  learnerAge: string
  provinceCode: string
  districtText: string
  budgetMax: string
  preferredTime: string
  mode: string
  note: string
}

export interface CourseRequestPayload {
  name?: string
  phone: string
  subject: string
  learnerAge?: number
  provinceCode?: string
  districtText?: string
  budgetMax?: number
  preferredTime?: string
  mode?: string
  note?: string
  sourceRef?: string
}

export type CourseRequestCheck =
  | { ok: true; payload: CourseRequestPayload }
  | { ok: false; errors: Partial<Record<'phone' | 'subject' | 'learnerAge', string>> }

const LOCAL_PHONE = /^0\d{9,10}$/
const MAX_AGE = 100

// "+84 912.345.678", "84912345678" and "0912 345 678" are all 0912345678. Same rule as the server.
export function normalizePhone(raw: string): string | null {
  let digits = raw.replace(/[\s.\-()]/g, '')
  if (digits.startsWith('+84')) digits = `0${digits.slice(3)}`
  else if (digits.startsWith('84') && digits.length >= 11) digits = `0${digits.slice(2)}`
  return LOCAL_PHONE.test(digits) ? digits : null
}

function optional(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

function optionalNumber(value: string): number | undefined {
  const trimmed = value.trim()
  if (trimmed === '') return undefined
  const number = Number(trimmed)
  return Number.isFinite(number) ? number : undefined
}

export function checkCourseRequest(form: CourseRequestForm, sourceRef?: string): CourseRequestCheck {
  const errors: Partial<Record<'phone' | 'subject' | 'learnerAge', string>> = {}
  const phone = normalizePhone(form.phone)
  if (!phone) errors.phone = 'Số điện thoại chưa đúng, vui lòng kiểm tra lại'
  const subject = form.subject.trim()
  if (subject.length < 2) errors.subject = 'Cho anyLEARN biết bạn muốn tìm khóa học gì'
  const age = optionalNumber(form.learnerAge)
  if (form.learnerAge.trim() !== '' && (age === undefined || !Number.isInteger(age) || age < 0 || age > MAX_AGE)) {
    errors.learnerAge = 'Độ tuổi chưa hợp lệ'
  }
  if (Object.keys(errors).length > 0 || !phone) return { ok: false, errors }

  return {
    ok: true,
    payload: {
      name: optional(form.name),
      phone,
      subject: subject.slice(0, MAX_SUBJECT_LENGTH),
      learnerAge: age,
      provinceCode: optional(form.provinceCode),
      districtText: optional(form.districtText),
      budgetMax: optionalNumber(form.budgetMax),
      preferredTime: optional(form.preferredTime),
      mode: optional(form.mode),
      note: optional(form.note)?.slice(0, MAX_NOTE_LENGTH),
      sourceRef,
    },
  }
}

// The location filter of the search the visitor just made ("79", "01") tells which area to ask about.
export function provinceFromFilter(locationFilter: string): string {
  return locationFilter === '79' || locationFilter === '01' ? locationFilter : ''
}
