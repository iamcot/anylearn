const MILLION = 1_000_000

export function formatPrice(price: number, emptyLabel = 'Liên hệ'): string {
  if (!price) return emptyLabel
  if (price >= MILLION) return `${(price / MILLION).toFixed(1).replace('.0', '')} triệu`
  return `${price.toLocaleString('vi-VN')} đ`
}

// Exact amount for bank transfers, where rounding to "triệu" would be wrong: 1.500.000 đ
export function formatExactPrice(price: number): string {
  return `${price.toLocaleString('vi-VN')} đ`
}
