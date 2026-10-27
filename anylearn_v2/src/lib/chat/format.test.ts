import { describe, expect, it } from 'vitest'
import { chatDayLabel, mergeMessages } from './format'

describe('chat format', () => {
  it('merges by id, newest data wins, ordered', () => {
    const merged = mergeMessages([{ id: 2, v: 'a' }, { id: 1, v: 'a' }], [{ id: 2, v: 'b' }, { id: 3, v: 'b' }])
    expect(merged.map(m => m.id)).toEqual([1, 2, 3])
    expect(merged[1].v).toBe('b')
  })

  it('names today and yesterday', () => {
    const now = new Date(2026, 9, 27, 10)
    expect(chatDayLabel(new Date(2026, 9, 27, 8).toISOString(), now)).toBe('Hôm nay')
    expect(chatDayLabel(new Date(2026, 9, 26, 8).toISOString(), now)).toBe('Hôm qua')
    expect(chatDayLabel(new Date(2026, 9, 1, 8).toISOString(), now)).toBe('01/10/2026')
  })
})
