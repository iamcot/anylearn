'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getChildren, getMyProfile } from '@/lib/api'
import { learnerChips, type LearnerChip } from '@/lib/search/learners'
import { GUEST_CHIP_OFF, GUEST_CHIP_ON } from '@/components/guest/chipStyles'

// The people an account can look for courses for. Empty until loaded, and for a visitor without an account.
export function useLearnerChips(): LearnerChip[] {
  const { token } = useAuth()
  const [loaded, setLoaded] = useState<{ token: string; chips: LearnerChip[] } | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    Promise.all([getChildren(token), getMyProfile(token)]).then(([children, profile]) => {
      if (!cancelled) setLoaded({ token, chips: learnerChips(children, profile) })
    })
    return () => { cancelled = true }
  }, [token])

  return loaded && loaded.token === token ? loaded.chips : []
}

interface Props {
  chips: LearnerChip[]
  activeKey?: string
  onPick: (chip: LearnerChip | null) => void
}

// "Tất cả | Bin 15t | Su 9t | Tôi": every list is narrowed to the age of the one picked (plan 04.1).
export default function LearnerChips({ chips, activeKey, onPick }: Props) {
  if (chips.length === 0) return null
  return (
    <div className="container flex items-center gap-2 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Tìm cho ai">
      <button type="button" aria-pressed={!activeKey} onClick={() => onPick(null)} className={!activeKey ? GUEST_CHIP_ON : GUEST_CHIP_OFF}>Tất cả</button>
      {chips.map(chip => (
        <button key={chip.key} type="button" aria-pressed={activeKey === chip.key} onClick={() => onPick(chip)} className={activeKey === chip.key ? GUEST_CHIP_ON : GUEST_CHIP_OFF}>
          {chip.label}
        </button>
      ))}
    </div>
  )
}
