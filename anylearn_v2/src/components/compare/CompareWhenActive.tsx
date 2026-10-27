'use client'

import { useCompareList } from '@/lib/compare/store'
import CompareToggle from './CompareToggle'

/** The "+ So sánh" link on a card that is shown only while the parent is comparing (at least one course picked). */
export default function CompareWhenActive({ itemId, title, image }: { itemId: number; title: string; image?: string | null }) {
  const list = useCompareList()
  if (list.length === 0) return null
  return <div className="px-3.5 pb-2.5"><CompareToggle itemId={itemId} title={title} image={image} variant="text" /></div>
}
