'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import { getCartInfo, addToCart, CartInfoData, getCourseUrl } from '@/lib/api'
import Link from 'next/link'

function formatPrice(p: number) {
  if (!p) return 'Liên hệ'
  if (p >= 1_000_000) return `${(p / 1_000_000).toFixed(1).replace('.0', '')} triệu`
  return p.toLocaleString('vi-VN') + ' đ'
}

export default function Add2CartPage() {
  const { user, token, openAuthModal, refreshCartCount, isAuthLoading } = useAuth()
  const router = useRouter()
  const { itemId } = useParams<{ itemId: string }>()

  const [data, setData] = useState<CartInfoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Selections
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null) // null = bản thân
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null)
  const [trialTrial, setTrialTrial] = useState(false)
  const [trialTest, setTrialTest] = useState(false)
  const [trialVisit, setTrialVisit] = useState(false)
  const [trialTrialDate, setTrialTrialDate] = useState('')
  const [trialTestDate, setTrialTestDate] = useState('')
  const [trialVisitDate, setTrialVisitDate] = useState('')
  const [trialTrialNote, setTrialTrialNote] = useState('')
  const [trialTestNote, setTrialTestNote] = useState('')
  const [trialVisitNote, setTrialVisitNote] = useState('')

  useEffect(() => {
    if (!user || !token) {
      openAuthModal('login', () => router.refresh())
      return
    }
    getCartInfo(Number(itemId), token).then(d => {
      setData(d)
      setLoading(false)
      if (d?.plans && d.plans.length > 0) setSelectedPlan(d.plans[0].id)
    })
  }, [user, token, itemId])

  const handleAddToCart = async () => {
    if (!token || !data) return
    setSubmitting(true)
    setError('')

    const trialType = trialTrial ? 'trial' : trialTest ? 'test' : trialVisit ? 'visit' : undefined
    const trialDate = trialTrial ? trialTrialDate : trialTest ? trialTestDate : trialVisit ? trialVisitDate : undefined
    const trialNote = trialTrial ? trialTrialNote : trialTest ? trialTestNote : trialVisit ? trialVisitNote : undefined

    const { error: err } = await addToCart({
      itemId: Number(itemId),
      studentId: selectedStudent ?? undefined,
      planId: selectedPlan ?? undefined,
      trialType, trialDate, trialNote,
    }, token)

    setSubmitting(false)
    if (err) { setError(err); return }
    await refreshCartCount()
    router.push('/checkout')
  }

  if (isAuthLoading) return null
  if (!user) return null
  if (loading) return <div className="section"><div className="container text-center text-muted">Đang tải...</div></div>
  if (!data) return <div className="section"><div className="container text-center text-red">Không tìm thấy khóa học</div></div>

  const item = data.item
  const hasActivities = data.activiyTrial || data.activiyTest || data.activiyVisit
  const hasDiscount = item.orgPrice && item.orgPrice > item.price

  return (
    <div className="section bg-[#f0f4f8]">
      <div className="container max-w-[760px]">

        {/* Section 1: Khóa học */}
        <div className="bg-white border border-line rounded-card mb-4 overflow-hidden">
          <div className="bg-bg border-b border-line py-3.5 px-5 flex items-center gap-2">
            <span className="text-lg">🛒</span>
            <span className="font-black text-ink">Khóa học bạn đang đăng ký</span>
          </div>
          <div className="p-5">
            <Link href={getCourseUrl(item)} className="no-underline">
              <h2 className="m-0 mb-[6px] text-green-dark text-xl font-black leading-tight">{item.title}</h2>
            </Link>
            {item.authorName && <p className="m-0 mb-3 text-muted text-sm">Đối tác: {item.authorName}</p>}
            <p className="m-0 mb-2 text-ink text-[15px]">
              Học phí: <strong className="text-red">{formatPrice(item.price)}</strong>
              {hasDiscount && <span className="ml-2.5 text-[#9aa5b1] line-through text-xs">{formatPrice(item.orgPrice!)}</span>}
            </p>
          </div>
        </div>

        {/* Section 2: Người học */}
        <div className="bg-white border border-line rounded-card mb-4 overflow-hidden">
          <div className="bg-bg border-b border-line py-3.5 px-5 flex items-center gap-2">
            <span className="text-lg">👤</span>
            <span className="font-black text-ink">Bạn đang đăng ký cho</span>
          </div>
          <div className="py-4 px-5 flex flex-col gap-2.5">
            {[{ id: null, name: `${user.name} (Tôi)` }, ...data.children].map(s => (
              <label key={String(s.id)} className="flex items-center gap-2.5 cursor-pointer">
                <input type="radio" name="student" checked={selectedStudent === s.id}
                  onChange={() => setSelectedStudent(s.id)}
                  className="w-[18px] h-[18px] accent-green" />
                <span className={`text-ink ${selectedStudent === s.id ? 'font-bold' : 'font-normal'}`}>{s.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Section 3: Lịch học */}
        <div className="bg-white border border-line rounded-card mb-4 overflow-hidden">
          <div className="bg-bg border-b border-line py-3.5 px-5 flex items-center gap-2">
            <span className="text-lg">📅</span>
            <span className="font-black text-ink">Chọn Lịch học</span>
          </div>
          <div className="py-4 px-5">
            {data.plans.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {data.plans.map(p => (
                  <label key={p.id} className="flex items-start gap-2.5 cursor-pointer">
                    <input type="radio" name="plan" checked={selectedPlan === p.id}
                      onChange={() => setSelectedPlan(p.id)}
                      className="w-[18px] h-[18px] mt-[2px] accent-green" />
                    <div>
                      <div className={`text-ink ${selectedPlan === p.id ? 'font-bold' : 'font-normal'}`}>
                        {p.title || `Lịch ${p.id}`}
                        {p.weekdays && <span className="text-muted font-normal"> — {p.weekdays}</span>}
                      </div>
                      {p.date_start && <div className="text-xs text-muted">Bắt đầu từ ngày {new Date(p.date_start).toLocaleDateString('vi-VN')}</div>}
                      {p.location_title && <div className="text-xs text-muted">{p.location_title}{p.address ? ` — ${p.address}` : ''}</div>}
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <p className="m-0 text-muted">
                Lịch học bắt đầu từ ngày {item.dateStart ? new Date(item.dateStart).toLocaleDateString('vi-VN') : 'sớm nhất'}
              </p>
            )}
          </div>
        </div>

        {/* Section 4: Hoạt động trải nghiệm */}
        {hasActivities && (
          <div className="bg-white border border-line rounded-card mb-4 overflow-hidden">
            <div className="bg-bg border-b border-line py-3.5 px-5 flex items-center gap-2">
              <span className="text-lg">🎉</span>
              <span className="font-black text-ink">Các hoạt động trải nghiệm miễn phí</span>
            </div>
            <div className="py-4 px-5">
              <table className="w-full border-collapse">
                <tbody>
                  {[
                    { key: 'trial', label: 'Học thử', checked: trialTrial, onCheck: setTrialTrial, date: trialTrialDate, onDate: setTrialTrialDate, note: trialTrialNote, onNote: setTrialTrialNote, show: data.activiyTrial },
                    { key: 'test', label: 'Đăng Kí Thi Đầu Vào', checked: trialTest, onCheck: setTrialTest, date: trialTestDate, onDate: setTrialTestDate, note: trialTestNote, onNote: setTrialTestNote, show: data.activiyTest },
                    { key: 'visit', label: 'Tham quan trường', checked: trialVisit, onCheck: setTrialVisit, date: trialVisitDate, onDate: setTrialVisitDate, note: trialVisitNote, onNote: setTrialVisitNote, show: data.activiyVisit },
                  ].filter(r => r.show).map(r => (
                    <tr key={r.key} className="border-b border-[#f0f0f0]">
                      <td className="py-2.5 px-0 w-[160px]">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={r.checked} onChange={e => r.onCheck(e.target.checked)} className="accent-green" />
                          <span className="text-sm">{r.label}</span>
                        </label>
                      </td>
                      <td className="py-2.5 px-2">
                        <input type="date" value={r.date} onChange={e => r.onDate(e.target.value)}
                          className="field min-h-[38px] text-xs" disabled={!r.checked} />
                      </td>
                      <td className="py-2.5 px-0">
                        <input type="text" placeholder="Ghi chú" value={r.note} onChange={e => r.onNote(e.target.value)}
                          className="field min-h-[38px] text-xs" disabled={!r.checked} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {error && <div className="bg-red-soft border border-[#ffc9c9] rounded-xl py-3 px-4 mb-4 text-red">{error}</div>}

        <button onClick={handleAddToCart} className="btn btn--green w-full text-[17px] p-4 mb-3" disabled={submitting}>
          {submitting ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
        </button>
        <button onClick={() => router.back()} className="btn btn--outline w-full">
          Quay lại
        </button>
      </div>
    </div>
  )
}
