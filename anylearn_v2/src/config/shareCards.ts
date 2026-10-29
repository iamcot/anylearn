// What a shared link of a top-level page shows in Zalo, Facebook, Messenger: title, description and the picture.
// The picture is drawn from the same record by `app/og-image/[page]/route.tsx` (1200x630, built at build time).
// Bump SHARE_IMAGE_VERSION after changing a picture, so the chat apps fetch the new one instead of their cached copy.

export const SHARE_IMAGE_VERSION = 1

/** Files in public/og (the production deploy ships `public`, not `src`). */
export type ShareArt = 'logo' | 'leo_front' | 'leo_arena' | 'leo_rank' | 'leo_sticker' | 'leo_discovery' | 'leo_shop'

export interface ShareCard {
  /** og:title and twitter:title. */
  title: string
  /** og:description (and the page description when the page has none of its own). */
  description: string
  /** Small line above the headline of the picture. */
  eyebrow: string
  /** Big text of the picture. */
  headline: string
  /** Text under the headline of the picture. */
  sub: string
  art: ShareArt
  /** Background gradient of the picture, top left to bottom right. */
  colors: [string, string]
}

const SITE = ['#ffffff', '#e3f1ff'] as [string, string]
const FUN = ['#f3fff8', '#c9f5dc'] as [string, string]

