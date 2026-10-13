import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Hôm nay - anyLEARN',
}

export default function TodayLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-[calc(100vh-76px)] bg-bg text-ink">{children}</div>
}
