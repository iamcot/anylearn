'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getMyFoundation, setFoundationHideName, type FoundationMine } from '@/lib/api/gamification'
import AccountCard from '@/components/account/AccountCard'
import { houseOrdinal } from '@/lib/foundation/rules'
import { BrickIcon } from './icons'

// "Gạch của tôi" on /account: what the person gave the Foundation through their orders and rewards, and the
// switch that shows them as "Một phụ huynh" in the public list.
export default function MyBricksCard() {
  const { token } = useAuth()
  const [mine, setMine] = useState<FoundationMine | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (token) getMyFoundation(token).then(setMine) }, [token])
  if (!mine) return null

  const toggle = async () => {
    if (!token) return
    setSaving(true)
    const hide = !mine.hideName
    const error = await setFoundationHideName(token, hide)
    setSaving(false)
    if (!error) setMine({ ...mine, hideName: hide })
  }

  return (
    <AccountCard title="Gạch của tôi" subtitle="anyLEARN Foundation: xây nhà vệ sinh cho trường vùng cao"
      action={<Link href="/foundation" className="text-xs font-bold text-blue no-underline">Xem chương trình</Link>}>
      <div className="flex items-center gap-4 px-5 py-4">
        <BrickIcon className="size-9 shrink-0" />
        <div className="min-w-0 flex-1">
          {mine.total > 0 ? (
            <>
              <div className="text-lg font-extrabold text-ink">{mine.bricks.toLocaleString('vi-VN')} viên gạch</div>
              <div className="text-xs text-muted">Góp {mine.times} lần{mine.houses.length > 0 ? ` · cho ${mine.houses.map(houseOrdinal).join(', ')}` : ''}</div>
            </>
          ) : (
            <div className="text-sm text-muted">Đăng ký khóa học đầu tiên để góp viên gạch đầu tiên (đơn đầu góp gấp đôi).</div>
          )}
        </div>
      </div>
      <label className="flex min-h-11 cursor-pointer items-center gap-2.5 border-t border-line px-5 py-2.5 text-sm">
        <input type="checkbox" checked={mine.hideName} disabled={saving} onChange={toggle} className="size-4 accent-green" />
        Ẩn tên tôi trong danh sách đóng góp (hiện là &quot;Một phụ huynh&quot;)
      </label>
    </AccountCard>
  )
}
