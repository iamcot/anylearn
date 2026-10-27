'use client'

import dynamic from 'next/dynamic'
import { Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { parseSearchParams } from '@/lib/search/query'

// The map script touches `window`, so the page is only rendered in the browser.
const NearbyMapView = dynamic(() => import('@/components/search/NearbyMapView'), { ssr: false })

function MapPageInner() {
  const searchParams = useSearchParams()
  const key = searchParams.toString()
  const state = useMemo(() => parseSearchParams(new URLSearchParams(key)), [key])
  const back = `/search${key ? `?${key}` : ''}`
  if (!state.adv.near) {
    return <p className="p-6 text-sm text-muted">Chưa có vị trí của bạn. <a className="font-bold text-green-dark" href={back}>Quay lại tìm kiếm</a></p>
  }
  return <NearbyMapView center={state.adv.near} radiusKm={state.adv.radiusKm} backHref={back} />
}

export default function NearbyMapPage() {
  return <Suspense><MapPageInner /></Suspense>
}
