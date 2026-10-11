'use client'

interface Props {
  year: number
  month: number   // 0-indexed
  markedDays: Set<string>
  selectedDay: string | null
  onSelectDay: (d: string) => void
  onPrevMonth: () => void
  onNextMonth: () => void
}

const DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

function pad2(n: number) { return String(n).padStart(2, '0') }
function isoDate(y: number, m: number, d: number) {
  return `${y}-${pad2(m + 1)}-${pad2(d)}`
}

export default function CalendarMonth({ year, month, markedDays, selectedDay, onSelectDay, onPrevMonth, onNextMonth }: Props) {
  const today = isoDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())

  const firstDow = new Date(year, month, 1).getDay() // 0=Sun..6=Sat
  // Convert to Mon-first offset: Mon=0 .. Sun=6
  const offset = firstDow === 0 ? 6 : firstDow - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7

  const monthName = new Date(year, month, 1).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })

  const cells: { day: number | null; iso: string | null }[] = []
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - offset + 1
    if (dayNum < 1 || dayNum > daysInMonth) {
      cells.push({ day: null, iso: null })
    } else {
      cells.push({ day: dayNum, iso: isoDate(year, month, dayNum) })
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={onPrevMonth} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: 16 }}>‹</button>
        <span style={{ fontWeight: 800, fontSize: 15, color: '#1e2047', textTransform: 'capitalize' }}>
          {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
        </span>
        <button onClick={onNextMonth} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: 16 }}>›</button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
        {DAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#9ca3af', padding: '4px 0' }}>{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
        {cells.map((cell, i) => {
          if (!cell.iso) {
            return <div key={i} style={{ height: 40 }} />
          }
          const isToday = cell.iso === today
          const isSelected = cell.iso === selectedDay
          const hasClass = markedDays.has(cell.iso)
          return (
            <button
              key={cell.iso}
              onClick={() => onSelectDay(cell.iso!)}
              style={{
                height: 40,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                borderRadius: 8,
                border: isToday ? '2px solid #00539b' : '2px solid transparent',
                background: isSelected ? '#e7f3ff' : 'transparent',
                cursor: 'pointer',
                fontWeight: isSelected ? 700 : 400,
                color: isSelected ? '#00539b' : '#374151',
                fontSize: 13,
              }}
            >
              {cell.day}
              {hasClass && (
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#00539b', flexShrink: 0 }} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
