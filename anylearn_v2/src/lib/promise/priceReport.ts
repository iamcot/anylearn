import { normalizePhone } from '@/lib/search/courseRequest'

export interface PriceReportForm {
  seenPlace: string
  seenPrice: string
  note: string
  phone: string
}

export interface PriceReportPayload {
  itemId?: number
  seenPlace?: string
  seenPrice?: number
  note?: string
  phone?: string
}

export type PriceReportErrors = Partial<Record<'seenPlace' | 'seenPrice' | 'phone', string>>

export type PriceReportCheck =
  | { ok: true; payload: PriceReportPayload }
  | { ok: false; errors: PriceReportErrors }

const MAX_PRICE = 1_000_000_000

function optional(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

// Same rules as the server: say where, a sane price if given, and a phone number when there is no account.
export function checkPriceReport(form: PriceReportForm, loggedIn: boolean, itemId?: number): PriceReportCheck {
  const errors: PriceReportErrors = {}
  const seenPlace = optional(form.seenPlace)
  if (!seenPlace) errors.seenPlace = 'Cho chúng tôi biết bạn thấy giá rẻ hơn ở đâu'

  const priceText = form.seenPrice.replace(/[.,\s]/g, '')
  const seenPrice = priceText === '' ? undefined : Number(priceText)
  if (seenPrice !== undefined && (!Number.isFinite(seenPrice) || seenPrice <= 0 || seenPrice > MAX_PRICE)) {
    errors.seenPrice = 'Giá chưa hợp lệ'
  }

  const phoneText = optional(form.phone)
  const phone = phoneText ? normalizePhone(phoneText) : null
  if (phoneText && !phone) errors.phone = 'Số điện thoại chưa đúng, vui lòng kiểm tra lại'
  if (!phoneText && !loggedIn) errors.phone = 'Để lại số điện thoại để anyLEARN phản hồi'

  if (Object.keys(errors).length > 0) return { ok: false, errors }
  return { ok: true, payload: { itemId, seenPlace, seenPrice, note: optional(form.note), phone: phone ?? undefined } }
}
