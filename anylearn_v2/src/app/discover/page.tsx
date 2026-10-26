import type { Metadata } from 'next'
import DiscoverList from '@/components/home/DiscoverList'

export const metadata: Metadata = {
  title: 'Thử điều mới cho con | anyLEARN',
  description: 'Mỗi ngày một danh sách khóa học mới, hợp tuổi và gần nhà.',
}

export default function DiscoverPage() {
  return <DiscoverList />
}
