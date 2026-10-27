'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getHomePoint } from '@/lib/api/account'
import { getCourseUrl } from '@/lib/api'
import { getCompareFigures, getCompareHighlights, type CompareFigures, type CompareHighlights } from '@/lib/api/compare'
import { idsFromQuery } from '@/lib/compare/selection'
import { removeCompare, useCompareList } from '@/lib/compare/store'
import { NO_INFO, visibleRows } from '@/lib/compare/rows'

/** Plan 04.6: the courses the parent picked, side by side. Figures from the system; the AI only rewrites what each description says. */
export default function CompareView() {
  const router = useRouter()
  const params = useSearchParams()
  const { token } = useAuth()
  const stored = useCompareList()
  const queryIds = useMemo(() => idsFromQuery(params.get('ids')), [params])
  const ids = queryIds.length > 0 ? queryIds : stored.map(entry => entry.id)
  const idsKey = ids.join(',')

  const [point, setPoint] = useState<{ lat: number; lng: number } | null>(null)
  // Answers are kept with the request they belong to, so a new pick shows "loading" without setting state in an effect.
  const figuresKey = `${idsKey}|${point ? `${point.lat},${point.lng}` : ''}`
  const [figuresAnswer, setFiguresAnswer] = useState<{ key: string; data: CompareFigures | null } | null>(null)
  const [highlightsAnswer, setHighlightsAnswer] = useState<{ key: string; data: CompareHighlights | null } | null>(null)
  const figures = figuresAnswer?.key === figuresKey ? figuresAnswer.data : null
  const highlights = highlightsAnswer?.key === idsKey ? (highlightsAnswer.data ?? { enabled: false, courses: {} }) : null
  const loading = ids.length > 0 && figuresAnswer?.key !== figuresKey

  useEffect(() => {
    if (!token) return
    getHomePoint(token).then(home => setPoint(home ? { lat: home.lat, lng: home.lng } : null))
  }, [token])

  // The address always carries the picks, so it can be shared.
  useEffect(() => {
    if (queryIds.length === 0 && ids.length > 0) router.replace(`/compare?ids=${idsKey}`)
  }, [queryIds.length, ids.length, idsKey, router])

  useEffect(() => {
    if (ids.length === 0) return
    let alive = true
    getCompareFigures(ids, point).then(data => { if (alive) setFiguresAnswer({ key: figuresKey, data }) })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [figuresKey])

  useEffect(() => {
    if (ids.length === 0) return
    let alive = true
    getCompareHighlights(ids).then(data => { if (alive) setHighlightsAnswer({ key: idsKey, data }) })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey])

  function drop(id: number) {
    removeCompare(id)
    const rest = ids.filter(other => other !== id)
    router.replace(rest.length ? `/compare?ids=${rest.join(',')}` : '/compare')
  }

  const courses = figures?.courses ?? []
  const rows = visibleRows(courses)
  const gridStyle = { gridTemplateColumns: `130px repeat(${Math.max(courses.length, 1)}, minmax(170px, 1fr))` }

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6">
      <h1 className="m-0 text-2xl font-extrabold text-ink">So sánh khóa học</h1>
      <p className="m-0 mt-1 text-sm text-muted">Chỉ đặt số liệu cạnh nhau, không chấm điểm hay xếp hạng. Bạn tự chọn khóa nào hợp với bé.</p>

      {ids.length === 0 && (
        <div className="mt-6 rounded-card border border-line bg-white p-6 text-center">
          <p className="m-0 text-ink">Bạn chưa chọn khóa nào. Bấm &quot;So sánh&quot; trên các khóa học (tối đa 3 khóa).</p>
          <Link href="/search" className="mt-3 inline-flex min-h-11 items-center rounded-full bg-green px-5 text-sm font-black text-white no-underline hover:bg-green-dark">Tìm khóa học</Link>
        </div>
      )}

      {ids.length > 0 && loading && <p className="mt-6 text-muted">Đang lấy số liệu…</p>}
      {!loading && ids.length > 0 && courses.length === 0 && <p className="mt-6 text-muted">Không tìm thấy các khóa đã chọn (có thể đã ngừng hiển thị).</p>}

      {courses.length > 0 && figures && (
        <div className="mt-5 overflow-x-auto">
          {figures.fieldNotice && (
            <p role="note" className="mb-3 rounded-xl border border-yellow bg-yellow/10 px-4 py-3 text-sm text-ink">{figures.fieldNotice}</p>
          )}
          <div className="grid min-w-max gap-px rounded-card border border-line bg-line" style={gridStyle}>
            <div className="bg-white" />
            {courses.map(course => (
              <div key={course.id} className={`flex flex-col gap-2 bg-white p-3 ${figures.offField.includes(courses.indexOf(course)) ? 'ring-2 ring-inset ring-yellow' : ''}`}>
                {figures.offField.includes(courses.indexOf(course)) && <span className="w-fit rounded-full bg-yellow/30 px-2 py-0.5 text-[11px] font-bold text-ink">Khác lĩnh vực</span>}
                {course.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={course.image} alt="" className="aspect-[16/10] w-full rounded-lg object-cover" />
                )}
                <Link href={getCourseUrl({ id: course.id, seoUrl: course.seoUrl ?? undefined, title: course.title })} className="text-sm font-extrabold leading-snug text-green-dark no-underline">{course.title}</Link>
                {course.partnerName && <span className="text-xs text-muted">{course.partnerName}</span>}
                <button type="button" onClick={() => drop(course.id)} className="w-fit cursor-pointer border-0 bg-transparent p-0 text-xs font-bold text-muted hover:text-red">Bỏ khỏi so sánh</button>
              </div>
            ))}

            {rows.map(row => (
              <Row key={row.key} label={row.label}>
                {courses.map((course, index) => {
                  const text = row.cell(course)
                  const isBest = row.bestKey != null && figures.best[row.bestKey] === index
                  return (
                    <div key={course.id} className={`whitespace-pre-line bg-white p-3 text-sm ${isBest ? 'font-extrabold text-green-dark' : text ? 'text-ink' : 'text-muted'}`}>
                      {text ?? NO_INFO}
                      {isBest && <span className="ml-1 text-[11px] font-bold">{bestNote(row.key)}</span>}
                    </div>
                  )
                })}
              </Row>
            ))}

            <HighlightRows courses={courses.map(c => c.id)} figures={figures} highlights={highlights} />
          </div>
          {figures.mixedFormats && (
            <p className="mt-2 text-xs text-muted">Các khóa khác hình thức (online với học trực tiếp), nên giá mỗi buổi chỉ để tham khảo.</p>
          )}
          {!token && !courses.some(c => c.distanceKm != null) && (
            <p className="mt-2 text-xs text-muted">Đăng nhập và lưu địa chỉ nhà để xem khoảng cách từ nhà tới từng khóa.</p>
          )}
        </div>
      )}
    </div>
  )
}

