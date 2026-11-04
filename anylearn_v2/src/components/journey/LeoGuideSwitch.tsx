'use client'

import { useSyncExternalStore } from 'react'
import { guideOff, readGuideOff, setGuideOff } from '@/lib/journey/store'

const subscribeNever = () => () => {}

// "Tắt Leo hướng dẫn" (Tài khoản > Thông báo): kept on this device.
export default function LeoGuideSwitch() {
  const stored = useSyncExternalStore(subscribeNever, readGuideOff, () => false)
  const live = useSyncExternalStore(guideOff.subscribe, guideOff.get, () => false)
  const off = live || stored
  return (
    <label className="mt-5 flex min-h-11 cursor-pointer items-center gap-2.5 border-t border-line pt-4 text-sm text-ink">
      <input type="checkbox" checked={off} onChange={e => setGuideOff(e.target.checked)} className="size-4 accent-green" />
      <span>Tắt Leo hướng dẫn <span className="text-muted">(Leo nhỏ ở góc màn hình, trên thiết bị này)</span></span>
    </label>
  )
}
