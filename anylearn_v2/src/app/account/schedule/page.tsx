'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { getCourseUrl } from '@/lib/api'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/v2/api'

const PALETTE = ['#0078d4', '#107c10', '#b4009e', '#ff8c00', '#d13438', '#00b294', '#7b69ee']
const color = (id: number) => PALETTE[id % PALETTE.length]

const WD_MAP: Record<string, number> = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 0 }
const WD_VN: Record<string, string> = { mon:'Thứ Hai', tue:'Thứ Ba', wed:'Thứ Tư', thu:'Thứ Năm', fri:'Thứ Sáu', sat:'Thứ Bảy', sun:'Chủ Nhật' }
const VN_SHORT: Record<number, string> = { 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7', 0: 'CN' }
const ACT_LABEL: Record<string, string> = { trial: 'Học thử', test: 'Test đầu vào', visit: 'Tham quan' }
const ACT_COLOR = '#f59e0b'

interface Enrollment {
  id: number; itemId: number; itemTitle: string; seoUrl?: string
  scheduleType: string; weekdays?: string; timeStart?: string; timeEnd?: string
  dateStart?: string; dateEnd?: string; eventDate?: string; startDate?: string; endDate?: string
  scheduleTitle?: string; locationNote?: string; status: string
}
interface Activity {
  id: number; itemId: number; itemTitle: string; seoUrl?: string
  type: string; date?: string; note?: string; status: number
}
type SelectedEvent = { kind: 'enrollment'; data: Enrollment } | { kind: 'activity'; data: Activity }
type AnchoredEvent = { sel: SelectedEvent; x: number; y: number }
type Period = 'month' | 'week'
type ViewMode = 'calendar' | 'list'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const norm = (e: any): Enrollment => ({
  id: e.id, itemId: e.item_id, itemTitle: e.item_title ?? '', seoUrl: e.seo_url,
  scheduleType: e.schedule_type ?? '', weekdays: e.weekdays,
  timeStart: e.time_start, timeEnd: e.time_end,
  dateStart: e.date_start, dateEnd: e.date_end,
  eventDate: e.event_date, startDate: e.start_date, endDate: e.end_date,
  scheduleTitle: e.schedule_title, locationNote: e.location_note, status: e.status,
})
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normAct = (a: any): Activity => ({
  id: a.id, itemId: a.item_id, itemTitle: a.item_title ?? '', seoUrl: a.seo_url,
  type: a.type ?? '', date: a.date, note: a.note, status: Number(a.status),
})

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function getMondayOfWeek(d: Date) {
  const day = d.getDay(); const diff = day === 0 ? -6 : 1 - day
  const m = new Date(d); m.setDate(d.getDate() + diff); return m
}
function classesForDate(enrollments: Enrollment[], iso: string): Enrollment[] {
  const dow = new Date(iso + 'T00:00:00').getDay()
  return enrollments.filter(e => {
    if (e.status !== 'active') return false
    if (e.scheduleType === 'event') return e.eventDate?.substring(0, 10) === iso
    // billing-only: no schedule type, but has start/end date — show every day in range
    if (!e.scheduleType || e.scheduleType === '') {
      const s = e.startDate; const en = e.endDate
      if (!s) return false
      if (iso < s.substring(0, 10)) return false
      if (en && iso > en.substring(0, 10)) return false
      return true
    }
    const days = (e.weekdays ?? '').split(',').map(d => WD_MAP[d.trim()]).filter(v => v !== undefined) as number[]
    if (!days.includes(dow)) return false
    const s = e.startDate ?? e.dateStart; const en = e.dateEnd
    if (s && iso < s.substring(0, 10)) return false
    if (en && iso > en.substring(0, 10)) return false
    return true
  })
}
function activitiesForDate(activities: Activity[], iso: string) {
  return activities.filter(a => a.date === iso && a.status >= 0)
}
function weekRange(d: Date) {
  const mon = getMondayOfWeek(d); const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
  return { from: toISO(mon), to: toISO(sun) }
}
function monthRange(d: Date) {
  const y = d.getFullYear(), m = d.getMonth()
  return { from: `${y}-${String(m+1).padStart(2,'0')}-01`, to: `${y}-${String(m+1).padStart(2,'0')}-${String(new Date(y,m+1,0).getDate()).padStart(2,'0')}` }
}

// ── Popup ────────────────────────────────────────────────────────────────────

function EventPopup({ anchored, onClose, onCancelActivity }: {
  anchored: AnchoredEvent; onClose: () => void; onCancelActivity: (id: number) => void
}) {
  const { sel, x, y } = anchored
  const [confirming, setConfirming] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const e = sel.kind === 'enrollment' ? sel.data : null
  const a = sel.kind === 'activity' ? sel.data : null

  const PW = 360
  // Clamp left so popup stays in viewport
  const left = Math.min(Math.max(x - PW / 2, 8), window.innerWidth - PW - 8)
  // Arrow offset from popup left edge
  const arrowOff = Math.min(Math.max(x - left - 10, 12), PW - 28)
  // Place below click; if not enough room, go above
  const spaceBelow = window.innerHeight - y - 16
  const below = spaceBelow >= 240
  const top = below ? y + 10 : y - 10

  const weekdayStr = e?.weekdays
    ? e.weekdays.split(',').map(d => WD_VN[d.trim()] ?? d.trim()).join(', ')
    : null
  const timeStr = e?.timeStart ? `${e.timeStart}${e.timeEnd ? '–'+e.timeEnd : ''}` : null
  const fromStr = (e?.startDate ?? e?.dateStart)
    ? new Date((e?.startDate ?? e?.dateStart)! + 'T00:00:00').toLocaleDateString('vi-VN') : null
  const courseUrl = e
    ? getCourseUrl({ id: e.itemId, seoUrl: e.seoUrl, title: e.itemTitle })
    : a ? getCourseUrl({ id: a.itemId, seoUrl: a.seoUrl, title: a.itemTitle }) : '#'

  return (
    <>
      {/* Backdrop */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 1999 }} onClick={onClose} />
      {/* Popup */}
      <div style={{
        position: 'fixed', zIndex: 2000, width: PW,
        left, ...(below ? { top } : { bottom: window.innerHeight - top }),
        background: '#fff', borderRadius: 14, padding: 18,
        boxShadow: '0 12px 40px rgba(0,0,0,0.22)',
        transformOrigin: below ? 'top center' : 'bottom center',
      }}>
        {/* Triangle arrow */}
        <div style={{
          position: 'absolute', left: arrowOff, width: 0, height: 0,
          ...(below ? {
            top: -8,
            borderLeft: '9px solid transparent', borderRight: '9px solid transparent',
            borderBottom: '9px solid #fff',
          } : {
            bottom: -8,
            borderLeft: '9px solid transparent', borderRight: '9px solid transparent',
            borderTop: '9px solid #fff',
          }),
          filter: 'drop-shadow(0 -2px 2px rgba(0,0,0,0.08))',
        }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            {sel.kind === 'activity' && (
              <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: ACT_COLOR, borderRadius: 20, padding: '2px 8px', marginBottom: 5, display: 'inline-block' }}>
                {ACT_LABEL[a!.type] ?? a!.type}
              </span>
            )}
            <div style={{ fontWeight: 800, fontSize: 15, color: '#111827', lineHeight: 1.3 }}>
              {e?.itemTitle ?? a?.itemTitle}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9ca3af', padding: 0, marginLeft: 10, flexShrink: 0 }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 13 }}>
          {e && <>
            {(!e.scheduleType || e.scheduleType === '') && e.startDate && (
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ color: '#6b7280', width: 70, flexShrink: 0 }}>Hiệu lực</span>
                <span style={{ color: '#111827', fontWeight: 500 }}>
                  {new Date(e.startDate+'T00:00:00').toLocaleDateString('vi-VN')}
                  {e.endDate ? ` → ${new Date(e.endDate+'T00:00:00').toLocaleDateString('vi-VN')}` : ''}
                </span>
              </div>
            )}
            {(weekdayStr || timeStr) && (
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ color: '#6b7280', width: 70, flexShrink: 0 }}>Lịch học</span>
                <span style={{ color: '#111827', fontWeight: 500 }}>{[weekdayStr, timeStr].filter(Boolean).join(' · ')}</span>
              </div>
            )}
            {e.scheduleType && e.scheduleType !== '' && fromStr && (
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ color: '#6b7280', width: 70, flexShrink: 0 }}>Từ ngày</span>
                <span style={{ color: '#111827' }}>{fromStr}{e.dateEnd ? ` → ${new Date(e.dateEnd+'T00:00:00').toLocaleDateString('vi-VN')}` : ''}</span>
              </div>
            )}
            {e.scheduleTitle && (
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ color: '#6b7280', width: 70, flexShrink: 0 }}>Ca học</span>
                <span style={{ color: '#111827' }}>{e.scheduleTitle}</span>
              </div>
            )}
            {e.locationNote && (
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ color: '#6b7280', width: 70, flexShrink: 0 }}>Địa điểm</span>
                <span style={{ color: '#111827' }}>{e.locationNote}</span>
              </div>
            )}
          </>}
          {a && <>
            {a.date && <div style={{ display: 'flex', gap: 6 }}><span style={{ color: '#6b7280', width: 70, flexShrink: 0 }}>Ngày</span><span style={{ color: '#111827' }}>{a.date}</span></div>}
            {a.note && <div style={{ display: 'flex', gap: 6 }}><span style={{ color: '#6b7280', width: 70, flexShrink: 0 }}>Ghi chú</span><span style={{ color: '#111827' }}>{a.note}</span></div>}
          </>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
          {a ? (
            confirming ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>Xác nhận hủy?</span>
                <button onClick={() => { setCancelling(true); onCancelActivity(a.id) }} disabled={cancelling}
                  style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: '#e73348', border: 'none', padding: '3px 10px', borderRadius: 20, cursor: 'pointer' }}>
                  {cancelling ? '...' : 'Hủy'}
                </button>
                <button onClick={() => setConfirming(false)}
                  style={{ fontSize: 12, color: '#6b7280', background: 'none', border: '1px solid #e5e7eb', padding: '3px 10px', borderRadius: 20, cursor: 'pointer' }}>Thôi</button>
              </div>
            ) : (
              <button onClick={() => setConfirming(true)}
                style={{ fontSize: 12, color: '#e73348', background: 'none', border: '1px solid #fca5a5', padding: '3px 10px', borderRadius: 20, cursor: 'pointer' }}>
                Hủy đăng ký
              </button>
            )
          ) : <div />}
          <Link href={courseUrl} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 13, fontWeight: 700, color: '#00539b', textDecoration: 'none' }}>
            Xem khóa học →
          </Link>
        </div>
      </div>
    </>
  )
}

