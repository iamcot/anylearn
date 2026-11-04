import { redirect } from 'next/navigation'

// Liked courses now sit at the bottom of "Khóa học của tôi".
export default function FavoritesPage() {
  redirect('/account/orders#yeu-thich')
}
