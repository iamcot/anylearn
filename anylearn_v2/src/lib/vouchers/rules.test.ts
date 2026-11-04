import { describe, expect, it } from 'vitest'
import { amountLabel, bestVoucher, conditionLine, expiresSoon, expiryLabel, leftLabel, leoVoucherNote, shortVnd, sortForCheckout, sortLeoVouchers, walletTab } from './rules'
import type { WalletVoucher } from '@/lib/api/vouchers'

const v = (over: Partial<WalletVoucher>): WalletVoucher => ({
  id: 1, code: 'A', title: 'Giảm', value: 50000, minOrder: 0, itemIds: [], source: 'event', state: 'active', ...over,
})

describe('voucher rules', () => {
  it('describes the conditions', () => {
    expect(conditionLine(v({}))).toBe('Mọi khóa học')
    expect(conditionLine(v({ minOrder: 300000, itemIds: [1, 2] }))).toBe('Đơn từ 300K · Áp dụng cho 2 khóa học')
    expect(conditionLine(v({ partnerName: 'Trung tâm A', itemIds: [3] }))).toBe('Khóa của Trung tâm A')
    expect(conditionLine(v({ kind: 'percent', value: 10, maxDiscount: 200000, minOrder: 1000000 }))).toBe('Tối đa 200K · Đơn từ 1TR')
    expect(conditionLine(v({ kind: 'money', maxDiscount: 200000 }))).toBe('Mọi khóa học')
  })

  it('labels the amount of money and percent vouchers', () => {
    expect(amountLabel({ value: 50000 })).toBe('50K')
    expect(amountLabel({ kind: 'money', value: 1500000 })).toBe('1,5TR')
    expect(amountLabel({ kind: 'percent', value: 10 })).toBe('10%')
  })

  it('labels the expiry', () => {
    const now = new Date(2026, 10, 3, 9)
    expect(expiryLabel(null, now)).toBeNull()
    expect(expiryLabel('2026-12-03T10:00:00', now)).toBe('HSD 03/12')
    expect(expiryLabel('2026-11-03 20:00:00', now)).toBe('Hết hạn hôm nay')
    expect(expiresSoon('2026-11-05T10:00:00', now)).toBe(true)
    expect(expiresSoon('2026-11-20T10:00:00', now)).toBe(false)
  })

  it('orders the checkout list and picks the best usable voucher', () => {
    const items = [
      v({ id: 1, discount: 20000 }),
      v({ id: 2, discount: 0, problem: 'Đơn từ 1.000.000đ' }),
      v({ id: 3, discount: 50000 }),
      v({ id: 4, state: 'used' }),
    ]
    expect(sortForCheckout(items).map(x => x.id)).toEqual([3, 1, 2])
    expect(bestVoucher(items)?.id).toBe(3)
    expect(bestVoucher([v({ discount: 0, problem: 'x' })])).toBeNull()
    expect(walletTab(items, 'used').map(x => x.id)).toEqual([4])
  })

  it('shows copies left only when limited', () => {
    expect(leftLabel({ left: null })).toBeNull()
    expect(leftLabel({ left: 0 })).toBe('Đã hết')
    expect(leftLabel({ left: 12 })).toBe('Còn 12 mã')
  })
})

describe('shortVnd', () => {
  it('shortens amounts for the ticket', () => {
    expect(shortVnd(200000)).toBe('200K')
    expect(shortVnd(25500)).toBe('25,5K')
    expect(shortVnd(1500000)).toBe('1,5TR')
    expect(shortVnd(2000000)).toBe('2TR')
    expect(shortVnd(500)).toBe('500đ')
  })
})

describe('Leo Xu vouchers', () => {
  const base = { holding: false, nextAt: null, rebuyDays: 30, walletDays: 14, left: null }
  it('says why a voucher cannot be bought, or how long it lasts', () => {
    expect(leoVoucherNote(base)).toBe('Dùng trong 14 ngày · Đổi lại 30 ngày sau khi dùng')
    expect(leoVoucherNote({ ...base, walletDays: null, rebuyDays: 0 })).toBe('Dùng xong đổi lại ngay')
    expect(leoVoucherNote({ ...base, holding: true })).toBe('Đang có trong ví, dùng xong mới đổi tiếp')
    expect(leoVoucherNote({ ...base, nextAt: '2026-12-04T10:00:00' })).toBe('Đổi lại được từ 04/12/2026')
    expect(leoVoucherNote({ ...base, left: 0 })).toBe('Đã hết lượt đổi')
  })
  it('puts buyable vouchers first, cheapest first', () => {
    const e = (price: number, canBuy: boolean) => ({ voucher: { price, canBuy } as never })
    const sorted = sortLeoVouchers([e(300, true), e(50, false), e(100, true)])
    expect(sorted.map(x => (x.voucher as { price: number }).price)).toEqual([100, 300, 50])
  })
})
