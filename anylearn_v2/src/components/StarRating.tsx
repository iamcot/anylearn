import { StarIcon } from '@/components/icons'

const MAX_STARS = 5

export default function StarRating({ value, className = 'size-3.5' }: { value: number; className?: string }) {
  const filled = Math.round(value)
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${filled} trên ${MAX_STARS} sao`}>
      {Array.from({ length: MAX_STARS }, (_, index) => (
        <StarIcon key={index} filled className={`${className} ${index < filled ? 'text-star' : 'text-line'}`} />
      ))}
    </span>
  )
}
