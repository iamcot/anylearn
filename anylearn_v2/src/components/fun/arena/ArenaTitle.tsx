/** "Đấu trường Leo" in gold with a dark green outline and a band of light running across (two layers: outline below, gold above). */
export default function ArenaTitle({ text = 'Đấu trường Leo', className = '' }: { text?: string; className?: string }) {
  return (
    <span className={`arena-title ${className}`}>
      <span className="arena-title__stroke" aria-hidden="true">{text}</span>
      <span className="arena-title__fill">{text}</span>
    </span>
  )
}
