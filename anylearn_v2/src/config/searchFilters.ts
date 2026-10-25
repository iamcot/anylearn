export const FILTER_ALL = 'all'

export interface FilterOption { label: string; value: string }
export interface FilterGroup { id: 'hinhthuc' | 'price' | 'age' | 'location'; label: string; options: FilterOption[] }

export const FILTER_GROUPS: FilterGroup[] = [
  { id: 'hinhthuc', label: 'Hình thức học', options: [
    { label: 'Tất cả hình thức', value: FILTER_ALL },
    { label: 'Offline', value: 'offline' },
    { label: 'Online', value: 'online' },
    { label: 'Mã code', value: 'digital' },
  ] },
  { id: 'price', label: 'Học phí', options: [
    { label: 'Tất cả học phí', value: FILTER_ALL },
    { label: 'Dưới 2 triệu', value: 'under2' },
    { label: '2 - 5 triệu', value: '2to5' },
    { label: 'Trên 5 triệu', value: 'over5' },
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
]
