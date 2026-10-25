'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { API_BASE } from '@/lib/apiBase'
import { CheckIcon, CloseIcon } from '@/components/icons'

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

  // Fetch my activities on mount
  useEffect(() => {
    if (!hasAny) return
    if (!user) { setChecked(true); return }
    fetch(`${API_BASE}/item/${itemId}/my-activities`, {
      headers: { Authorization: `Bearer ${user.jwtToken}` },
    })
      .then(r => r.json())
      .then(json => { setMyActivities(json.data ?? []); setChecked(true) })
      .catch(() => setChecked(true))
  }, [itemId, user, hasAny])

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
      await fetch(`${API_BASE}/item/${itemId}/register-activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.jwtToken}` },
        body: JSON.stringify({ activities }),
      })
      // Refresh my activities
      const res = await fetch(`${API_BASE}/item/${itemId}/my-activities`, {
        headers: { Authorization: `Bearer ${user.jwtToken}` },
      })
      const json = await res.json()
      setMyActivities(json.data ?? [])
      setDone(true)
      setTimeout(() => { setOpen(false); setDone(false) }, 1500)
    } catch { /* silent */ }
    setSaving(false)
  }

  if (!hasAny || !checked) return null

  return (
    <>
      {isRegisteredActive ? (
        // Already registered — show status
        <div className="mt-2 rounded-xl border border-green-line bg-green-soft px-4 py-3 text-sm">
          <div className="text-xs font-bold text-muted mb-1">Đã đăng ký trải nghiệm</div>
          {myActivities.filter(a => !a.date || a.date >= today).map(a => (
            <div key={a.id} className="flex items-center gap-1 text-green-dark">
              <CheckIcon className="size-4 text-green" />
              <span className="font-medium">{TYPE_LABEL[a.type] ?? a.type}</span>
              {a.date && <span className="text-muted font-normal">· ngày {a.date}</span>}
            </div>
          ))}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="mt-2 min-h-11 w-full cursor-pointer rounded-xl border-2 border-green bg-transparent py-3 text-sm font-bold text-green transition-colors hover:bg-green-soft"
        >
          Đăng ký trải nghiệm
        </button>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-ink/45 p-4">
          <div className="w-full max-w-[400px] rounded-[18px] bg-white p-6 shadow-raised">
            <div className="flex items-center justify-between mb-4">
              <h3 className="m-0 text-base font-extrabold text-ink">Đăng ký trải nghiệm</h3>
              <button type="button" aria-label="Đóng" onClick={() => setOpen(false)} className="-mr-2 grid size-11 cursor-pointer place-items-center border-0 bg-transparent text-muted hover:text-ink">
                <CloseIcon />
              </button>
            </div>

            {done ? (
              <div className="flex items-center justify-center gap-2 py-6 font-bold text-green-dark"><CheckIcon className="size-5" />Đăng ký thành công!</div>
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
                  className={`btn btn--green mt-2 w-full ${(!selTrial && !selTest && !selVisit) ? 'opacity-50' : ''}`}>
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
    <div className={`rounded-xl border p-3 transition-colors ${checked ? 'border-green bg-green-soft' : 'border-line'}`}>
      <label className="mb-2 flex min-h-11 cursor-pointer items-center gap-2">
        <input type="checkbox" checked={checked} onChange={e => onCheck(e.target.checked)} className="accent-green w-4 h-4" />
        <span className={`text-sm font-bold ${checked ? 'text-green-dark' : 'text-ink'}`}>{label}</span>
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
