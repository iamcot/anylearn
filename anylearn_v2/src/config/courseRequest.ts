export interface Option {
  value: string
  label: string
}

export const PREFERRED_TIME_OPTIONS: Option[] = [
  { value: '', label: 'Chưa rõ' },
  { value: 'weekday_evening', label: 'Tối trong tuần' },
  { value: 'weekend', label: 'Cuối tuần' },
  { value: 'summer', label: 'Hè' },
  { value: 'flexible', label: 'Linh hoạt' },
]

export const MODE_OPTIONS: Option[] = [
  { value: '', label: 'Chưa rõ' },
  { value: 'offline', label: 'Học trực tiếp' },
  { value: 'online', label: 'Học online' },
  { value: 'any', label: 'Cả hai đều được' },
]

// Monthly budget; the value is the most the family would pay, in VND.
export const BUDGET_OPTIONS: Option[] = [
  { value: '', label: 'Chưa rõ' },
  { value: '1000000', label: 'Dưới 1 triệu' },
  { value: '2000000', label: 'Dưới 2 triệu' },
  { value: '5000000', label: 'Dưới 5 triệu' },
  { value: '10000000', label: 'Dưới 10 triệu' },
]

export const PROVINCE_OPTIONS: Option[] = [
  { value: '', label: 'Chưa rõ' },
  { value: '79', label: 'TP.HCM' },
  { value: '01', label: 'Hà Nội' },
  { value: 'other', label: 'Tỉnh/thành khác' },
]

export const MAX_SUBJECT_LENGTH = 255
export const MAX_NOTE_LENGTH = 1000
