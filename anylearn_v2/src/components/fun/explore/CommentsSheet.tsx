'use client'

import { useCallback, useEffect, useState } from 'react'
import { CloseIcon } from '@/components/icons'
import { addExploreComment, deleteExploreComment, getExploreComments, reportExploreComment, type ExploreComment } from '@/lib/api/explore'

/** Comments of one post as a sheet at the bottom of the viewer: list, write, delete your own, report another's. */
export default function CommentsSheet({ token, postId, enabled, onClose, onCount }: { token: string; postId: number; enabled: boolean; onClose: () => void; onCount: (n: number) => void }) {
  const [items, setItems] = useState<ExploreComment[] | null>(null)
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const { data, error: err } = await getExploreComments(token, postId)
    if (err || !data) return setError(err ?? 'Không tải được bình luận')
    setError('')
    setItems(data)
  }, [token, postId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  async function send() {
    if (busy || !text.trim()) return
    setBusy(true)
    const { data, error: err } = await addExploreComment(token, postId, text)
    setBusy(false)
    if (err || !data) return setError(err ?? 'Không gửi được bình luận')
    setText('')
    setNote('')
    onCount(data.comments)
    load()
  }

  async function remove(c: ExploreComment) {
    const { error: err } = await deleteExploreComment(token, c.id)
    if (err) return setError(err)
    setItems(list => (list ?? []).filter(x => x.id !== c.id))
    onCount(Math.max((items?.length ?? 1) - 1, 0))
  }

  async function report(c: ExploreComment) {
    const reason = window.prompt('Bình luận này có vấn đề gì? (viết ngắn gọn)')
    if (!reason) return
    const { error: err } = await reportExploreComment(token, c.id, reason)
    if (err) return setError(err)
    setNote('Đã gửi báo cáo, cảm ơn bạn.')
  }

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-end bg-black/50" onClick={onClose}>
      <div className="flex max-h-[75%] flex-col rounded-t-3xl bg-white text-ink" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3">
          <b>Bình luận</b>
          <button type="button" onClick={onClose} aria-label="Đóng bình luận" className="grid size-9 cursor-pointer place-items-center rounded-full border-0 bg-slate-100"><CloseIcon className="size-4" /></button>
        </div>
        <div className="min-h-[120px] flex-1 overflow-y-auto px-4 pb-2">
          {!items && !error && <div className="h-20 animate-pulse rounded-xl bg-slate-100" />}
          {items && items.length === 0 && <p className="py-6 text-center text-sm text-muted">Chưa có bình luận nào, bạn viết đầu tiên nhé!</p>}
          <ul className="m-0 grid list-none gap-3 p-0">
            {(items ?? []).map(c => (
              <li key={c.id} className="text-sm">
                <div className="flex items-center justify-between gap-2"><b>{c.name}{c.mine ? ' (bạn)' : ''}</b>
                  {c.mine
                    ? <button type="button" onClick={() => remove(c)} className="cursor-pointer border-0 bg-transparent p-0 text-xs text-muted">Xóa</button>
                    : <button type="button" onClick={() => report(c)} className="cursor-pointer border-0 bg-transparent p-0 text-xs text-muted">Báo cáo</button>}
                </div>
                <p className="m-0 mt-0.5 break-words">{c.body}</p>
              </li>
            ))}
          </ul>
        </div>
        {error && <p className="m-0 px-4 text-sm text-warn-text" role="alert">{error}</p>}
        {note && <p className="m-0 px-4 text-sm text-green-dark" role="status">{note}</p>}
        {enabled ? (
          <form className="flex gap-2 border-t border-line p-3" onSubmit={e => { e.preventDefault(); send() }}>
            <input value={text} onChange={e => setText(e.target.value)} maxLength={300} placeholder="Viết bình luận..." aria-label="Bình luận của bạn"
              className="min-h-11 min-w-0 flex-1 rounded-full border border-line px-4 text-sm outline-none focus:border-green" />
            <button type="submit" disabled={busy || !text.trim()} className="min-h-11 cursor-pointer rounded-full border-0 bg-green px-5 text-sm font-extrabold text-white disabled:opacity-50">Gửi</button>
          </form>
        ) : <p className="m-0 border-t border-line p-3 text-center text-sm text-muted">Bình luận đang tạm tắt.</p>}
      </div>
    </div>
  )
}
