import { PRICE_PRESETS, TIME_SLOT_OPTIONS } from '@/config/searchFilters'
import { formatPrice } from '@/lib/format/price'
import type { AdvancedFilters } from './query'

// What a chip with a menu says once something is chosen in it ("Khung giờ" -> "Tối T2-T6", "2 khung giờ").
export function slotChipLabel(slots: string[]): string {
  if (slots.length === 0) return 'Khung giờ'
  if (slots.length > 1) return `${slots.length} khung giờ`
  return TIME_SLOT_OPTIONS.find(option => option.value === slots[0])?.label ?? 'Khung giờ'
}

export function priceChipLabel(adv: Pick<AdvancedFilters, 'priceMin' | 'priceMax'>): string {
  const { priceMin, priceMax } = adv
  if (priceMin === undefined && priceMax === undefined) return 'Giá'
  const preset = PRICE_PRESETS.find(item => item.min === priceMin && item.max === priceMax)
  if (preset) return preset.label
  if (priceMin === undefined) return `Đến ${formatPrice(priceMax ?? 0)}`
  return priceMax === undefined ? `Từ ${formatPrice(priceMin)}` : `${formatPrice(priceMin)} - ${formatPrice(priceMax)}`
}

export function districtChipLabel(districtCode: string | undefined, districts: { code: string; name: string }[]): string {
  if (!districtCode) return 'Quận'
  return districts.find(district => district.code === districtCode)?.name ?? 'Quận'
}
