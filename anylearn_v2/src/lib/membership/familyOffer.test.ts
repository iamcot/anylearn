import { describe, expect, it } from 'vitest'
import { familyChip, familyOfferLine } from './familyOffer'

describe('familyOffer', () => {
  it('words the rule', () => {
    expect(familyOfferLine(5, 30)).toBe('Bé thứ hai trở đi giảm 5% khi đăng ký trong 30 ngày sau bé đầu tiên.')
  })
  it('shows a chip only with a percent', () => {
    expect(familyChip(5)).toBe('Giảm 5% ưu đãi gia đình')
    expect(familyChip(0)).toBe('')
    expect(familyChip(undefined)).toBe('')
  })
})
