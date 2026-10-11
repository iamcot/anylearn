'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/v2/api'

const TYPE_LABEL: Record<string, string> = {
  trial: 'Học thử', test: 'Test đầu vào', visit: 'Tham quan',
}

interface ActivityReg {
  id: number; type: string; date?: string; note?: string; status: number
}

interface Props {
  itemId: number
  activiyTrial?: number
  activiyTest?: number
  activiyVisit?: number
}

export default function ActivityButton({ itemId, activiyTrial, activiyTest, activiyVisit }: Props) {
  const { user } = useAuth()
  const [myActivities, setMyActivities] = useState<ActivityReg[]>([])
  const [checked, setChecked] = useState(false)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  // Form state
  const [selTrial, setSelTrial] = useState(false)
  const [selTest, setSelTest] = useState(false)
  const [selVisit, setSelVisit] = useState(false)
  const [dateTrial, setDateTrial] = useState('')
  const [dateTest, setDateTest] = useState('')
  const [dateVisit, setDateVisit] = useState('')
  const [noteTrial, setNoteTrial] = useState('')
  const [noteTest, setNoteTest] = useState('')
  const [noteVisit, setNoteVisit] = useState('')

  const hasAny = activiyTrial === 1 || activiyTest === 1 || activiyVisit === 1
  if (!hasAny) return null

  // Fetch my activities on mount
  useEffect(() => {
    if (!user) { setChecked(true); return }
    fetch(`${API}/item/${itemId}/my-activities`, {
      headers: { Authorization: `Bearer ${user.jwtToken}` },
    })
      .then(r => r.json())
      .then(json => { setMyActivities(json.data ?? []); setChecked(true) })
      .catch(() => setChecked(true))
  }, [itemId, user]) // eslint-disable-line react-hooks/exhaustive-deps

  // Determine if already registered with future date
  const today = new Date().toISOString().slice(0, 10)
  const maxDate = myActivities.reduce((max, a) => a.date && a.date > max ? a.date : max, '')
  const isRegisteredActive = myActivities.length > 0 && maxDate >= today

  async function handleSave() {
    if (!user) return
    const activities = [
      selTrial && activiyTrial === 1 && { type: 'trial', date: dateTrial || undefined, note: noteTrial || undefined },
      selTest  && activiyTest  === 1 && { type: 'test',  date: dateTest  || undefined, note: noteTest  || undefined },
      selVisit && activiyVisit === 1 && { type: 'visit', date: dateVisit || undefined, note: noteVisit || undefined },
    ].filter(Boolean)
    if (!activities.length) return
    setSaving(true)
    try {
      await fetch(`${API}/item/${itemId}/register-activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.jwtToken}` },
        body: JSON.stringify({ activities }),
      })
      // Refresh my activities
      const res = await fetch(`${API}/item/${itemId}/my-activities`, {
        headers: { Authorization: `Bearer ${user.jwtToken}` },
      })
      const json = await res.json()
      setMyActivities(json.data ?? [])
      setDone(true)
      setTimeout(() => { setOpen(false); setDone(false) }, 1500)
    } catch { /* silent */ }
    setSaving(false)
  }

  if (!checked) return null

  return (
    <>
      {isRegisteredActive ? (
        // Already registered — show status
        <div className="mt-2 rounded-[10px] border border-[#c3f0d8] bg-[#f0fff8] px-4 py-3 text-sm">
          <div className="text-xs font-bold text-muted mb-1">Đã đăng ký trải nghiệm</div>
          {myActivities.filter(a => !a.date || a.date >= today).map(a => (
            <div key={a.id} className="text-[#008244] flex items-center gap-1">
              <span style={{ color: '#00a651', fontWeight: 900 }}>✓</span>
              <span className="font-medium">{TYPE_LABEL[a.type] ?? a.type}</span>
              {a.date && <span className="text-muted font-normal">· ngày {a.date}</span>}
            </div>
          ))}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="mt-2 w-full py-3 rounded-[12px] border-2 border-[#00a651] text-[#00a651] bg-transparent font-bold text-sm cursor-pointer hover:bg-[#f0fff8] transition-colors"
        >
          Đăng ký trải nghiệm
        </button>
      )}

      {/* Modal */}
      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="bg-white rounded-[18px] p-6 w-full max-w-[400px] shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="m-0 text-base font-black text-ink">Đăng ký trải nghiệm</h3>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9ca3af' }}>×</button>
            </div>

            {done ? (
              <div className="text-center py-6 text-[#008244] font-bold">✓ Đăng ký thành công!</div>
            ) : (
              <div className="flex flex-col gap-4">
                {activiyTrial === 1 && (
                  <ActivityRow label="Học thử" checked={selTrial} onCheck={setSelTrial}
                    date={dateTrial} onDate={setDateTrial} note={noteTrial} onNote={setNoteTrial} />
                )}
                {activiyTest === 1 && (
                  <ActivityRow label="Test đầu vào" checked={selTest} onCheck={setSelTest}
                    date={dateTest} onDate={setDateTest} note={noteTest} onNote={setNoteTest} />
                )}
                {activiyVisit === 1 && (
                  <ActivityRow label="Tham quan" checked={selVisit} onCheck={setSelVisit}
                    date={dateVisit} onDate={setDateVisit} note={noteVisit} onNote={setNoteVisit} />
                )}
                <button onClick={handleSave} disabled={saving || (!selTrial && !selTest && !selVisit)}
                  className="btn btn--green w-full mt-2" style={{ opacity: (!selTrial && !selTest && !selVisit) ? 0.5 : 1 }}>
                  {saving ? 'Đang gửi...' : 'Gửi đăng ký'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function ActivityRow({ label, checked, onCheck, date, onDate, note, onNote }: {
  label: string; checked: boolean; onCheck: (v: boolean) => void
  date: string; onDate: (v: string) => void; note: string; onNote: (v: string) => void
}) {
  return (
    <div className={`rounded-[10px] border p-3 transition-colors ${checked ? 'border-[#00a651] bg-[#f0fff8]' : 'border-line'}`}>
      <label className="flex items-center gap-2 cursor-pointer mb-2">
        <input type="checkbox" checked={checked} onChange={e => onCheck(e.target.checked)} className="accent-green w-4 h-4" />
        <span className={`font-bold text-sm ${checked ? 'text-[#008244]' : 'text-ink'}`}>{label}</span>
      </label>
      {checked && (
        <div className="flex flex-col gap-2 pl-6">
          <input type="date" value={date} onChange={e => onDate(e.target.value)}
            className="field text-sm" placeholder="Ngày mong muốn" />
          <input type="text" value={note} onChange={e => onNote(e.target.value)}
            className="field text-sm" placeholder="Ghi chú (tuỳ chọn)" />
        </div>
      )}
    </div>
  )
}
