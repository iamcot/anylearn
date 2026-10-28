import { describe, expect, it } from 'vitest'
import { clock, firstFreeLesson, learnHref, planText, resumeLabel, toggleDay, watchStep } from './rules'

describe('learn rules', () => {
  it('formats a clock', () => {
    expect(clock(3900)).toBe('1:05:00')
    expect(clock(125)).toBe('2:05')
    expect(clock(0)).toBe('')
    expect(clock(null)).toBe('')
  })

  it('toggles weekdays in order and writes the plan', () => {
    expect(toggleDay([4, 2], 6)).toEqual([2, 4, 6])
    expect(toggleDay([2, 4], 2)).toEqual([4])
    expect(planText([4, 2, 7], '20:00')).toBe('T3, T5, CN lúc 20:00')
  })

  it('counts only normal playback, not seeking', () => {
    expect(watchStep(null, 10)).toBe(0)
    expect(watchStep(10, 10.25)).toBeCloseTo(0.25)
    expect(watchStep(10, 300)).toBe(0)
    expect(watchStep(300, 10)).toBe(0)
  })

  it('labels the resume button', () => {
    expect(resumeLabel({ started: false })).toBe('Bắt đầu học')
    expect(resumeLabel({ started: true, percent: 40, resumeNo: 5, resumeTitle: 'Màu nước' })).toBe('Học tiếp: Bài 5 – Màu nước')
    expect(resumeLabel({ started: true, percent: 100 })).toBe('Xem lại khóa học')
  })

  it('builds the learn link and finds the first free lesson', () => {
    expect(learnHref(7)).toBe('/learn/7')
    expect(learnHref(7, 3, 9)).toBe('/learn/7?lesson=3&learner=9')
    const chapters = [{ lessons: [{ id: 1, free: true, playable: false }, { id: 2, free: false, playable: true }] }, { lessons: [{ id: 3, free: true, playable: true }] }]
    expect(firstFreeLesson(chapters)?.id).toBe(3)
    expect(firstFreeLesson([{ lessons: [] }])).toBeNull()
  })
})
