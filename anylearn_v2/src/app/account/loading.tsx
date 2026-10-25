import { ListSkeleton } from '@/components/PageSkeleton'

export default function Loading() {
  return (
    <div className="rounded-card border border-line bg-white p-5">
      <ListSkeleton />
    </div>
  )
}
