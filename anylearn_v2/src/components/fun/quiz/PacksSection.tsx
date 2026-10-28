'use client'

import { useState } from 'react'
import { saveQuizPack, type QuizMe, type QuizPack } from '@/lib/api/quiz'
import { canSavePack, initialTopics, packIsMulti, packScope, packTitle, remainingText, toggleTopic, topicsToSave } from '@/lib/shop/rules'

/**
 * "Gói tập luyện của tôi": the packs bought in the shop. Tapping a card opens an inline panel to choose the topic(s) by pack type;
 * "Lưu" saves them and makes the pack the one in use (the ready button then says "Tập luyện").
 */
export default function PacksSection({ token, me, onSaved }: { token: string; me: QuizMe; onSaved: (next: QuizMe) => void }) {
  const [openId, setOpenId] = useState<number | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const allKeys = me.topics.map(t => t.key)

  const open = (pack: QuizPack) => {
    setError('')
    if (openId === pack.id) return setOpenId(null)
    setSelected(initialTopics(pack, allKeys))
    setOpenId(pack.id)
  }

  const save = async (pack: QuizPack) => {
    setBusy(true)
    setError('')
    const { data, error: err } = await saveQuizPack(token, pack.id, topicsToSave(pack.type, selected, allKeys))
    setBusy(false)
    if (err || !data) return setError(err ?? 'Không lưu được gói')
    setOpenId(null)
    onSaved(data)
  }

  return (
    <section className="rounded-2xl border border-line bg-white p-4" aria-label="Gói tập luyện của tôi">
      <h2 className="m-0 text-sm font-extrabold">Gói tập luyện của tôi</h2>
      {me.packs.length === 0
        ? <p className="m-0 mt-2 text-sm text-muted">Bạn chưa có gói nào. Gói tập luyện không tốn năng lượng và không tính sao, mua ở cửa hàng bên dưới.</p>
        : (
          <ul className="m-0 mt-2 grid list-none gap-2 p-0">
            {me.packs.map(pack => {
              const active = me.activePackId === pack.id
              const isOpen = openId === pack.id
              return (
                <li key={pack.id} className={`rounded-xl border-2 ${active ? 'border-green bg-green-soft' : 'border-line bg-white'}`}>
                  <button type="button" onClick={() => open(pack)} aria-expanded={isOpen}
                    className="flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-xl border-0 bg-transparent px-3 py-2 text-left text-ink">
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-extrabold">{packTitle(pack)}{active && <span className="ml-1.5 rounded-full bg-green px-2 py-0.5 align-middle text-[11px] font-bold text-white">Đang dùng</span>}</span>
                      <span className="block truncate text-xs text-muted">{packScope(pack)}</span>
                    </span>
                    <span className="shrink-0 text-sm font-black text-green-dark">{remainingText(pack)}</span>
                  </button>
                  {isOpen && (
                    <div className="grid gap-2 border-t border-line px-3 pb-3 pt-2">
                      <div className="text-sm font-bold">{packIsMulti(pack.type) ? 'Chọn các chủ đề (nhiều)' : 'Chọn một chủ đề'}</div>
                      <div className="flex flex-wrap gap-2">
                        {me.topics.map(topic => {
                          const on = selected.includes(topic.key)
                          return (
                            <button key={topic.key} type="button" aria-pressed={on} onClick={() => setSelected(s => toggleTopic(pack.type, s, topic.key))}
                              className={`min-h-10 cursor-pointer rounded-full border px-3 text-sm font-bold ${on ? 'border-green bg-green-soft text-green-dark' : 'border-line bg-white text-ink'}`}>{topic.label}</button>
                          )
                        })}
                      </div>
                      {packIsMulti(pack.type) && (
                        <button type="button" onClick={() => setSelected(allKeys)} className="w-fit cursor-pointer border-0 bg-transparent p-0 text-sm font-bold text-green-dark underline">Chọn tất cả</button>
                      )}
                      {error && <p className="m-0 text-sm text-warn-text" role="alert">{error}</p>}
                      <button type="button" disabled={busy || !canSavePack(pack.type, selected)} onClick={() => save(pack)}
                        className="min-h-11 cursor-pointer rounded-full border-0 bg-green px-5 text-sm font-black text-white disabled:opacity-50">Lưu và dùng gói này</button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
    </section>
  )
}
