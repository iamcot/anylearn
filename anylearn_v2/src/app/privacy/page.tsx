import type { Metadata } from 'next'
import DocPage from '@/components/DocPage'
import { fetchDoc } from '@/lib/docs/fetchDoc'

export const metadata: Metadata = {
  title: 'Chính sách bảo mật thông tin - anyLEARN',
}

export default async function PrivacyPage() {
  return <DocPage title="Chính sách bảo mật thông tin" doc={await fetchDoc('guide_privacy')} />
}
