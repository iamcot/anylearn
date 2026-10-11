'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import { getCartInfo, addToCart, CartInfoData, ItemSchedule, getCourseUrl } from '@/lib/api'
import Link from 'next/link'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/v2/api'

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
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null)
  const [selectedSchedule, setSelectedSchedule] = useState<number | null>(null)
  const [trialTrial, setTrialTrial] = useState(false)
  const [trialTest, setTrialTest] = useState(false)
  const [trialVisit, setTrialVisit] = useState(false)
  const [trialTrialDate, setTrialTrialDate] = useState('')
  const [trialTestDate, setTrialTestDate] = useState('')
  const [trialVisitDate, setTrialVisitDate] = useState('')
  const [trialTrialNote, setTrialTrialNote] = useState('')
  const [trialTestNote, setTrialTestNote] = useState('')
  const [trialVisitNote, setTrialVisitNote] = useState('')

  // Child account modal
  const [childModal, setChildModal] = useState<null | 'new' | { id: number; name: string; dob: string }>(null)
  const [childName, setChildName] = useState('')
  const [childDob, setChildDob] = useState('')
  const [savingChild, setSavingChild] = useState(false)

  // Billing-only start month picker
  const [startMonth, setStartMonth] = useState('')

  useEffect(() => {
    if (isAuthLoading) return          // chờ auth load xong trước
    if (!user || !token) {
      openAuthModal('login', () => router.refresh())
      return
    }
    getCartInfo(Number(itemId), token).then(d => {
      setData(d)
      setLoading(false)
      if (d?.plans && d.plans.length > 0) setSelectedPlan(d.plans[0].id)
      if (d?.schedules && d.schedules.length === 1) setSelectedSchedule(d.schedules[0].id)
    })
  }, [isAuthLoading, user, token, itemId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSaveChild() {
    if (!token || !childName.trim() || !childDob) return
    setSavingChild(true)
    try {
      const res = await fetch(`${BASE}/user/children`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: childName.trim(),
          dob: childDob,
          ...(childModal !== 'new' && childModal ? { id: childModal.id } : {}),
        }),
      })
      const json = await res.json()
      const saved = json.data ?? json
      // Update local state directly — no refetch needed
      if (childModal === 'new') {
        setData(prev => prev ? { ...prev, children: [...prev.children, { id: saved.id, name: saved.name ?? childName.trim(), dob: childDob }] } : prev)
      } else {
        setData(prev => prev ? {
          ...prev,
          children: prev.children.map(c => c.id === (childModal as { id: number }).id
            ? { ...c, name: childName.trim(), dob: childDob }
            : c),
        } : prev)
      }
    } catch { /* save failed silently */ }
    setSavingChild(false)
    setChildModal(null)
  }

  function calcAge(dob: string) {
    const birth = new Date(dob), now = new Date()
    let age = now.getFullYear() - birth.getFullYear()
    if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--
    return age
  }

  const handleAddToCart = async () => {
    if (!token || !data) return
    setSubmitting(true)
    setError('')

    const activities = [
      trialTrial && { type: 'trial', date: trialTrialDate || undefined, note: trialTrialNote || undefined },
      trialTest  && { type: 'test',  date: trialTestDate  || undefined, note: trialTestNote  || undefined },
      trialVisit && { type: 'visit', date: trialVisitDate || undefined, note: trialVisitNote || undefined },
    ].filter(Boolean) as { type: string; date?: string; note?: string }[]

    const { error: err } = await addToCart({
      itemId: Number(itemId),
      studentId: selectedStudent ?? undefined,
      planId: selectedPlan ?? undefined,
      scheduleId: selectedSchedule ?? undefined,
      activities: activities.length > 0 ? activities : undefined,
      startDate: startMonth ? startMonth + '-01' : undefined,
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
  const schedules: ItemSchedule[] = data.schedules ?? []
  const isBillingOnly = schedules.length === 0 && !!item.cycleType && ['month','year','week','day'].includes(item.cycleType)
  const CYCLE_LABEL: Record<string, string> = { month: 'tháng', year: 'năm', week: 'tuần', day: 'ngày', session: 'buổi' }

  const WD_LABEL: Record<string, string> = { mon:'Thứ Hai', tue:'Thứ Ba', wed:'Thứ Tư', thu:'Thứ Năm', fri:'Thứ Sáu', sat:'Thứ Bảy', sun:'Chủ Nhật' }
  function scheduleLabel(s: ItemSchedule) {
    if (s.scheduleType === 'event' && s.eventDate) {
      const date = new Date(s.eventDate).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
      const time = s.timeStart ? ` · ${s.timeStart}${s.timeEnd ? '–' + s.timeEnd : ''}` : ''
      return `Ngày khai giảng: ${date}${time}`
    }
    const days = s.weekdays ? s.weekdays.split(',').map(d => WD_LABEL[d] ?? d).join(' ') : ''
    const time = s.timeStart ? ` · ${s.timeStart}${s.timeEnd ? '–' + s.timeEnd : ''}` : ''
    const from = s.dateStart ? ` · từ ${new Date(s.dateStart).toLocaleDateString('vi-VN')}` : ''
    return [days, time, from].filter(Boolean).join('')
  }

  return (
    <div className="section bg-[#f0f4f8]">
      <div className="container max-w-[900px]">

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
            <span className="font-black text-ink flex-1">Bạn đang đăng ký cho</span>
            <button onClick={() => { setChildName(''); setChildDob(''); setChildModal('new') }}
              className="text-xs font-bold text-[#00539b] bg-white border border-[#00539b] px-2.5 py-1 rounded-full cursor-pointer hover:bg-[#e7f3ff]">
              + Thêm con
            </button>
          </div>
          <div className="py-4 px-5 flex flex-col gap-2.5">
            {/* Self */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="radio" name="student" checked={selectedStudent === null}
                onChange={() => setSelectedStudent(null)}
                className="w-[18px] h-[18px] accent-green" />
              <span className={`text-ink ${selectedStudent === null ? 'font-bold' : 'font-normal'}`}>{user.name} (Tôi)</span>
            </label>
            {/* Children */}
            {data.children.map(s => (
              <div key={s.id} className="flex items-center gap-2.5">
                <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                  <input type="radio" name="student" checked={selectedStudent === s.id}
                    onChange={() => setSelectedStudent(s.id)}
                    className="w-[18px] h-[18px] accent-green" />
                  <div>
                    <span className={`text-ink ${selectedStudent === s.id ? 'font-bold' : 'font-normal'}`}>{s.name}</span>
                    {s.dob && <span className="text-muted text-xs ml-1.5">({calcAge(s.dob)} tuổi)</span>}
                  </div>
                </label>
                <button onClick={() => { setChildName(s.name); setChildDob(s.dob ?? ''); setChildModal({ id: s.id, name: s.name, dob: s.dob ?? '' }) }}
                  className="text-xs text-muted hover:text-ink cursor-pointer bg-transparent border-0 p-0">Sửa</button>
              </div>
            ))}
          </div>
        </div>

        {/* Child modal */}
        {childModal !== null && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div className="bg-white rounded-[16px] p-6 w-full max-w-[360px]">
              <h3 className="m-0 mb-4 text-base font-black text-ink">{childModal === 'new' ? 'Thêm tài khoản con' : 'Sửa tài khoản con'}</h3>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs text-muted mb-1 block">Tên</label>
                  <input value={childName} onChange={e => setChildName(e.target.value)}
                    className="field w-full" placeholder="Tên học sinh" />
                </div>
                <div>
                  <label className="text-xs text-muted mb-1 block">Ngày sinh</label>
                  <input type="date" value={childDob} onChange={e => setChildDob(e.target.value)}
                    className="field w-full" />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setChildModal(null)}
                  className="btn btn--outline flex-1 text-sm">Hủy</button>
                <button onClick={handleSaveChild} disabled={savingChild || !childName.trim() || !childDob}
                  className="btn btn--green flex-1 text-sm">
                  {savingChild ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Ca học (new item_schedules) */}
        {schedules.length > 0 && (
          <div className="bg-white border border-line rounded-card mb-4 overflow-hidden">
            <div className="bg-bg border-b border-line py-3.5 px-5 flex items-center gap-2">
              <span className="text-lg">📅</span>
              <span className="font-black text-ink">Chọn ca học</span>
            </div>
            <div className="py-4 px-5 flex flex-col gap-2.5">
              {schedules.map(s => (
                <label key={s.id} className="flex items-start gap-2.5 cursor-pointer">
                  <input type="radio" name="schedule" checked={selectedSchedule === s.id}
                    onChange={() => setSelectedSchedule(s.id)}
                    className="w-[18px] h-[18px] mt-[2px] accent-green shrink-0" />
                  <div>
                    <div className={`text-ink ${selectedSchedule === s.id ? 'font-bold' : 'font-normal'}`}>
                      {s.title || `Ca ${s.id}`}
                    </div>
                    {scheduleLabel(s) && (
                      <div className="text-xs text-muted mt-0.5">{scheduleLabel(s)}</div>
                    )}
                    {s.scheduleType === 'open' && (
                      <div className="text-xs text-[#00a651] mt-0.5 font-medium">
                        Chọn ngày khai giảng linh hoạt sau khi đăng ký
                      </div>
                    )}
                    {s.locationNote && <div className="text-xs text-muted">{s.locationNote}</div>}
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Section 4: Lịch học / Tháng bắt đầu */}
        {schedules.length === 0 && (
          <div className="bg-white border border-line rounded-card mb-4 overflow-hidden">
            <div className="bg-bg border-b border-line py-3.5 px-5 flex items-center gap-2">
              <span className="text-lg">📅</span>
              <span className="font-black text-ink">{isBillingOnly ? 'Chọn tháng bắt đầu' : 'Chọn Lịch học'}</span>
            </div>
            <div className="py-4 px-5">
              {isBillingOnly ? (
                <div>
                  <p className="text-sm text-muted mb-3">
                    Khóa học thu phí theo {item.cycleAmount && item.cycleAmount > 1 ? `${item.cycleAmount} ` : ''}{CYCLE_LABEL[item.cycleType!] ?? item.cycleType}.
                    Chọn tháng bắt đầu để tính ngày hết hạn.
                  </p>
                  <input
                    type="month"
                    value={startMonth}
                    onChange={e => setStartMonth(e.target.value)}
                    min={new Date().toISOString().substring(0, 7)}
                    className="border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green"
                    style={{ accentColor: '#00a651' }}
                  />
                  {startMonth && (
                    <p className="text-xs text-[#00a651] mt-2">
                      Bắt đầu từ {new Date(startMonth + '-01').toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                    </p>
                  )}
                </div>
              ) : data.plans.length > 0 ? (
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
        )}

        {/* Section 5: Hoạt động trải nghiệm */}
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
