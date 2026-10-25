import { ListSkeleton } from '@/components/PageSkeleton'

export default function Loading() {
  return (
    <div className="mx-auto max-w-[720px] px-4 py-8">
      <ListSkeleton />
    </div>
  )
}
