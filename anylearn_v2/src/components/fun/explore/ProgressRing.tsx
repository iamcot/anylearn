/** A round progress mark with the percentage in the middle (clip uploads). */
export default function ProgressRing({ percent, size = 56 }: { percent: number; size?: number }) {
  const stroke = 5
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const value = Math.max(0, Math.min(100, percent))
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} className="text-green transition-[stroke-dashoffset] duration-300" />
      </svg>
      <span className="absolute text-xs font-extrabold text-ink">{value}%</span>
    </div>
  )
}
