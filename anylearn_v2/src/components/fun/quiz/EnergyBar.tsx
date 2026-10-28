import { BoltIcon } from '@/components/icons'
import { energyLine, energyPercent } from '@/lib/shop/rules'

/** The light blue lightning bar above the ready button: "23/30 · +1 sau 03:12" and a small "+" that opens the refill. */
export default function EnergyBar({ value, max, nextInSeconds, canRefill, refillOpen, onRefill }: {
  value: number
  max: number
  nextInSeconds: number
  canRefill: boolean
  refillOpen: boolean
  onRefill: () => void
}) {
  const empty = value <= 0
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1.5 text-sm font-extrabold ${empty ? 'text-warn-text' : 'text-[#2a8fd6]'}`} aria-live="off">
          <BoltIcon className="size-5 fill-current" aria-hidden /> {energyLine(value, max, nextInSeconds)}
        </span>
        {canRefill && (
          <button type="button" onClick={onRefill} aria-expanded={refillOpen} aria-label="Nạp năng lượng" title="Nạp năng lượng"
            className="grid size-8 cursor-pointer place-items-center rounded-full border-0 bg-[#4fb3f0] text-lg font-black leading-none text-white">+</button>
        )}
      </div>
      <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-black/10" role="progressbar" aria-label="Năng lượng" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
        <div className="h-full rounded-full bg-[#5bbcf5] transition-[width] duration-500" style={{ width: `${energyPercent(value, max)}%` }} />
      </div>
    </div>
  )
}
