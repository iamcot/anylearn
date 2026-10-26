'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getNotificationPrefs, setNotificationPref, type NotificationPrefs } from '@/lib/api'
import { useToast } from '@/components/ToastProvider'
import { NOTIFICATION_CHANNELS, NOTIFICATION_TOPICS } from '@/config/notificationTopics'

// One switch per topic and channel. Order confirmations, replies to your reviews and messages about your account are always sent.
export default function NotificationPrefsForm() {
  const { token } = useAuth()
  const toast = useToast()
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null)

  useEffect(() => {
    if (!token) return
    getNotificationPrefs(token).then(setPrefs)
  }, [token])

  if (!prefs) return null

  const toggle = async (topic: string, channel: string) => {
    if (!token) return
    const next = !(prefs[topic]?.[channel] ?? true)
    setPrefs({ ...prefs, [topic]: { ...prefs[topic], [channel]: next } })
    const { data, error } = await setNotificationPref(topic, channel, next, token)
    if (error || !data) {
      toast({ kind: 'error', text: error || 'Chưa lưu được, vui lòng thử lại' })
      setPrefs(prefs)
      return
    }
    setPrefs(data)
  }

  return (
    <div className="mt-6 border-t border-line pt-5">
      <h3 className="m-0 text-base font-extrabold text-ink">Bạn muốn nhận gì?</h3>
      <p className="m-0 mt-1 text-xs text-muted">Xác nhận đơn hàng, thanh toán thành công và tin về tài khoản luôn được gửi.</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="py-2 pr-2 font-bold">Loại thông báo</th>
              {NOTIFICATION_CHANNELS.map(channel => <th key={channel.key} className="px-2 py-2 text-center font-bold">{channel.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {NOTIFICATION_TOPICS.map(topic => (
              <tr key={topic.key} className="border-t border-line">
                <td className="py-3 pr-2">
                  <div className="font-bold text-ink">{topic.label}</div>
                  <div className="text-xs text-muted">{topic.hint}</div>
                </td>
                {NOTIFICATION_CHANNELS.map(channel => {
                  const on = prefs[topic.key]?.[channel.key] ?? true
                  return (
                    <td key={channel.key} className="px-2 py-3 text-center">
                      <button type="button" role="switch" aria-checked={on} aria-label={`${topic.label} qua ${channel.label}`}
                        onClick={() => toggle(topic.key, channel.key)}
                        className={`relative h-7 w-12 cursor-pointer rounded-full border-0 transition-colors ${on ? 'bg-green' : 'bg-line'}`}>
                        <span className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
