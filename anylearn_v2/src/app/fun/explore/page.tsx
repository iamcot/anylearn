import { Suspense } from 'react'
import ExploreViewer from '@/components/fun/explore/ExploreViewer'

export default function ExplorePage() {
  return <Suspense fallback={null}><ExploreViewer /></Suspense>
}