function bestNote(key: string): string {
  return key === 'points' ? '(nhiều nhất)' : key === 'distanceKm' ? '(gần nhất)' : '(thấp nhất)'
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <div className="bg-slate-50 p-3 text-xs font-bold text-muted">{label}</div>
      {children}
    </>
  )
}

function HighlightRows({ courses, figures, highlights }: { courses: number[]; figures: CompareFigures; highlights: CompareHighlights | null }) {
  if (highlights && !highlights.enabled && Object.values(highlights.courses).every(facts => Object.keys(facts).length === 0)) return null
  const labels = Object.entries(figures.factLabels)
  return (
    <>
      <div className="col-span-full bg-slate-50 px-3 py-2 text-xs font-bold text-muted">
        Ý chính trong mô tả khóa học
        <span className="ml-1 font-normal">(AI đọc và ghi lại điều mô tả nêu, không đánh giá. Xem mô tả đầy đủ ở trang khóa học.)</span>
      </div>
      {labels.map(([key, label]) => (
        <Row key={key} label={label}>
          {courses.map(id => {
            const text = highlights?.courses[String(id)]?.[key]
            return (
              <div key={id} className={`bg-white p-3 text-sm ${text ? 'text-ink' : 'text-muted'}`}>
                {highlights === null ? 'Đang đọc mô tả…' : text ?? 'Mô tả không nêu'}
              </div>
            )
          })}
        </Row>
      ))}
    </>
  )
}
