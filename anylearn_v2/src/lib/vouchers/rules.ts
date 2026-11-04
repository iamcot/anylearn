import type { CollectibleVoucher, WalletVoucher } from '@/lib/api/vouchers'

export function formatVnd(v: number): string {
  return `${Math.round(v).toLocaleString('vi-VN').replace(/,/g, '.')}đ`
}

/** Short amount for a voucher ticket: 200000 → "200K", 25500 → "25,5K", 1500000 → "1,5TR"; under 1000 stays "500đ". */
export function shortVnd(v: number): string {
  const n = Math.round(v)
  const fmt = (x: number) => (Math.round(x * 10) / 10).toString().replace('.', ',')
  if (n >= 1_000_000) return `${fmt(n / 1_000_000)}TR`
  if (n >= 1_000) return `${fmt(n / 1_000)}K`
  return `${n}đ`
}

/** One line under a voucher: minimum order, course or partner limit. */
export function conditionLine(v: Pick<WalletVoucher, 'minOrder' | 'itemIds' | 'partnerName'>): string {
  const parts: string[] = []
  if (v.minOrder > 0) parts.push(`Đơn từ ${shortVnd(v.minOrder)}`)
  if (v.partnerName) parts.push(`Khóa của ${v.partnerName}`)
  else if (v.itemIds.length > 0) parts.push(v.itemIds.length === 1 ? 'Áp dụng cho 1 khóa học' : `Áp dụng cho ${v.itemIds.length} khóa học`)
  if (parts.length === 0) parts.push('Mọi khóa học')
  return parts.join(' · ')
}

/** "HSD 03/12" or null; "Hết hạn hôm nay" when it ends today. */
export function expiryLabel(expiresAt: string | null | undefined, now: Date = new Date()): string | null {
  if (!expiresAt) return null
  const d = new Date(expiresAt.replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return null
  const sameDay = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
  if (sameDay) return 'Hết hạn hôm nay'
  return `HSD ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Expires within 3 days (the wallet marks it). */
export function expiresSoon(expiresAt: string | null | undefined, now: Date = new Date()): boolean {
  if (!expiresAt) return false
  const d = new Date(expiresAt.replace(' ', 'T'))
  const ms = d.getTime() - now.getTime()
  return ms > 0 && ms <= 3 * 24 * 3600 * 1000
}

/** Checkout list: usable ones first by discount (largest first), then the others. */
export function sortForCheckout(items: WalletVoucher[]): WalletVoucher[] {
  const active = items.filter(v => v.state === 'active')
  const usable = active.filter(v => !v.problem && (v.discount ?? 0) > 0).sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0))
  const blocked = active.filter(v => v.problem || !(v.discount ?? 0))
  return [...usable, ...blocked]
}

/** The best usable voucher of the cart (the checkout pre-selects it), or null. */
export function bestVoucher(items: WalletVoucher[]): WalletVoucher | null {
  return sortForCheckout(items).find(v => !v.problem && (v.discount ?? 0) > 0) ?? null
}

export function walletTab(items: WalletVoucher[], tab: 'active' | 'used' | 'expired'): WalletVoucher[] {
  return items.filter(v => v.state === tab)
}

/** "Còn 12 mã" when the copies are limited. */
export function leftLabel(v: Pick<CollectibleVoucher, 'left'>): string | null {
  if (v.left === null || v.left === undefined) return null
  return v.left <= 0 ? 'Đã hết' : `Còn ${v.left} mã`
}
