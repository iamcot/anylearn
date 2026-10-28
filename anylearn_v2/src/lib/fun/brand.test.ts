import { describe, expect, it } from 'vitest'
import { splitBrand } from './brand'

describe('splitBrand', () => {
  it('marks Leo and Leo Xu, the longer name first', () => {
    expect(splitBrand('Leo thưởng 10 Leo Xu nè')).toEqual([
      { text: 'Leo', brand: true }, { text: ' thưởng 10 ', brand: false }, { text: 'Leo Xu', brand: true }, { text: ' nè', brand: false },
    ])
  })
  it('knows a currency name the back office changed', () => {
    expect(splitBrand('Bạn nhận 5 Xu Mầm', 'Xu Mầm').filter(p => p.brand).map(p => p.text)).toEqual(['Xu Mầm'])
  })
  it('leaves other text alone, including names that only contain the word', () => {
    expect(splitBrand('Không có gì').every(p => !p.brand)).toBe(true)
    expect(splitBrand('Leonardo').every(p => !p.brand)).toBe(true)
  })
})
