// Texts of the AI suggestions page. Feedback keys must match AiSuggestionRules in the backend.
export const AI_SUGGEST_PATH = '/ai-suggest'

// Shown one after another while the suggestions are being made; {name} is the learner.
export const PROGRESS_MESSAGES: string[] = [
  'Đang tìm khóa học phù hợp với {name}…',
  'Manifesting những lớp học tuyệt vời cho {name}…',
  'Hỏi ý kiến các thầy cô giáo AI…',
  'Xếp lịch sao cho vừa tuần của {name}…',
  'Lùng sục khắp anyLEARN…',
  'Tìm chỗ gần nhà, giá dễ thương…',
  'Rắc thêm một chút phép màu ✨',
  'Sắp xong rồi, {name} chờ xíu nhé!',
]

export const PROGRESS_ICONS = ['🔮', '🔍', '🎨', '♟️', '🚀', '📚', '🎵', '⚽']

export const MESSAGE_INTERVAL_MS = 2400
export const MIN_LOADING_MS = 3000

export interface FeedbackOption {
  key: string
  label: string
}

export const UP_OPTIONS: FeedbackOption[] = [
  { key: 'right_interest', label: 'Đúng sở thích' },
  { key: 'right_age', label: 'Hợp độ tuổi' },
  { key: 'good_price', label: 'Giá hợp lý' },
  { key: 'new_ideas', label: 'Có ý tưởng mới' },
]

export const DOWN_OPTIONS: FeedbackOption[] = [
  { key: 'wrong_age', label: 'Không hợp độ tuổi' },
  { key: 'too_far', label: 'Quá xa' },
  { key: 'too_expensive', label: 'Giá cao' },
  { key: 'already_know', label: 'Bé đã học rồi' },
  { key: 'wrong_schedule', label: 'Không hợp lịch' },
  { key: 'not_interested', label: 'Bé không thích' },
]
