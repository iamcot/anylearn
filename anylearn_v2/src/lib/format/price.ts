const MILLION = 1_000_000

export function formatPrice(price: number, emptyLabel = 'Liên hệ'): string {
  if (!price) return emptyLabel
  if (price >= MILLION) return `${(price / MILLION).toFixed(1).replace('.0', '')} triệu`
  return `${price.toLocaleString('vi-VN')} đ`
}
