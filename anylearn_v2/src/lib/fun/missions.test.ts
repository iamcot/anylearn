import { describe, expect, it } from 'vitest'
import { bonusState, bonusText, countdownText, missionState, percent } from './missions'

const m = (progress: number, target: number, claimed = false) => ({ key: 'x', label: 'X', target, progress, reward: 10, claimed })

describe('countdownText', () => {
  const end = new Date('2026-11-02T00:00:00+07:00').getTime()
  it('shows days and hours, then hours and minutes, then minutes', () => {
    expect(countdownText(new Date(end).toISOString(), end - (2 * 1440 + 5 * 60 + 30) * 60_000)).toBe('2 ngày 5 giờ')
    expect(countdownText(new Date(end).toISOString(), end - (5 * 60 + 10) * 60_000)).toBe('5 giờ 10 phút')
    expect(countdownText(new Date(end).toISOString(), end - 12 * 60_000)).toBe('12 phút')
    expect(countdownText(new Date(end).toISOString(), end - 3 * 1440 * 60_000)).toBe('3 ngày')
  })
  it('says the reset is near once the time is up or unreadable', () => {
    expect(countdownText(new Date(end).toISOString(), end + 1000)).toBe('sắp làm mới')
    expect(countdownText('nope', 0)).toBe('sắp làm mới')
  })
})

describe('mission state', () => {
  it('is todo, ready or claimed', () => {
    expect(missionState(m(2, 5))).toBe('todo')
    expect(missionState(m(5, 5))).toBe('ready')
    expect(missionState(m(5, 5, true))).toBe('claimed')
  })
  it('keeps the bar between 0 and 100', () => {
    expect(percent(m(1, 4))).toBe(25)
    expect(percent(m(9, 4))).toBe(100)
    expect(percent(m(1, 0))).toBe(0)
  })
})

describe('bonus', () => {
  it('locks until enough missions are done', () => {
    expect(bonusState({ needed: 5, done: 3, ready: false, claimed: false })).toBe('locked')
    expect(bonusText({ needed: 5, done: 3, ready: false, claimed: false })).toBe('Xong thêm 2 nhiệm vụ để nhận 1 sticker miễn phí')
    expect(bonusState({ needed: 5, done: 5, ready: true, claimed: false })).toBe('ready')
    expect(bonusState({ needed: 5, done: 6, ready: false, claimed: true })).toBe('claimed')
  })
})
