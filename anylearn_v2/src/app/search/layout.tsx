import type { Metadata } from 'next'
import { shareMeta } from '@/lib/seo/shareMeta'

// The page is a client component, so the link preview text lives here (config/shareCards.ts).
export const metadata: Metadata = shareMeta('search')

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
