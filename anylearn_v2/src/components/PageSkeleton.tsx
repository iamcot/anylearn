const ROW_COUNT = 4
const CARD_COUNT = 8

export function ListSkeleton({ showTitle = true }: { showTitle?: boolean }) {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Đang tải">
      {showTitle && <div className="mb-4 h-7 w-1/3 rounded bg-line" />}
      <div className="flex flex-col gap-3">
        {Array.from({ length: ROW_COUNT }, (_, index) => (
          <div key={index} className="h-20 rounded-xl bg-line/60" />
        ))}
      </div>
    </div>
  )
}

export function DetailSkeleton() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Đang tải">
      <div className="h-5 w-1/4 rounded bg-line" />
      <div className="mt-3 h-8 w-2/3 rounded bg-line" />
      <div className="mt-4 h-36 rounded-xl bg-line/60" />
      <div className="mt-4 flex flex-col gap-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="h-14 rounded-xl bg-line/60" />
        ))}
      </div>
    </div>
  )
}

export function CardGridSkeleton() {
  return (
    <div className="grid animate-pulse grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5" aria-busy="true" aria-label="Đang tải">
      {Array.from({ length: CARD_COUNT }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-card border border-line">
          <div className="aspect-square bg-line/60" />
          <div className="flex flex-col gap-2 p-4">
            <div className="h-4 w-4/5 rounded bg-line" />
            <div className="h-3 w-2/5 rounded bg-line/60" />
          </div>
        </div>
      ))}
    </div>
  )
}
