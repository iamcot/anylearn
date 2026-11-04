import { redirect } from 'next/navigation'

// Course codes now live on "Khóa học của tôi" (button "Xem mã code" of a paid course).
export default function CourseCodesPage() {
  redirect('/account/orders?tab=completed')
}
