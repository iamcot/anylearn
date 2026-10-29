import { describe, expect, it } from 'vitest'
import { clock, firstFreeLesson, learnHref, noteTime, planText, resumeLabel, seekTarget, speedLabel, tapZone, toggleDay, validSpeed, watchStep } from './rules'

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

  it('keeps a seek inside the video', () => {
    expect(seekTarget(30, 10, 600)).toBe(40)
    expect(seekTarget(3, -10, 600)).toBe(0)
    expect(seekTarget(595, 10, 600)).toBe(599)
    expect(seekTarget(595, 10, null)).toBe(605)
  })

  it('tells the tap zones apart', () => {
    expect(tapZone(40, 400)).toBe('left')
    expect(tapZone(200, 400)).toBe('middle')
    expect(tapZone(360, 400)).toBe('right')
    expect(tapZone(10, 0)).toBe('middle')
  })

  it('accepts only offered speeds', () => {
    expect(validSpeed('1.5')).toBe(1.5)
    expect(validSpeed(3)).toBe(1)
    expect(validSpeed(null)).toBe(1)
    expect(speedLabel(1.25)).toBe('1.25x')
    expect(noteTime(65)).toBe('1:05')
    expect(noteTime(0)).toBe('0:00')
  })
})