export const SHARE_CARDS = {
  home: {
    title: 'anyLEARN - Học không giới hạn',
    description: 'Tìm trường, khóa học, chuyên gia phù hợp cho con: so sánh học phí, lịch học, đánh giá thật từ phụ huynh và đăng ký ngay.',
    eyebrow: 'Dành cho phụ huynh',
    headline: 'Tìm khóa học phù hợp cho con',
    sub: 'Trường học, trung tâm, gia sư uy tín · So sánh giá, lịch học, đánh giá',
    art: 'logo',
    colors: SITE,
  },
  info: {
    title: 'Giới thiệu anyLEARN',
    description: 'anyLEARN giúp phụ huynh tìm, so sánh và đăng ký trường học, khóa học, chuyên gia phù hợp cho con, tất cả ở một nơi.',
    eyebrow: 'Giới thiệu',
    headline: 'Một nơi cho mọi lựa chọn học của con',
    sub: 'Đối tác được kiểm tra · Tư vấn miễn phí · Lịch học của cả nhà ở một nơi',
    art: 'logo',
    colors: SITE,
  },
  why: {
    title: 'Vì sao đặt qua anyLEARN?',
    description: 'Giá bằng hoặc rẻ hơn tại trường, nhận anyPoint, hoàn tiền nếu lớp không mở, mọi lịch học một nơi và hỗ trợ qua Zalo.',
    eyebrow: 'Cam kết của anyLEARN',
    headline: 'Giá bằng hoặc rẻ hơn tại trường',
    sub: 'Nhận anyPoint · Hoàn tiền nếu lớp không mở · Hỗ trợ qua Zalo',
    art: 'logo',
    colors: SITE,
  },
  search: {
    title: 'Tìm khóa học cho con | anyLEARN',
    description: 'Lọc theo tuổi của con, khu vực, giờ học và học phí. Xem lịch học, đánh giá và đăng ký ngay trên anyLEARN.',
    eyebrow: 'Tìm kiếm',
    headline: 'Khóa học hợp tuổi, gần nhà',
    sub: 'Lọc theo tuổi, khu vực, giờ học, học phí · Học thử miễn phí',
    art: 'logo',
    colors: SITE,
  },
  discover: {
    title: 'Thử điều mới cho con | anyLEARN',
    description: 'Mỗi ngày một danh sách khóa học mới, hợp tuổi và gần nhà.',
    eyebrow: 'Khám phá',
    headline: 'Thử điều mới cho con',
    sub: 'Mỗi ngày một danh sách khóa học mới, hợp tuổi và gần nhà',
    art: 'logo',
    colors: SITE,
  },
  today: {
    title: 'Hôm nay của con | anyLEARN',
    description: 'Lịch học hôm nay của cả nhà, điểm danh, xin nghỉ và nhắc lịch, gọn trong một trang.',
    eyebrow: 'Hôm nay',
    headline: 'Lịch học của cả nhà trong một trang',
    sub: 'Điểm danh · Xin nghỉ, đổi lịch · Nhắc lịch trước giờ học',
    art: 'logo',
    colors: SITE,
  },
  community: {
    title: 'Cộng đồng lớp học | anyLEARN',
    description: 'Nhóm chat của từng lớp: phụ huynh cùng lớp trao đổi, nhận thông báo từ thầy cô và trung tâm.',
    eyebrow: 'Cộng đồng',
    headline: 'Phụ huynh cùng lớp, chung một nhóm',
    sub: 'Trao đổi với phụ huynh cùng lớp · Thông báo từ thầy cô, trung tâm',
    art: 'logo',
    colors: SITE,
  },
  article: {
    title: 'Bài viết & Kiến thức giáo dục | anyLEARN',
    description: 'Khám phá các bài viết hữu ích về giáo dục, kỹ năng và hành trình học tập của con.',
    eyebrow: 'Bài viết',
    headline: 'Kiến thức cho hành trình học của con',
    sub: 'Giáo dục, kỹ năng, kinh nghiệm chọn trường và khóa học',
    art: 'logo',
    colors: SITE,
  },
  helpcenter: {
    title: 'Trung tâm hỗ trợ | anyLEARN',
    description: 'Câu hỏi thường gặp về đăng ký, thanh toán, anyPoint và lịch học trên anyLEARN.',
    eyebrow: 'Hỗ trợ',
    headline: 'Cần giúp? anyLEARN luôn sẵn sàng',
    sub: 'Đăng ký, thanh toán, anyPoint, lịch học',
    art: 'logo',
    colors: SITE,
  },
  compare: {
    title: 'So sánh khóa học | anyLEARN',
    description: 'Đặt các khóa học cạnh nhau: học phí, giá mỗi buổi, lịch học, độ tuổi, khoảng cách và đánh giá.',
    eyebrow: 'So sánh',
    headline: 'Đặt các khóa học cạnh nhau',
    sub: 'Học phí, giá mỗi buổi, lịch học, khoảng cách, đánh giá',
    art: 'logo',
    colors: SITE,
  },
  fun: {
    title: 'Vui học cùng Leo | anyLEARN',
    description: 'Vào chơi cùng Leo! Điểm danh nhận quà mỗi ngày, đố vui leo rank, sưu tầm sticker và Đấu trường Leo mỗi tối.',
    eyebrow: 'anyLEARN · Vui học',
    headline: 'Vào chơi cùng Leo nào!',
    sub: 'Quà điểm danh · Đố vui leo rank · Sticker · Đấu trường mỗi tối',
    art: 'leo_front',
    colors: FUN,
  },
  arena: {
    title: 'Đấu trường Leo | anyLEARN',
    description: 'Mỗi tối một trận đố vui trực tiếp, mọi người cùng trả lời một lúc. Top 3 nhận Leo Xu và sticker. Nhấn "Nhắc tôi" để không lỡ trận!',
    eyebrow: 'anyLEARN · Vui học',
    headline: 'Đấu trường Leo mỗi tối',
    sub: 'Cùng trả lời một lúc với mọi người · Top 3 nhận Leo Xu và sticker',
    art: 'leo_arena',
    colors: ['#fff8db', '#ffe08a'],
  },
  quiz: {
    title: 'Leo rank: đố vui leo hạng | anyLEARN',
    description: 'Trả lời đúng để leo từ hạng Đồng lên Huyền thoại, dùng quyền trợ giúp và nhận quà khi lên hạng.',
    eyebrow: 'anyLEARN · Vui học',
    headline: 'Đố vui leo hạng cùng Leo',
    sub: 'Từ Đồng lên Huyền thoại · Quyền trợ giúp · Quà khi lên hạng',
    art: 'leo_rank',
    colors: FUN,
  },
  sticker: {
    title: 'Sưu tầm sticker Leo | anyLEARN',
    description: 'Nhận sticker khi điểm danh, đổi sticker trùng với bạn bè và hoàn thành bộ sưu tập để nhận thưởng.',
    eyebrow: 'anyLEARN · Vui học',
    headline: 'Sưu tầm sticker Leo',
    sub: 'Nhận khi điểm danh · Đổi với bạn bè · Đủ bộ nhận thưởng',
    art: 'leo_sticker',
    colors: ['#fdf4ff', '#f0d9ff'],
  },
  explore: {
    title: 'Khám phá cùng Leo | anyLEARN',
    description: 'Clip và bài viết ngắn vui, bổ ích cho bé và phụ huynh, xem lúc chờ con tan lớp.',
    eyebrow: 'anyLEARN · Vui học',
    headline: 'Khám phá điều hay mỗi ngày',
    sub: 'Clip và bài viết ngắn vui, bổ ích cho cả nhà',
    art: 'leo_discovery',
    colors: ['#f0f9ff', '#cdeafe'],
  },
  shop: {
    title: 'Cửa hàng Leo Xu | anyLEARN',
    description: 'Dùng Leo Xu đổi quyền trợ giúp, năng lượng, gói luyện tập và rương sticker.',
    eyebrow: 'anyLEARN · Vui học',
    headline: 'Cửa hàng Leo Xu',
    sub: 'Quyền trợ giúp · Năng lượng · Gói luyện tập · Rương sticker',
    art: 'leo_shop',
    colors: ['#fffbeb', '#fde7b0'],
  },
  invite: {
    title: 'Bạn được mời tham gia anyLEARN',
    description: 'Đăng ký anyLEARN để tìm khóa học phù hợp cho con và cùng chơi Vui học với Leo: quà điểm danh, đố vui, sticker.',
    eyebrow: 'Lời mời',
    headline: 'Bạn được mời vào anyLEARN',
    sub: 'Tìm khóa học cho con · Cùng chơi Vui học với Leo',
    art: 'leo_front',
    colors: FUN,
  },
} satisfies Record<string, ShareCard>

export type ShareCardKey = keyof typeof SHARE_CARDS

export const SHARE_CARD_KEYS = Object.keys(SHARE_CARDS) as ShareCardKey[]

export function isShareCardKey(key: string): key is ShareCardKey {
  return Object.prototype.hasOwnProperty.call(SHARE_CARDS, key)
}

/** Path of the picture of a card (made absolute by `metadataBase` in the root layout). */
export function shareImagePath(key: ShareCardKey): string {
  return `/og-image/${key}?v=${SHARE_IMAGE_VERSION}`
}
