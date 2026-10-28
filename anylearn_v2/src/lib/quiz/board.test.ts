import { describe, expect, it } from 'vitest'
import type { BoardEntry } from '@/lib/api/quiz'
import { boardHint, ownLineApart, periodLabel, scoreText } from './board'

const entry = (over: Partial<BoardEntry>): BoardEntry => ({ place: 1, name: 'Văn An', rankKey: 'bac', rankName: 'Bạc', stars: 4, netStars: 7, me: false, ...over })

describe('quiz board', () => {
  it('says stars gained for a period and rank for the others', () => {
    expect(scoreText(entry({}), 'week')).toBe('+7 sao')
    expect(scoreText(entry({}), 'month')).toBe('+7 sao')
    expect(scoreText(entry({}), 'all')).toBe('Bạc · 4 sao')
    expect(scoreText(entry({}), 'rank')).toBe('Bạc · 4 sao')
  })

  it('names a period', () => {
    expect(periodLabel('W2026-44')).toBe('Tuần 44/2026')
    expect(periodLabel('M2026-10')).toBe('Tháng 10/2026')
    expect(periodLabel(null)).toBe('')
    expect(periodLabel('x')).toBe('')
  })

  it('shows the own line apart only when it is not in the list', () => {
    const mine = entry({ me: true, place: 80 })
    expect(ownLineApart([entry({}), entry({ place: 2 })], mine)).toBe(mine)
    expect(ownLineApart([entry({}), entry({ me: true, place: 2 })], mine)).toBeNull()
    expect(ownLineApart([entry({})], null)).toBeNull()
  })

  it('has a hint for every board', () => {
    for (const t of ['rank', 'week', 'month', 'all'] as const) expect(boardHint(t).length).toBeGreaterThan(10)
  })
})
