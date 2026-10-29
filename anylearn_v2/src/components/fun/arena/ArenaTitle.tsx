/** "Đấu trường Leo" in gold with a dark green outline and a band of light running across (two layers: outline below, gold above). */
export default function ArenaTitle({ text = 'Đấu trường Leo', className = '', tone = 'green', style }: { text?: string; className?: string; tone?: 'green' | 'orange'; style?: React.CSSProperties }) {
  return (
    <span style={style} className={`arena-title ${tone === 'orange' ? 'arena-title--orange' : ''} ${className}`}>
      <span className="arena-title__stroke" aria-hidden="true">{text}</span>
      <span className="arena-title__fill">{text}</span>
    </span>
  )
}
