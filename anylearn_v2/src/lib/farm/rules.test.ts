import { describe, expect, it } from 'vitest'
import { capUsedPercent, formatWait, isRipe, secondsUntil, slotsToHarvest, slotsToWater } from './rules'
import type { FarmPlot } from '@/lib/api/farm'

const plot = (slot: number, phase: FarmPlot['phase']): FarmPlot => ({ slot, phase })

describe('farm rules', () => {
  it('formats waits', () => {
    expect(formatWait(45)).toBe('45s')
    expect(formatWait(750)).toBe('12p 30s')
    expect(formatWait(3900)).toBe('1g 05p')
    expect(formatWait(-5)).toBe('0s')
  })
  it('counts down from the server time', () => {
    expect(secondsUntil('2026-11-09T08:10:00', '2026-11-09T08:00:00', 0)).toBe(600)
    expect(secondsUntil('2026-11-09T08:10:00', '2026-11-09T08:00:00', 60000)).toBe(540)
    expect(secondsUntil('2026-11-09T08:10:00', '2026-11-09T08:00:00', 700000)).toBe(0)
    expect(secondsUntil(null, '2026-11-09T08:00:00', 0)).toBe(0)
  })
  it('picks plots to water and harvest', () => {
    const plots = [plot(0, 'thirsty'), plot(1, 'ripe'), plot(2, 'wilting'), plot(3, 'growing'), plot(4, 'empty')]
    expect(slotsToWater(plots)).toEqual([0])
    expect(slotsToHarvest(plots)).toEqual([1, 2])
    expect(isRipe(plots[3])).toBe(false)
  })
  it('shows how much of the daily cap is used', () => {
    expect(capUsedPercent(8, 8)).toBe(0)
    expect(capUsedPercent(2, 8)).toBe(75)
    expect(capUsedPercent(0, 8)).toBe(100)
    expect(capUsedPercent(0, 0)).toBe(100)
  })
})
