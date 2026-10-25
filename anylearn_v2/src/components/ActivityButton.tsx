'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { API_BASE } from '@/lib/apiBase'
import { CheckIcon } from '@/components/icons'
import { ACTIVITY_LABELS } from '@/config/itemLabels'
import {
  ACTIVITY_TYPES, EMPTY_SELECTION, buildActivityPayload, hasChosenActivity, type ActivitySelection, type ActivityType,
} from '@/lib/activities'
import ActivityFields from '@/components/ActivityFields'
import Modal from '@/components/Modal'

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

  const [selection, setSelection] = useState<ActivitySelection>(EMPTY_SELECTION)

  const enabled: Record<ActivityType, boolean> = { trial: activiyTrial === 1, test: activiyTest === 1, visit: activiyVisit === 1 }
  const hasAny = ACTIVITY_TYPES.some(type => enabled[type])

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
    const activities = buildActivityPayload(selection, enabled)
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
              <span className="font-medium">{ACTIVITY_LABELS[a.type] ?? a.type}</span>
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

      {open && (
        <Modal title="Đăng ký trải nghiệm" onClose={() => setOpen(false)}>
          {done ? (
            <div className="flex items-center justify-center gap-2 py-6 font-bold text-green-dark"><CheckIcon className="size-5" />Đăng ký thành công!</div>
          ) : (
            <div className="flex flex-col gap-4">
              {ACTIVITY_TYPES.filter(type => enabled[type]).map(type => (
                <ActivityFields key={type} type={type} choice={selection[type]}
                  onChange={choice => setSelection(prev => ({ ...prev, [type]: choice }))} />
              ))}
              <button onClick={handleSave} disabled={saving || !hasChosenActivity(selection, enabled)}
                className={`btn btn--green mt-2 w-full ${hasChosenActivity(selection, enabled) ? '' : 'opacity-50'}`}>
                {saving ? 'Đang gửi...' : 'Gửi đăng ký'}
              </button>
            </div>
          )}
        </Modal>
      )}
    </>
  )
}
