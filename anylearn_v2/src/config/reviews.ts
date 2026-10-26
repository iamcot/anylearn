// Scores a parent can give besides the stars (ids are the ones the server accepts, see ReviewRules.CRITERIA).
export const REVIEW_CRITERIA = [
  { id: 'teacher', label: 'Giáo viên' },
  { id: 'facility', label: 'Cơ sở vật chất' },
  { id: 'progress', label: 'Tiến bộ của con' },
  { id: 'value', label: 'Đúng giá trị' },
] as const

export type ReviewCriterion = (typeof REVIEW_CRITERIA)[number]['id']

// Tap to add a phrase to the comment: quick to write on a phone.
export const REVIEW_QUICK_PHRASES = [
  'Giáo viên nhiệt tình',
  'Con rất thích đi học',
  'Con tiến bộ rõ rệt',
  'Cơ sở sạch sẽ, an toàn',
  'Học phí hợp lý',
  'Lớp hơi đông',
  'Dễ đăng ký, dễ liên hệ',
]

export const STAR_LABELS = ['', 'Tệ', 'Không tốt', 'Bình thường', 'Tốt', 'Xuất sắc']
export const REVIEW_MAX_PHOTOS = 4
export const REVIEWS_SHOWN_FIRST = 5
export const VERIFIED_LABEL = 'Đã học tại anyLEARN'
