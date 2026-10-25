import { ChevronRightIcon } from '@/components/icons'

export default function ChevronLabel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 whitespace-nowrap ${className}`}>
      {children}
      <ChevronRightIcon className="size-4 shrink-0" />
    </span>
  )
}
