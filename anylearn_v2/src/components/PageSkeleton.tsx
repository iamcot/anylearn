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

function Bar({ className }: { className: string }) {
  return <div className={`rounded bg-line ${className}`} />
}

function TextLines({ count = 6 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }, (_, index) => (
        <Bar key={index} className={`h-3.5 ${index === count - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  )
}

export function HomeSkeleton() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Đang tải">
      <section className="hero-section bg-gradient-to-br from-blue to-green">
        <div className="container">
          <div className="mb-5 h-8 w-64 rounded-full bg-white/20" />
          <div className="mb-3 h-10 w-full max-w-3xl rounded bg-white/20 lg:h-14" />
          <div className="mb-8 h-10 w-2/3 max-w-xl rounded bg-white/20 lg:h-14" />
          <div className="h-[84px] max-w-[900px] rounded-[28px] bg-white/90" />
        </div>
      </section>
      <div className="container -mt-14 grid grid-cols-1 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-[84px] rounded-[18px] border border-line bg-white" />
        ))}
      </div>
      <div className="container section">
        <Bar className="mb-6 h-8 w-1/3" />
        <CardGridSkeleton />
      </div>
    </div>
  )
}

export function PdpSkeleton() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Đang tải">
      <section className="section--soft pb-10 pt-10">
        <div className="container">
          <Bar className="mb-5 h-5 w-24" />
          <div className="pdp-hero">
            <div>
              <div className="aspect-video rounded-card bg-line/60" />
              <Bar className="mt-6 h-8 w-4/5" />
              <div className="mt-4 flex gap-2">
                <Bar className="h-6 w-20 rounded-full" />
                <Bar className="h-6 w-24 rounded-full" />
              </div>
            </div>
            <div className="rounded-[26px] border border-line bg-white p-7">
              <Bar className="mb-5 h-9 w-1/2" />
              <div className="mb-5 h-24 rounded-2xl bg-line/60" />
              <div className="h-12 rounded-full bg-line" />
            </div>
          </div>
        </div>
      </section>
      <div className="container section">
        <TextLines count={8} />
      </div>
    </div>
  )
}

export function SearchSkeleton() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Đang tải">
      <section className="search-hero bg-gradient-to-br from-blue to-green">
        <div className="container">
          <div className="mb-3 h-8 w-1/2 rounded bg-white/20" />
          <div className="h-[66px] max-w-[900px] rounded-[28px] bg-white/90" />
        </div>
      </section>
      <div className="container search-layout section grid items-start gap-7 lg:grid-cols-[300px_1fr]">
        <div className="hidden h-80 rounded-card bg-line/60 lg:block" />
        <CardGridSkeleton />
      </div>
    </div>
  )
}

export function ArticleListSkeleton() {
  return (
    <div className="container animate-pulse py-8" aria-busy="true" aria-label="Đang tải">
      <Bar className="mb-3 h-4 w-32" />
      <Bar className="mb-3 h-9 w-2/3" />
      <Bar className="mb-8 h-4 w-1/2" />
      <div className="grid gap-5 md:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="overflow-hidden rounded-card border border-line">
            <div className="aspect-video bg-line/60" />
            <div className="flex flex-col gap-2 p-4">
              <Bar className="h-4 w-4/5" />
              <Bar className="h-3 w-full" />
              <Bar className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ArticleSkeleton() {
  return (
    <div className="container max-w-[800px] animate-pulse py-8" aria-busy="true" aria-label="Đang tải">
      <Bar className="mb-6 h-4 w-1/3" />
      <Bar className="mb-3 h-9 w-full" />
      <Bar className="mb-6 h-9 w-2/3" />
      <div className="mb-6 aspect-video rounded-card bg-line/60" />
      <TextLines count={10} />
    </div>
  )
}

export function DocSkeleton() {
  return (
    <section className="section animate-pulse" aria-busy="true" aria-label="Đang tải">
      <div className="container max-w-[780px]">
        <Bar className="mb-3 h-9 w-2/3" />
        <Bar className="mb-8 h-3.5 w-1/4" />
        <TextLines count={12} />
      </div>
    </section>
  )
}

export function TodaySkeleton() {
  return (
    <div className="mx-auto max-w-[1100px] animate-pulse px-4 pb-28 pt-5 lg:px-0 lg:pb-12 lg:pt-8" aria-busy="true" aria-label="Đang tải">
      <Bar className="mb-4 h-8 w-1/3" />
      <div className="mb-4 h-20 rounded-card bg-line/60" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="h-28 rounded-card bg-line/60" />
        ))}
      </div>
    </div>
  )
}

export function FormPageSkeleton() {
  return (
    <section className="section">
      <div className="container max-w-[720px]">
        <ListSkeleton />
      </div>
    </section>
  )
}
