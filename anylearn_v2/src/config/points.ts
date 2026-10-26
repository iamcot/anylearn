export const POINT_VALUE_VND = 1000

export interface AnyPointWay {
  title: string
  detail: string
}

// Shown on /account/anypoint and /info/anypoint. The exact points of a purchase differ per course and are shown on its page.
export const HOW_TO_EARN: AnyPointWay[] = [
  { title: 'Mua khóa học', detail: 'Mỗi khóa học tặng lại anyPoint khi đơn được xác nhận. Số anyPoint hiện sẵn ở trang khóa học và trong giỏ hàng.' },
  { title: 'Viết đánh giá khóa học', detail: 'Sau khi học, viết đánh giá từ 50 ký tự để nhận anyPoint, thêm ảnh nhận thêm. Số anyPoint hiện ngay trong form đánh giá.' },
  { title: 'Giới thiệu bạn bè', detail: 'Bạn bè đăng ký bằng giới thiệu của bạn mua khóa học, bạn nhận thêm anyPoint cho mỗi đơn của họ.' },
]

export const HOW_TO_USE: AnyPointWay[] = [
  { title: 'Giảm tiền khi thanh toán', detail: `1 anyPoint ~ ${POINT_VALUE_VND.toLocaleString('vi-VN')}đ. Bật "Dùng anyPoint" ở bước thanh toán, hệ thống tự tính số anyPoint có lợi nhất.` },
  { title: 'Đơn bị hủy thì anyPoint quay lại', detail: 'anyPoint đã dùng cho một đơn không thanh toán thành công sẽ được hoàn lại vào số dư.' },
]
