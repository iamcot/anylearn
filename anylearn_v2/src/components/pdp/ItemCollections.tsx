'use client'

import { useEffect, useState } from 'react'
import { getCollectionsOfItem, type CollectionCard } from '@/lib/api/collections'
import CollectionsRow from '@/components/home/CollectionsRow'

// "Khóa học này thuộc bộ sưu tập" on the course page: each card opens the collection. Nothing when there is none.
export default function ItemCollections({ itemId }: { itemId: number }) {
  const [collections, setCollections] = useState<CollectionCard[]>([])

  useEffect(() => {
    let cancelled = false
    getCollectionsOfItem(itemId).then(list => { if (!cancelled) setCollections(list) })
    return () => { cancelled = true }
  }, [itemId])

  return <CollectionsRow collections={collections} title="Khóa học này thuộc bộ sưu tập" />
}