// ── Chips ────────────────────────────────────────────────────────────────────

function Chip({ label, bg, onClick, size = 'sm', wrap = false }: { label: string; bg: string; onClick: (e: React.MouseEvent) => void; size?: 'sm'|'xs'; wrap?: boolean }) {
  const fs = size === 'xs' ? 10 : 11
  return (
    <button onClick={onClick} style={{
      display: 'block', width: '100%', textAlign: 'left', background: bg, color: '#fff',
      borderRadius: 4, padding: '2px 6px', fontSize: fs, fontWeight: 600,
      whiteSpace: wrap ? 'normal' : 'nowrap',
      overflow: wrap ? 'visible' : 'hidden',
      textOverflow: wrap ? 'unset' : 'ellipsis',
      border: 'none', cursor: 'pointer', lineHeight: '1.4',
    }}>{label}</button>
  )
}

// ── Month view ───────────────────────────────────────────────────────────────

function MonthView({ enrollments, activities, year, month, today, onSelect }: {
  enrollments: Enrollment[]; activities: Activity[]; year: number; month: number; today: string
  onSelect: (ev: SelectedEvent, e: React.MouseEvent) => void
}) {
  const firstDow = new Date(year, month, 1).getDay()
  const offset = firstDow === 0 ? 6 : firstDow - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 1 }}>
        {['T2','T3','T4','T5','T6','T7','CN'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#9ca3af', padding: '4px 0', borderBottom: '1px solid #e5e7eb' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 1, background: '#e5e7eb', border: '1px solid #e5e7eb', borderTop: 'none' }}>
        {Array.from({ length: totalCells }, (_, i) => {
          const dayNum = i - offset + 1
          if (dayNum < 1 || dayNum > daysInMonth) return <div key={i} style={{ background: '#f9fafb', minHeight: 80 }} />
          const iso = toISO(new Date(year, month, dayNum))
          const cls = classesForDate(enrollments, iso)
          const acts = activitiesForDate(activities, iso)
          const isToday = iso === today
          const total = cls.length + acts.length
          return (
            <div key={iso} style={{ background: '#fff', minHeight: 80, padding: '4px 3px 3px' }}>
              <div style={{ fontSize: 12, fontWeight: isToday ? 800 : 400, color: isToday ? '#fff' : '#374151',
                background: isToday ? '#0078d4' : 'transparent', width: 22, height: 22, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 2 }}>{dayNum}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {cls.slice(0, total <= 2 ? 2 : 1).map(e => (
                  <Chip key={e.id} label={(e.timeStart ? e.timeStart+' ' : '') + e.itemTitle} bg={color(e.id)} size="xs"
                    onClick={ev => onSelect({ kind: 'enrollment', data: e }, ev)} />
                ))}
                {acts.slice(0, total <= 2 ? 1 : 0).map(a => (
                  <Chip key={`a${a.id}`} label={`${ACT_LABEL[a.type]??a.type} · ${a.itemTitle}`} bg={ACT_COLOR} size="xs"
                    onClick={ev => onSelect({ kind: 'activity', data: a }, ev)} />
                ))}
                {total > 2 && <span style={{ fontSize: 10, color: '#6b7280', paddingLeft: 3 }}>+{total - 2} nữa</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Week view ────────────────────────────────────────────────────────────────

function WeekView({ enrollments, activities, weekStart, today, onSelect }: {
  enrollments: Enrollment[]; activities: Activity[]; weekStart: Date; today: string
  onSelect: (ev: SelectedEvent, e: React.MouseEvent) => void
}) {
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d })
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 1, background: '#e5e7eb', border: '1px solid #e5e7eb' }}>
      {days.map(d => {
        const iso = toISO(d); const cls = classesForDate(enrollments, iso); const acts = activitiesForDate(activities, iso)
        const isToday = iso === today
        return (
          <div key={iso} style={{ background: '#fff', display: 'flex', flexDirection: 'column', minHeight: 300 }}>
            <div style={{ padding: '6px 6px 4px', borderBottom: '1px solid #e5e7eb', background: isToday ? '#eff6ff' : '#fafafa', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>{VN_SHORT[d.getDay()]}</div>
              <div style={{ fontSize: 16, fontWeight: isToday ? 800 : 600, color: isToday ? '#0078d4' : '#374151' }}>{d.getDate()}</div>
            </div>
            <div style={{ padding: '4px 3px', display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
              {cls.map(e => (
                <Chip key={e.id} label={(e.timeStart ? e.timeStart+' ' : '') + e.itemTitle} bg={color(e.id)} wrap
                  onClick={ev => onSelect({ kind: 'enrollment', data: e }, ev)} />
              ))}
              {acts.map(a => (
                <Chip key={`a${a.id}`} label={`${ACT_LABEL[a.type]??a.type} · ${a.itemTitle}`} bg={ACT_COLOR} wrap
                  onClick={ev => onSelect({ kind: 'activity', data: a }, ev)} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── List view ────────────────────────────────────────────────────────────────

function ListView({ enrollments, activities, from, to, onSelect }: {
  enrollments: Enrollment[]; activities: Activity[]; from: string; to: string
  onSelect: (ev: SelectedEvent, e: React.MouseEvent) => void
}) {
  const items = useMemo(() => {
    const map = new Map<string, { classes: Enrollment[]; acts: Activity[] }>()
    // Build date range
    const start = new Date(from + 'T00:00:00'), end = new Date(to + 'T00:00:00')
    for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const iso = toISO(d)
      const cls = classesForDate(enrollments, iso)
      const acts = activitiesForDate(activities, iso)
      if (cls.length || acts.length) map.set(iso, { classes: cls, acts })
    }
    return [...map.entries()].sort().map(([iso, v]) => ({ iso, ...v }))
  }, [enrollments, activities, from, to])

  if (!items.length) return (
    <div style={{ padding: '40px 0', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Không có hoạt động nào trong kỳ này.</div>
  )
  return (
    <div>
      {items.map(({ iso, classes, acts }) => {
        const d = new Date(iso + 'T00:00:00')
        const label = d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'long' })
        return (
          <div key={iso} style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: 4 }}>
            <div style={{ padding: '10px 0 6px', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'capitalize' }}>
              {label.charAt(0).toUpperCase() + label.slice(1)}
            </div>
            {classes.map((e: Enrollment) => (
              <button key={e.id} onClick={ev => onSelect({ kind: 'enrollment', data: e }, ev)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0 6px 4px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: color(e.id), flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#111827' }}>{e.itemTitle}</span>
                {(e.timeStart || e.timeEnd) && <span style={{ fontSize: 12, color: '#9ca3af' }}>{e.timeStart}{e.timeEnd?`–${e.timeEnd}`:''}</span>}
              </button>
            ))}
            {acts.map((a: Activity) => (
              <button key={`a${a.id}`} onClick={ev => onSelect({ kind: 'activity', data: a }, ev)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0 6px 4px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: ACT_COLOR, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: ACT_COLOR, flexShrink: 0 }}>{ACT_LABEL[a.type]??a.type}</span>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: '#111827' }}>{a.itemTitle}</span>
              </button>
            ))}
          </div>
        )
      })}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const { user } = useAuth()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('month')
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [curDate, setCurDate] = useState(new Date())
  const [selected, setSelected] = useState<AnchoredEvent | null>(null)

  function select(ev: SelectedEvent, e: React.MouseEvent) {
    setSelected({ sel: ev, x: e.clientX, y: e.clientY })
  }
  const today = toISO(new Date())

  useEffect(() => {
    if (!user) { setLoading(false); return } // eslint-disable-line
    fetch(`${API}/user/schedule`, { headers: { Authorization: `Bearer ${user.jwtToken}` } })
      .then(r => r.json())
      .then(json => {
        const d = json.data ?? {}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setEnrollments((d.enrollments ?? []).map((e: any) => norm(e)))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setActivities((d.activities ?? []).map((a: any) => normAct(a)))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const pending = enrollments.filter(e => e.status === 'pending')

  // Today + tomorrow events
  const tomorrow = toISO(new Date(new Date().setDate(new Date().getDate() + 1)))
  const todayEvents = [...classesForDate(enrollments, today), ...activitiesForDate(activities, today)]
  const tomorrowEvents = [...classesForDate(enrollments, tomorrow), ...activitiesForDate(activities, tomorrow)]

  // set-start-date state
  const [startDateInputs, setStartDateInputs] = useState<Record<number, string>>({})
  const [savingStart, setSavingStart] = useState<number | null>(null)

  async function handleSetStartDate(enrollmentId: number) {
    const date = startDateInputs[enrollmentId]
    if (!date || !user) return
    setSavingStart(enrollmentId)
    const res = await fetch(`${API}/user/enrollments/${enrollmentId}/start-date`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.jwtToken}` },
      body: JSON.stringify({ startDate: date }),
    })
    if (res.ok) {
      setEnrollments(prev => prev.map(e => e.id === enrollmentId
        ? { ...e, status: 'active', startDate: date } : e))
    }
    setSavingStart(null)
  }

  function navigate(dir: -1 | 1) {
    setCurDate(d => {
      const n = new Date(d)
      if (period === 'week') n.setDate(d.getDate() + dir * 7)
      else n.setMonth(d.getMonth() + dir)
      return n
    })
  }

  async function handleCancelActivity(id: number) {
    const act = activities.find(a => a.id === id)
    if (!act || !user) return
    await fetch(`${API}/item/${act.itemId}/my-activities/${id}/cancel`, {
      method: 'PUT', headers: { Authorization: `Bearer ${user.jwtToken}` },
    })
    setActivities(prev => prev.map(a => a.id === id ? { ...a, status: -1 } : a))
    setSelected(null)
  }

  const { from, to } = period === 'week' ? weekRange(curDate) : monthRange(curDate)
  const weekStart = getMondayOfWeek(curDate)

  // Navigator label
  const navLabel = period === 'month'
    ? new Date(curDate.getFullYear(), curDate.getMonth(), 1).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())
    : `${new Date(from + 'T00:00:00').toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} – ${new Date(to + 'T00:00:00').toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`

  return (
    <div className="bg-white border border-line rounded-card overflow-hidden">
      {/* Header */}
      <div className="border-b border-line px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
        <h2 className="m-0 text-lg font-black text-ink">Lịch học</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Period toggle */}
          <div style={{ display: 'flex', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
            {(['month', 'week'] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
                background: period === p ? '#1e2047' : '#fff', color: period === p ? '#fff' : '#6b7280',
                borderRight: p === 'month' ? '1px solid #e5e7eb' : 'none',
              }}>{p === 'month' ? 'Tháng' : 'Tuần'}</button>
            ))}
          </div>
          {/* Navigator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 6, padding: '3px 9px', cursor: 'pointer', fontSize: 15 }}>‹</button>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', minWidth: 160, textAlign: 'center' }}>{navLabel}</span>
            <button onClick={() => navigate(1)} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 6, padding: '3px 9px', cursor: 'pointer', fontSize: 15 }}>›</button>
          </div>
          {/* ViewMode icons */}
          <div style={{ display: 'flex', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
            {([['calendar','📅'],['list','☰']] as [ViewMode, string][]).map(([v, icon]) => (
              <button key={v} onClick={() => setViewMode(v)} style={{
                padding: '5px 10px', fontSize: 14, cursor: 'pointer', border: 'none',
                background: viewMode === v ? '#0078d4' : '#fff', color: viewMode === v ? '#fff' : '#6b7280',
                borderRight: v === 'calendar' ? '1px solid #e5e7eb' : 'none',
              }}>{icon}</button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-5 text-muted text-sm">Đang tải...</div>
      ) : (
        <div className="p-4 flex flex-col gap-4">

          {/* Pending — choose start date for open-type */}
          {pending.length > 0 && (
            <div style={{ background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Cần xử lý</div>
              {pending.map(e => (
                <div key={e.id} style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 4 }}>
                    <span>⚠️</span>
                    <span><strong>{e.itemTitle}</strong> — Chọn ngày khai giảng</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 24 }}>
                    <input type="date" value={startDateInputs[e.id] ?? ''}
                      onChange={ev => setStartDateInputs(p => ({ ...p, [e.id]: ev.target.value }))}
                      style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '4px 8px', fontSize: 12 }} />
                    <button onClick={() => handleSetStartDate(e.id)} disabled={!startDateInputs[e.id] || savingStart === e.id}
                      style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: '#00539b', border: 'none', padding: '4px 12px', borderRadius: 20, cursor: 'pointer', opacity: !startDateInputs[e.id] ? 0.5 : 1 }}>
                      {savingStart === e.id ? '...' : 'Xác nhận'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sắp diễn ra (today + tomorrow) */}
          {(todayEvents.length > 0 || tomorrowEvents.length > 0) && (
            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                Sắp diễn ra
              </div>
              {todayEvents.length > 0 && (
                <div style={{ marginBottom: tomorrowEvents.length > 0 ? 6 : 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#0369a1', marginBottom: 3 }}>Hôm nay</div>
                  {todayEvents.map((ev, i) => {
                    const isEnrollment = 'scheduleType' in ev
                    return (
                      <button key={i} onClick={e => select(isEnrollment ? { kind: 'enrollment', data: ev as Enrollment } : { kind: 'activity', data: ev as Activity }, e)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', textAlign: 'left' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: isEnrollment ? color((ev as Enrollment).id) : ACT_COLOR, flexShrink: 0 }} />
                        {!isEnrollment && <span style={{ fontSize: 11, color: ACT_COLOR, fontWeight: 700 }}>{ACT_LABEL[(ev as Activity).type]}</span>}
                        <span style={{ color: '#111827', fontWeight: 500 }}>{isEnrollment ? (ev as Enrollment).itemTitle : (ev as Activity).itemTitle}</span>
                        {isEnrollment && (ev as Enrollment).timeStart && <span style={{ fontSize: 11, color: '#6b7280' }}>{(ev as Enrollment).timeStart}</span>}
                      </button>
                    )
                  })}
                </div>
              )}
              {tomorrowEvents.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#0369a1', marginBottom: 3 }}>Ngày mai</div>
                  {tomorrowEvents.map((ev, i) => {
                    const isEnrollment = 'scheduleType' in ev
                    return (
                      <button key={i} onClick={e => select(isEnrollment ? { kind: 'enrollment', data: ev as Enrollment } : { kind: 'activity', data: ev as Activity }, e)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', textAlign: 'left' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: isEnrollment ? color((ev as Enrollment).id) : ACT_COLOR, flexShrink: 0 }} />
                        {!isEnrollment && <span style={{ fontSize: 11, color: ACT_COLOR, fontWeight: 700 }}>{ACT_LABEL[(ev as Activity).type]}</span>}
                        <span style={{ color: '#111827', fontWeight: 500 }}>{isEnrollment ? (ev as Enrollment).itemTitle : (ev as Activity).itemTitle}</span>
                        {isEnrollment && (ev as Enrollment).timeStart && <span style={{ fontSize: 11, color: '#6b7280' }}>{(ev as Enrollment).timeStart}</span>}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Calendar/List */}
          {enrollments.filter(e => e.status === 'active').length === 0 && !pending.length && activities.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Bạn chưa có lịch học nào.</div>
          ) : viewMode === 'calendar' ? (
            period === 'month'
              ? <MonthView enrollments={enrollments} activities={activities} year={curDate.getFullYear()} month={curDate.getMonth()} today={today} onSelect={select} />
              : <WeekView enrollments={enrollments} activities={activities} weekStart={weekStart} today={today} onSelect={select} />
          ) : (
            <ListView enrollments={enrollments} activities={activities} from={from} to={to} onSelect={select} />
          )}

        </div>
      )}

      {/* Anchored popup */}
      {selected && (
        <EventPopup anchored={selected} onClose={() => setSelected(null)} onCancelActivity={handleCancelActivity} />
      )}
    </div>
  )
}
