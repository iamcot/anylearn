import type { FeeView, LocationView, SessionView } from './types'

const WEEKDAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const WEEKDAY_LONG = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']
const MINUTE = 60_000

export function parseLocal(iso: string): Date {
  return new Date(iso)
}

export function formatClock(iso: string): string {
  const date = parseLocal(iso)
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function formatDayMonth(iso: string): string {
  const date = parseLocal(iso)
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`
}

export function weekdayShort(isoDate: string): string {
  return WEEKDAY_SHORT[parseLocal(isoDate).getDay()]
}

export function weekdayLong(isoDate: string): string {
  return WEEKDAY_LONG[parseLocal(isoDate).getDay()]
}

export function dayLabel(iso: string, now: Date): string {
  const date = parseLocal(iso)
  const dayDiff = Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / (24 * 60 * MINUTE))
  if (dayDiff === 0) return 'Hôm nay'
  if (dayDiff === 1) return 'Ngày mai'
  return `${weekdayLong(iso)} ${formatDayMonth(iso)}`
}

export function countdownText(startAt: string, endAt: string, now: Date): string {
  const minutesToStart = Math.ceil((parseLocal(startAt).getTime() - now.getTime()) / MINUTE)
  if (now >= parseLocal(endAt)) return 'Đã kết thúc'
  if (minutesToStart <= 0) return 'Đang diễn ra'
  if (minutesToStart < 60) return `Còn ${minutesToStart} phút`
  const hours = Math.floor(minutesToStart / 60)
  const minutes = minutesToStart % 60
  if (hours < 24) return minutes === 0 ? `Còn ${hours}h` : `Còn ${hours}h${pad(minutes)}`
  return `Còn ${Math.floor(hours / 24)} ngày`
}

export function hasStarted(session: SessionView, now: Date): boolean {
  return now >= parseLocal(session.startAt)
}

export function canJoinNow(session: SessionView, now: Date): boolean {
  if (session.mode !== 'online' || !session.joinOpensAt) return false
  return now >= parseLocal(session.joinOpensAt) && now < parseLocal(session.endAt)
}

export function mapsUrl(location: LocationView | null): string | null {
  if (!location) return null
  if (location.latitude != null && location.longitude != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`
  }
  if (location.address) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location.address)}`
  }
  return null
}

export function formatMoney(amount: number): string {
  return `${amount.toLocaleString('vi-VN')}đ`
}

export function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1)
}

export function upperFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function renewLink(itemId: number, learnerId: number, nextStart?: string | null): string {
  const start = nextStart ? `&start=${nextStart.slice(0, 7)}` : ''
  return `/add2cart/${itemId}?child=${learnerId}${start}`
}

export function feePayLabel(fee: FeeView): string {
  return `Đóng ${lowerFirst(fee.nextPeriodLabel)} · ${formatMoney(fee.amount)}`
}

export function modeLabel(session: SessionView): string {
  if (session.mode === 'online') return 'Online'
  if (session.mode === 'extra') return 'Ngoại khóa'
  return 'Tại trung tâm'
}

export function pickRotating<T>(items: T[], daySeed: number): T | null {
  if (items.length === 0) return null
  return items[daySeed % items.length]
}

export function daySeedOf(now: Date): number {
  return Math.floor(startOfDay(now).getTime() / (24 * 60 * MINUTE))
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}
