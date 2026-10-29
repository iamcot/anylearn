export default function CountBadge({ count, className = '-right-1 -top-1' }: { count: number; className?: string }) {
  if (count <= 0) return null
  return (
    <span className={`absolute ${className} grid h-[18px] min-w-[18px] place-items-center rounded-full bg-red px-1 text-[11px] font-extrabold text-white`}>
      {count > 99 ? '99+' : count}
    </span>
  )
}
