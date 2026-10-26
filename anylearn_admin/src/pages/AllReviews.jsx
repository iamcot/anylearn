import { Card } from 'antd'
import ReviewManager from '../components/ReviewManager'
import SlidePage from '../components/SlidePage'

export default function AllReviews() {
  return (
    <SlidePage title="Tất cả đánh giá" subtitle="Đánh giá của mọi khóa học: ẩn (kèm lý do), hiện lại, xóa; xem đánh giá đối tác báo cáo">
      <Card>
        <ReviewManager />
      </Card>
    </SlidePage>
  )
}
