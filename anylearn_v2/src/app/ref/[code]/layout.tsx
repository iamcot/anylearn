import type { Metadata } from 'next'
import { checkReferral } from '@/lib/api/referral'
import { shareMeta } from '@/lib/seo/shareMeta'

type Props = { params: Promise<{ code: string }> }

// A referral link is shared in chats more than any other page: the preview names the friend (only the last word of the name).
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  const { valid, name } = await checkReferral(code)
  return shareMeta('invite', valid && name ? { ogTitle: `${name} mời bạn tham gia anyLEARN` } : {})
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
