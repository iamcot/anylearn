'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { addNeighbor, getNeighbors, removeNeighbor, setAllowSteal, type FarmNeighbors, type FarmView } from '@/lib/api/farm'

interface Props { token: string; view: FarmView; onChanged: () => void }

export default function NeighborsTab({ token, view, onChanged }: Props) {
  const [data, setData] = useState<FarmNeighbors | null>(null)
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')
  const load = useCallback(async () => {
    const { data: d } = await getNeighbors(token)
    if (d) setData(d)
  }, [token])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  async function add() {
    const { data: d, error } = await addNeighbor(token, code)
    setMsg(error ?? `Đã kết bạn với ${d?.added}`)
    if (d) { setCode(''); load(); onChanged() }
  }

  return (
    <section aria-label="Hàng xóm" className="mt-4 space-y-4">
      {data && (data.today.helped > 0 || data.today.picked > 0 || data.today.caught > 0) && (
        <p className="m-0 rounded-xl bg-green-soft px-3 py-2 text-sm font-bold text-green-dark">
          Hôm nay: {data.today.helped} lần hàng xóm giúp bạn · {data.today.picked} bông hoa bị hái lén · {data.today.caught} lần chó Bông bắt được kẻ hái trộm
        </p>
      )}
      <div className="rounded-2xl bg-white p-4 ring-1 ring-line">
        <h2 className="m-0 text-base font-black">Kết bạn</h2>
        <p className="mt-1 text-xs text-muted">Nhập số điện thoại hoặc mã giới thiệu của bạn đã mở Nông trại. Cần tài khoản từ 3 ngày và điểm danh 3 ngày mới tưới giúp và ghé vườn được.</p>
        <div className="mt-2 flex gap-2">
          <input value={code} onChange={e => setCode(e.target.value)} placeholder="SĐT hoặc mã giới thiệu" className="min-h-11 flex-1 rounded-xl border border-line px-3 text-sm" inputMode="tel" />
          <button type="button" className="btn btn--green min-h-11 px-4" onClick={add} disabled={!code.trim()}>Thêm</button>
        </div>
        {msg && <p className="mt-2 text-sm font-bold" role="status">{msg}</p>}
      </div>

      <div className="rounded-2xl bg-white p-4 ring-1 ring-line">
        <h2 className="m-0 text-base font-black">Hàng xóm ({data?.neighbors.length ?? 0})</h2>
        <ul className="m-0 mt-2 list-none space-y-2 p-0">
          {(data?.neighbors ?? []).map(n => (
            <li key={n.userId} className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold">{n.name} · cấp {n.level}</span>
              <span className="flex gap-2">
                <Link href={`/fun/farm/visit/${n.userId}`} className="inline-flex min-h-9 items-center rounded-lg bg-green px-3 text-xs font-extrabold text-white no-underline">Ghé vườn</Link>
                <button type="button" className="min-h-9 cursor-pointer rounded-lg border-0 bg-white px-2 text-xs font-bold text-muted ring-1 ring-line" onClick={async () => { await removeNeighbor(token, n.userId); load(); onChanged() }}>Bỏ</button>
              </span>
            </li>
          ))}
          {data && data.neighbors.length === 0 && <li className="text-sm text-muted">Chưa có hàng xóm. Ghé thử các vườn gợi ý bên dưới nhé.</li>}
        </ul>
      </div>

      <div className="rounded-2xl bg-white p-4 ring-1 ring-line">
        <h2 className="m-0 text-base font-black">Vườn gợi ý</h2>
        <p className="mt-1 text-xs text-muted">Ưu tiên vườn đang khát nước hoặc có hoa chín quá chưa thu.</p>
        <ul className="m-0 mt-2 list-none space-y-2 p-0">
          {(data?.suggestions ?? []).map(s => (
            <li key={s.userId} className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold">{s.name}<span className="ml-2 text-xs font-normal text-muted">{s.thirsty > 0 ? `💧 ${s.thirsty} ô khát` : ''} {s.pickable > 0 ? `🌼 ${s.pickable} hoa chín` : ''}</span></span>
              <Link href={`/fun/farm/visit/${s.userId}`} className="inline-flex min-h-9 items-center rounded-lg bg-green px-3 text-xs font-extrabold text-white no-underline">Ghé vườn</Link>
            </li>
          ))}
          {data && data.suggestions.length === 0 && <li className="text-sm text-muted">Chưa có vườn nào để gợi ý.</li>}
        </ul>
      </div>

      <label className="flex min-h-11 items-center gap-3 rounded-2xl bg-white p-4 text-sm font-bold ring-1 ring-line">
        <input type="checkbox" checked={view.allowSteal} onChange={async e => { await setAllowSteal(token, e.target.checked); onChanged() }} className="size-5" />
        Cho hái trộm hoa (tắt thì vườn bạn an toàn, nhưng bạn cũng không hái được vườn người khác)
      </label>
    </section>
  )
}
