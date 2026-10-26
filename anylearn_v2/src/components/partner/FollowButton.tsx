'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getMyPartnerSummary, setFollowing } from '@/lib/api'
import { useToast } from '@/components/ToastProvider'

interface Props {
  partnerId: number
  initialFollowers: number
}

// "Theo dõi": the member is told when this partner opens a new course.
export default function FollowButton({ partnerId, initialFollowers }: Props) {
  const { user, token, openAuthModal } = useAuth()
  const toast = useToast()
  const [state, setState] = useState<{ token: string; following: boolean; followers: number } | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    getMyPartnerSummary(partnerId, token).then(summary => {
      if (!cancelled && summary) setState({ token, following: summary.following, followers: summary.followerCount })
    })
    return () => { cancelled = true }
  }, [partnerId, token])

  const mine = state && state.token === token ? state : null
  const following = mine?.following ?? false
  const followers = mine?.followers ?? initialFollowers

  const toggle = async () => {
    if (!user || !token) { openAuthModal(); return }
    setBusy(true)
    const result = await setFollowing(partnerId, !following, token)
    setBusy(false)
    if (!result) { toast({ kind: 'error', text: 'Chưa thực hiện được, bạn thử lại nhé' }); return }
    setState({ token, following: result.following, followers: result.followerCount })
    toast({ kind: 'success', text: result.following ? 'Đã theo dõi. Bạn sẽ được báo khi có khóa mới' : 'Đã bỏ theo dõi' })
  }

  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={toggle} disabled={busy} aria-pressed={following} className={following ? 'btn btn--outline' : 'btn btn--green'}>
        {following ? 'Đang theo dõi' : 'Theo dõi'}
      </button>
      <span className="text-sm text-muted">{followers} người theo dõi</span>
    </div>
  )
}
