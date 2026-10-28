// Labels of the notification topics a person can switch off (06.4). Keys match `NotificationTopics` in the backend: keep both in step.
export const NOTIFICATION_TOPICS = [
  { key: 'schedule', label: 'Nhắc lịch học', hint: 'Buổi học sắp bắt đầu, yêu cầu nghỉ hoặc đổi lịch, giờ tự học khóa video' },
  { key: 'payment', label: 'Nhắc thanh toán', hint: 'Đơn hàng đang chờ bạn thanh toán' },
  { key: 'renewal', label: 'Nhắc gia hạn', hint: 'Khóa học sắp hết kỳ phí' },
  { key: 'review', label: 'Nhắc đánh giá', hint: 'Gợi ý viết đánh giá khi khóa học đi được nửa chặng hoặc kết thúc' },
  { key: 'points', label: 'Nhắc anyPoint sắp hết hạn', hint: 'Báo trước 30 ngày và 7 ngày khi anyPoint sắp hết hạn dùng' },
  { key: 'fun', label: 'Vui học', hint: 'Banner thành tích và phần thưởng bảng xếp hạng' },
  { key: 'promo', label: 'Khóa học mới', hint: 'Khóa mới từ trường và trung tâm bạn theo dõi, gợi ý khóa tiếp theo khi học gần xong khóa video' },
] as const

export const NOTIFICATION_CHANNELS = [
  { key: 'app', label: 'Trong app' },
  { key: 'email', label: 'Email' },
  { key: 'zalo', label: 'Zalo' },
] as const
