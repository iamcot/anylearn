import type { Metadata } from 'next'
import DiscoverList from '@/components/home/DiscoverList'
import { shareMeta } from '@/lib/seo/shareMeta'

export const metadata: Metadata = shareMeta('discover')

export default function DiscoverPage() {
  return <DiscoverList />
}
