export const ZALO_SUPPORT_URL = 'https://zalo.me/0374900344'
export const SUPPORT_HOURS = '8:30 - 18:00, Thứ 2 - Thứ 7'
export const RETURN_POLICY_HREF = '/guide?p=guide_return_term'

export type PromiseKey = 'price' | 'refund' | 'schedule' | 'support'

export interface AnyLearnPromise {
  key: PromiseKey
  short: string
  detail: string
}

// The "lời hứa anyLEARN": short labels for the course page strip, details for /info/why-anylearn.
// The refund wording still waits for the owner's confirmation (plans/PROGRESS.md, open questions).
export const PROMISES: AnyLearnPromise[] = [
  {
    key: 'price',
    short: 'Giá bằng hoặc rẻ hơn tại trường',
    detail: 'anyLEARN thỏa thuận trực tiếp với đối tác để giá trên anyLEARN bằng hoặc rẻ hơn giá bạn đóng khi tới trường, và bạn còn nhận thêm anyPoint cho mỗi khóa học.',
  },
  {
    key: 'refund',
    short: 'Hoàn tiền nếu lớp không mở',
    detail: 'Nếu lớp bạn đã đăng ký không mở, anyLEARN hoàn lại số tiền đã thanh toán. Các trường hợp đổi, trả khác theo Chính sách đổi - trả và hoàn tiền.',
  },
  {
    key: 'schedule',
    short: 'Mọi lịch học một nơi',
    detail: 'Lịch của tất cả các bé nằm trong một màn hình: nhắc lịch trước buổi học, điểm danh, xin nghỉ hoặc đổi lịch, và nhật ký học tập.',
  },
  {
    key: 'support',
    short: 'Hỗ trợ qua Zalo',
    detail: `Cần giúp gì, nhắn anyLEARN qua Zalo trong giờ làm việc (${SUPPORT_HOURS}). Chúng tôi trả lời và hỗ trợ xử lý đơn, lịch học, thanh toán.`,
  },
]

export const PRICE_GUARANTEE_LINE = 'Giá đã bằng hoặc rẻ hơn tại trường.'

export interface FaqItem {
  question: string
  answer: string
}

export const WHY_FAQ: FaqItem[] = [
  {
    question: 'Vì sao nên đăng ký qua anyLEARN thay vì tới trường?',
    answer: 'Giá bằng hoặc rẻ hơn tại trường, nhận thêm anyPoint để giảm cho khóa sau, và mọi lịch học của các bé nằm ở một nơi với nhắc lịch, điểm danh, xin nghỉ. Không cần xếp hàng hay chuyển khoản cho từng trường.',
  },
  {
    question: 'Làm sao biết giá trên anyLEARN rẻ hơn hoặc bằng tại trường?',
    answer: 'anyLEARN thỏa thuận giá trực tiếp với từng đối tác. Nếu bạn thấy giá rẻ hơn ở nơi khác, bấm "Báo giá rẻ hơn" ở trang khóa học, anyLEARN sẽ kiểm tra và điều chỉnh.',
  },
  {
    question: 'anyPoint là gì, dùng như thế nào?',
    answer: 'anyPoint là phần thưởng bạn nhận khi mua khóa học, dùng để giảm tiền cho khóa tiếp theo. Xem chi tiết ở trang "anyPoint là gì?".',
  },
  {
    question: 'Nếu lớp không mở thì sao?',
    answer: 'anyLEARN hoàn lại số tiền đã thanh toán cho đơn đó. Các trường hợp đổi, trả khác xem Chính sách đổi - trả và hoàn tiền.',
  },
  {
    question: 'Tôi cần hỗ trợ thì liên hệ ở đâu?',
    answer: `Nhắn anyLEARN qua Zalo trong giờ làm việc (${SUPPORT_HOURS}).`,
  },
]
