import { describe, expect, it } from 'vitest'
import { districtChipLabel, priceChipLabel, slotChipLabel } from './chipLabels'

describe('slotChipLabel', () => {
  it('names one slot and counts several', () => {
    expect(slotChipLabel([])).toBe('Khung giờ')
    expect(slotChipLabel(['weekday_evening'])).toBe('Tối trong tuần')
    expect(slotChipLabel(['weekday_evening', 'weekend_morning'])).toBe('2 khung giờ')
  })
})

describe('priceChipLabel', () => {
  it('uses a preset name when the range matches one', () => {
    expect(priceChipLabel({})).toBe('Giá')
    expect(priceChipLabel({ priceMin: 1_000_000, priceMax: 3_000_000 })).toBe('1 - 3 triệu')
    expect(priceChipLabel({ priceMin: 5_000_000 })).toBe('Trên 5 triệu')
  })

  it('writes an odd range out', () => {
    expect(priceChipLabel({ priceMax: 2_500_000 })).toBe('Đến 2.5 triệu')
  })
})

describe('districtChipLabel', () => {
  it('falls back to "Quận" for no or unknown code', () => {
    const districts = [{ code: '760', name: 'Quận 1' }]
    expect(districtChipLabel('760', districts)).toBe('Quận 1')
    expect(districtChipLabel(undefined, districts)).toBe('Quận')
    expect(districtChipLabel('999', districts)).toBe('Quận')
  })
})
