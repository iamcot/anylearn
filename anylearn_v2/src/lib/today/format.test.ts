import { describe, expect, it } from 'vitest'
import {
  canJoinNow, countdownText, dayLabel, feePayLabel, formatClock, formatMoney, mapsUrl,
  pickRotating, renewLink, weekdayShort,
} from './format'
import type { FeeView, SessionView } from './types'

const at = (time: string) => new Date(`2026-10-13T${time}:00`)

function session(overrides: Partial<SessionView>): SessionView {
  return {
    key: '1_20261013', itemId: 1, title: 'Lớp', mode: 'online', startAt: '2026-10-13T19:45:00',
    endAt: '2026-10-13T21:00:00', teacherName: null, attended: false, pendingRequest: null,
    joinOpensAt: '2026-10-13T19:30:00', canJoin: false, location: null, gatherTime: null,
    bringItems: null, ...overrides,
  }
}

describe('countdownText', () => {
  const start = '2026-10-13T17:30:00'
  const end = '2026-10-13T19:00:00'

  it('shows hours and padded minutes', () => expect(countdownText(start, end, at('16:10'))).toBe('Còn 1h20'))
  it('shows whole hours without minutes', () => expect(countdownText(start, end, at('15:30'))).toBe('Còn 2h'))
  it('shows minutes under one hour', () => expect(countdownText(start, end, at('17:00'))).toBe('Còn 30 phút'))
  it('says running between start and end', () => expect(countdownText(start, end, at('18:00'))).toBe('Đang diễn ra'))
  it('says ended after the end', () => expect(countdownText(start, end, at('19:00'))).toBe('Đã kết thúc'))
  it('counts days when far away', () => {
    expect(countdownText('2026-10-16T17:30:00', '2026-10-16T19:00:00', at('16:10'))).toBe('Còn 3 ngày')
  })
})

describe('canJoinNow', () => {
  it('is closed before the opening time', () => expect(canJoinNow(session({}), at('19:29'))).toBe(false))
  it('opens exactly at the opening time', () => expect(canJoinNow(session({}), at('19:30'))).toBe(true))
  it('closes when the session ends', () => expect(canJoinNow(session({}), at('21:00'))).toBe(false))
  it('is never open for onsite sessions', () => {
    expect(canJoinNow(session({ mode: 'onsite', joinOpensAt: null }), at('19:40'))).toBe(false)
  })
})

describe('labels', () => {
  it('names today, tomorrow and later days', () => {
    expect(dayLabel('2026-10-13T08:00:00', at('22:00'))).toBe('Hôm nay')
    expect(dayLabel('2026-10-14T08:00:00', at('22:00'))).toBe('Ngày mai')
    expect(dayLabel('2026-10-16T08:00:00', at('22:00'))).toBe('Thứ sáu 16/10')
  })
  it('formats clock and weekday', () => {
    expect(formatClock('2026-10-13T07:05:00')).toBe('07:05')
    expect(weekdayShort('2026-10-13')).toBe('T3')
    expect(weekdayShort('2026-10-18')).toBe('CN')
  })
  it('formats money in Vietnamese style', () => expect(formatMoney(2500000)).toBe('2.500.000đ'))
})

describe('mapsUrl', () => {
  const base = { name: null, roomNote: null, address: null, latitude: null, longitude: null }

  it('prefers coordinates', () => {
    expect(mapsUrl({ ...base, latitude: 10.7769, longitude: 106.6867, address: 'x' }))
      .toBe('https://www.google.com/maps/dir/?api=1&destination=10.7769,106.6867')
  })
  it('falls back to the address text', () => {
    expect(mapsUrl({ ...base, address: '294 Điện Biên Phủ' }))
      .toBe('https://www.google.com/maps/dir/?api=1&destination=294%20%C4%90i%E1%BB%87n%20Bi%C3%AAn%20Ph%E1%BB%A7')
  })
  it('is null when there is no place', () => {
    expect(mapsUrl(base)).toBeNull()
    expect(mapsUrl(null)).toBeNull()
  })
})

describe('fee links', () => {
  const fee: FeeView = {
    itemId: 7, itemTitle: 'Học phí', state: 'DUE_SOON', paidUntil: '2026-11-30', paidUntilText: 'hết tháng 11',
    paidPeriodLabel: null, nextStart: '2026-12-01', nextPeriodLabel: 'Tháng 12', amount: 2500000,
  }

  it('builds the pay button label', () => expect(feePayLabel(fee)).toBe('Đóng tháng 12 · 2.500.000đ'))
  it('links to add2cart with child and start month', () => {
    expect(renewLink(7, 42, fee.nextStart)).toBe('/add2cart/7?child=42&start=2026-12')
    expect(renewLink(7, 42)).toBe('/add2cart/7?child=42')
  })
})

describe('pickRotating', () => {
  it('rotates by day and handles empty', () => {
    expect(pickRotating(['a', 'b', 'c'], 4)).toBe('b')
    expect(pickRotating(['a', 'b', 'c'], 5)).toBe('c')
    expect(pickRotating([], 1)).toBeNull()
  })
})
