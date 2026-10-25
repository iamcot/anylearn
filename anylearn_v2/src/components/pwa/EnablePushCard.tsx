'use client'

import { useState } from 'react'
import { BellIcon, CheckIcon } from '@/components/icons'
import type { PushPrompt } from './usePushPrompt'

type Context = 'today' | 'order'

const COPY: Record<Context, { title: string; body: string }> = {
  today: {
    title: 'Bật nhắc lịch học',
    body: 'Nhận nhắc buổi học, đổi lịch và học phí ngay trên điện thoại, kể cả khi đã đóng anyLEARN.',
  },
  order: {
    title: 'Bật thông báo từ anyLEARN',
    body: 'Nhận xác nhận thanh toán, nhắc lịch khai giảng và lịch học của con ngay trên điện thoại.',
  },
}

export default function EnablePushCard({ context, push }: { context: Context; push: PushPrompt }) {
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const handleEnable = async () => {
    const result = await push.enable()
    if (result === 'enabled') setMessage({ ok: true, text: 'Đã bật thông báo trên thiết bị này.' })
    else if (result === 'denied') setMessage({ ok: false, text: 'Bạn chưa cho phép thông báo. Có thể bật lại trong Tài khoản > Thông báo.' })
    else setMessage({ ok: false, text: 'Chưa bật được thông báo, vui lòng thử lại sau.' })
  }

  if (message) {
    return (
      <section className={`flex items-start gap-3 rounded-card border p-4 text-left text-sm ${message.ok ? 'border-green-line bg-green-soft text-green-dark' : 'border-warn-line bg-warn-soft text-warn-text'}`}>
        {message.ok && <CheckIcon className="size-5 shrink-0" />}
        <p className="m-0">{message.text}</p>
      </section>
    )
  }

  const { title, body } = COPY[context]
  return (
    <section className="rounded-card border border-blue-line bg-blue-soft p-4 text-left">
      <div className="flex items-start gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white text-blue shadow-card">
          <BellIcon className="size-6" />
        </span>
        <div className="flex-1">
          <h2 className="m-0 text-base font-medium text-ink">{title}</h2>
          <p className="m-0 mt-1 text-sm text-muted">{body}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={push.dismiss}
          className="min-h-11 cursor-pointer rounded-full border-0 bg-transparent px-4 text-sm font-medium text-muted"
        >
          Để sau
        </button>
        <button
          type="button"
          onClick={handleEnable}
          disabled={push.busy}
          className="min-h-11 cursor-pointer rounded-full border-0 bg-green px-5 text-sm font-medium text-white disabled:opacity-60"
        >
          {push.busy ? 'Đang bật...' : 'Bật thông báo'}
        </button>
      </div>
    </section>
  )
}
