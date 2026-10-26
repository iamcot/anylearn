export const FILTER_ALL = 'all'

export interface FilterOption { label: string; value: string }
export interface FilterGroup { id: 'hinhthuc' | 'age' | 'location'; label: string; options: FilterOption[] }

export const FILTER_GROUPS: FilterGroup[] = [
  { id: 'hinhthuc', label: 'Hình thức học', options: [
    { label: 'Tất cả hình thức', value: FILTER_ALL },
    { label: 'Offline', value: 'offline' },
    { label: 'Online', value: 'online' },
    { label: 'Mã code', value: 'digital' },
  ] },
  { id: 'age', label: 'Độ tuổi', options: [
    { label: 'Tất cả độ tuổi', value: FILTER_ALL },
    { label: '3 - 5 tuổi', value: '3-5' },
    { label: '6 - 10 tuổi', value: '6-10' },
    { label: '11 - 15 tuổi', value: '11-15' },
    { label: '16 tuổi trở lên', value: '16+' },
  ] },
  { id: 'location', label: 'Khu vực', options: [
    { label: 'Tất cả khu vực', value: FILTER_ALL },
    { label: 'TP.HCM', value: '79' },
    { label: 'Hà Nội', value: '01' },
  ] },
]

export const SORT_OPTIONS = [
  { value: 'popular', label: 'Phổ biến nhất' },
  { value: 'newest', label: 'Mới nhất' },
  { value: 'priceLow', label: 'Giá thấp đến cao' },
  { value: 'priceHigh', label: 'Giá cao đến thấp' },
  { value: 'soonest', label: 'Khai giảng sớm nhất' },
  { value: 'perSession', label: 'Giá mỗi buổi thấp nhất' },
]

// Only offered while a "near me" point is set.
export const NEAREST_SORT = { value: 'nearest', label: 'Gần nhất' }

export const TIME_SLOT_OPTIONS = [
  { label: 'Sáng trong tuần', value: 'weekday_morning' },
  { label: 'Chiều trong tuần', value: 'weekday_afternoon' },
  { label: 'Tối trong tuần', value: 'weekday_evening' },
  { label: 'Sáng cuối tuần', value: 'weekend_morning' },
  { label: 'Chiều cuối tuần', value: 'weekend_afternoon' },
  { label: 'Tối cuối tuần', value: 'weekend_evening' },
]

export const PARTNER_TYPE_OPTIONS = [
  { label: 'Trường học', value: 'school' },
  { label: 'Trung tâm', value: 'center' },
  { label: 'Câu lạc bộ', value: 'club' },
  { label: 'Gia sư', value: 'tutor' },
  { label: 'Chuyên gia', value: 'expert' },
]

export const START_WITHIN_OPTIONS = [
  { label: 'Trong 7 ngày', value: 7 },
  { label: 'Trong 14 ngày', value: 14 },
  { label: 'Trong 30 ngày', value: 30 },
]

// "Học phí tối đa" slider: from 0 to PRICE_SLIDER_MAX in steps; the last step means no limit.
export const PRICE_SLIDER_MAX = 10_000_000
export const PRICE_SLIDER_STEP = 500_000

export const NEAR_RADIUS_KM = 10
export const TAG_CHIP_LIMIT = 24

// The chips under the search box. `near` asks for the position, the others are filters switched on and off.
export type QuickChipId = 'near' | 'weekend' | 'weekdayEvening' | 'freeTrial' | 'onSale' | 'online'
export const QUICK_CHIPS: { id: QuickChipId; label: string }[] = [
  { id: 'near', label: 'Gần tôi' },
  { id: 'weekend', label: 'Cuối tuần' },
  { id: 'weekdayEvening', label: 'Tối trong tuần' },
  { id: 'freeTrial', label: 'Học thử miễn phí' },
  { id: 'onSale', label: 'Đang giảm giá' },
  { id: 'online', label: 'Online' },
]
