import { filledRows, HOUSE_ROWS, houseStage, housesBadge } from '@/lib/foundation/rules'

// The house being built: brick rows fill from the bottom by percent, the roof and door appear late, colour shows when
// done. Finished houses are a small house with "X{count}" next to it (plan 21: "từ viên gạch đến căn nhà").
export default function HouseProgress({ percent, housesBuilt, size = 'md' }: { percent: number; housesBuilt: number; size?: 'sm' | 'md' | 'lg' }) {
  const rows = filledRows(percent)
  const stage = houseStage(percent)
  const w = size === 'lg' ? 'w-40' : size === 'sm' ? 'w-16' : 'w-24'
  const badge = housesBadge(housesBuilt)
  return (
    <div className="flex items-end gap-3">
      <svg viewBox="0 0 100 100" className={`${w} shrink-0`} role="img" aria-label={`Căn nhà đang xây: ${percent}%`}>
        <polygon points="8,44 50,10 92,44" fill={stage === 'roof' || stage === 'door' || stage === 'done' ? '#e85d3f' : '#eceff3'} stroke="#c9ced6" strokeWidth="1.5" />
        {Array.from({ length: HOUSE_ROWS }).map((_, i) => {
          const fromBottom = HOUSE_ROWS - 1 - i
          const filled = fromBottom < rows
          const top = fromBottom === rows - 1 && stage !== 'done'
          return (
            <g key={i} className={top ? 'brick-pulse' : undefined}>
              {[0, 1, 2, 3].map(j => (
                <rect key={j} x={16 + j * 17 + (i % 2 ? 4 : 0)} y={46 + i * 6.5} width={15.5} height={5.5} rx={1}
                  fill={filled ? '#c8643b' : '#f1f3f6'} stroke={filled ? '#a44d2a' : '#dde1e7'} strokeWidth=".6" />
              ))}
            </g>
          )
        })}
        {(stage === 'door' || stage === 'done') && <rect x="43" y="72" width="14" height="26" rx="2" fill="#00a551" />}
      </svg>
      {badge && (
        <div className="flex items-center gap-1 pb-1" aria-label={`Đã xây xong ${housesBuilt} căn`}>
          <svg viewBox="0 0 24 24" className="size-6"><polygon points="2,11 12,3 22,11" fill="#e85d3f" /><rect x="5" y="11" width="14" height="10" fill="#c8643b" /><rect x="10" y="14" width="4" height="7" fill="#00a551" /></svg>
          <span className="text-lg font-extrabold text-ink">{badge}</span>
        </div>
      )}
    </div>
  )
}
