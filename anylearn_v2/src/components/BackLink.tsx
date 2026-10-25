import Link from 'next/link'
import { ChevronLeftIcon } from '@/components/icons'

export default function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex min-h-11 items-center gap-0.5 text-sm font-bold text-blue no-underline hover:underline">
      <ChevronLeftIcon className="-ml-1 size-5" />
      {children}
    </Link>
  )
}
