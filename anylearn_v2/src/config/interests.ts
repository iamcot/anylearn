// Answers of the optional survey when a child is added (plan 01.5). Keys must match LearnerInterestRules in the backend.
export interface InterestOption {
  key: string
  label: string
}

export const INTEREST_OPTIONS: InterestOption[] = [
  { key: 'chess', label: 'Cờ vua' },
  { key: 'art', label: 'Vẽ, mỹ thuật' },
  { key: 'swim', label: 'Bơi lội' },
  { key: 'english', label: 'Tiếng Anh' },
  { key: 'coding', label: 'Lập trình, robot' },
  { key: 'dance', label: 'Múa, nhảy' },
  { key: 'music', label: 'Âm nhạc' },
  { key: 'sports', label: 'Thể thao' },
  { key: 'life_skills', label: 'Kỹ năng sống' },
  { key: 'math', label: 'Toán, tư duy' },
  { key: 'science', label: 'Khoa học, STEM' },
  { key: 'reading', label: 'Đọc, viết' },
]

export const BUDGET_OPTIONS: InterestOption[] = [
  { key: 'lt500', label: 'Dưới 500.000đ' },
  { key: '500_1000', label: '500.000đ đến 1 triệu' },
  { key: '1000_2000', label: '1 đến 2 triệu' },
  { key: 'gt2000', label: 'Trên 2 triệu' },
]

export const MAX_INTERESTS_PER_QUESTION = 8
