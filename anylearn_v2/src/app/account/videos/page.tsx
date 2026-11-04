import { redirect } from 'next/navigation'

// Video courses now live on "Khóa học của tôi" (progress and "Đi học" under a paid course).
export default function MyVideoCoursesPage() {
  redirect('/account/orders?tab=completed')
}
