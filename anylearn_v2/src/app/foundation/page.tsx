import type { Metadata } from 'next'
import Link from 'next/link'
import { getFoundation } from '@/lib/api/gamification'
import { shareMeta } from '@/lib/seo/shareMeta'
import { vnd } from '@/lib/foundation/rules'
import HouseProgress from '@/components/foundation/HouseProgress'

export const metadata: Metadata = shareMeta('foundation')
export const revalidate = 60

const SOURCE_LABEL: Record<string, string> = { order: 'đăng ký khóa học', milestone: 'phần thưởng', seed: 'anyLEARN góp', admin: 'anyLEARN góp' }

function when(at: string): string {
  const d = new Date(at)
  return Number.isNaN(d.getTime()) ? '' : `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default async function FoundationPage() {
  const state = await getFoundation()
  if (!state || !state.enabled) {
    return <main className="container py-10"><p className="text-muted">Chương trình anyLEARN Foundation đang tạm dừng.</p></main>
  }
  return (
    <main className="container flex max-w-3xl flex-col gap-4 py-5">
      <section className="rounded-card border border-line bg-gradient-to-br from-[#fff6ec] to-white p-5">
        <p className="m-0 text-xs font-bold uppercase tracking-wide text-[#a44d2a]">Chương trình anyLEARN Foundation</p>
        <h1 className="m-0 mt-1 text-2xl font-extrabold text-ink">Mỗi khóa học góp một viên gạch</h1>
        <p className="m-0 mt-2 text-sm text-muted">
          anyLEARN trích 5% phần anyLEARN giữ lại của mỗi khóa học (sau phần của trường, trung tâm) để xây nhà vệ sinh cho các trường vùng cao.
          Khóa học đầu tiên của mỗi gia đình góp gấp đôi. Bạn không phải trả thêm gì.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-6">
          <HouseProgress percent={state.percent} housesBuilt={state.housesBuilt} size="lg" />
          <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div><dt className="text-xs text-muted">Căn đang xây</dt><dd className="m-0 font-extrabold text-ink">Số {state.currentHouse} · {state.percent}%</dd></div>
            <div><dt className="text-xs text-muted">Đã xây xong</dt><dd className="m-0 font-extrabold text-ink">{state.housesBuilt} căn</dd></div>
            <div><dt className="text-xs text-muted">Còn thiếu</dt><dd className="m-0 font-extrabold text-ink">{vnd(state.remaining)}</dd></div>
            <div><dt className="text-xs text-muted">Gia đình đã góp</dt><dd className="m-0 font-extrabold text-ink">{state.contributors.toLocaleString('vi-VN')}</dd></div>
          </dl>
        </div>
        <Link href="/search" className="btn btn--green mt-4 inline-flex no-underline">Tìm khóa học cho bé</Link>
      </section>

      {state.houses.length > 0 && (
        <section className="rounded-card border border-line bg-white p-5">
          <h2 className="m-0 text-lg font-extrabold text-ink">Những căn đã xây xong</h2>
          <ul className="m-0 mt-3 flex list-none flex-col gap-3 p-0">
            {state.houses.map(h => (
              <li key={h.houseNo} className="flex gap-3">
                {h.photoUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={h.photoUrl} alt={`Căn số ${h.houseNo}`} className="size-20 shrink-0 rounded-xl object-cover" />
                  : <span className="grid size-20 shrink-0 place-items-center rounded-xl bg-[#fff6ec] text-3xl" aria-hidden>🏠</span>}
                <div className="min-w-0 text-sm">
                  <div className="font-extrabold text-ink">Căn số {h.houseNo}{h.school ? ` · ${h.school}` : ''}</div>
                  {h.place && <div className="text-muted">{h.place}</div>}
                  <div className="text-xs text-muted">{h.openedOn ? `Khánh thành ${h.openedOn}` : 'Đủ kinh phí, đang chuẩn bị xây'}</div>
                  {h.note && <p className="m-0 mt-1 text-xs text-muted">{h.note}</p>}
                  {h.proofUrl && <a href={h.proofUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue">Xem chứng từ</a>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-card border border-line bg-white p-5">
        <h2 className="m-0 text-lg font-extrabold text-ink">Đóng góp gần đây</h2>
        <p className="m-0 mt-1 text-xs text-muted">Tên được rút gọn. Ai muốn ẩn tên có thể bật ở Tài khoản &gt; Gạch của tôi.</p>
        {state.recent.length === 0 ? <p className="text-sm text-muted">Chưa có đóng góp.</p> : (
          <ul className="m-0 mt-3 flex list-none flex-col p-0">
            {state.recent.map(r => (
              <li key={r.id} className="flex items-center gap-2 border-t border-line py-2 text-sm first:border-t-0">
                <span aria-hidden>🧱</span>
                <span className="min-w-0 flex-1"><b>{r.name}</b> góp {r.label} <span className="text-muted">({SOURCE_LABEL[r.source] ?? r.source})</span></span>
                <span className="text-xs text-muted">{when(r.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
