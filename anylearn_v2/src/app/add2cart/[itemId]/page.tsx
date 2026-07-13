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
  const { user, token, openAuthModal, refreshCartCount } = useAuth()
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

  if (!user) return null
  if (loading) return <div className="section"><div className="container" style={{ textAlign: 'center', color: '#6d7a8a' }}>Đang tải...</div></div>
  if (!data) return <div className="section"><div className="container" style={{ textAlign: 'center', color: '#e73348' }}>Không tìm thấy khóa học</div></div>

  const item = data.item
  const hasActivities = data.activiyTrial || data.activiyTest || data.activiyVisit
  const hasDiscount = item.orgPrice && item.orgPrice > item.price

  return (
    <div className="section" style={{ background: '#f0f4f8' }}>
      <div className="container" style={{ maxWidth: 760 }}>

        {/* Section 1: Khóa học */}
        <div style={{ background: 'white', border: '1px solid #e6edf4', borderRadius: 20, marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ background: '#f7fafc', borderBottom: '1px solid #e6edf4', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>🛒</span>
            <span style={{ fontWeight: 900, color: '#17212f' }}>Khóa học bạn đang đăng ký</span>
          </div>
          <div style={{ padding: 20 }}>
            <Link href={getCourseUrl(item)} style={{ textDecoration: 'none' }}>
              <h2 style={{ margin: '0 0 6px', color: '#008244', fontSize: 20, fontWeight: 900, lineHeight: 1.3 }}>{item.title}</h2>
            </Link>
            {item.authorName && <p style={{ margin: '0 0 12px', color: '#6d7a8a', fontSize: 14 }}>Đối tác: {item.authorName}</p>}
            <p style={{ margin: '0 0 8px', color: '#17212f', fontSize: 15 }}>
              Học phí: <strong style={{ color: '#e73348' }}>{formatPrice(item.price)}</strong>
              {hasDiscount && <span style={{ marginLeft: 10, color: '#9aa5b1', textDecoration: 'line-through', fontSize: 13 }}>{formatPrice(item.orgPrice!)}</span>}
            </p>
          </div>
        </div>

        {/* Section 2: Người học */}
        <div style={{ background: 'white', border: '1px solid #e6edf4', borderRadius: 20, marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ background: '#f7fafc', borderBottom: '1px solid #e6edf4', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>👤</span>
            <span style={{ fontWeight: 900, color: '#17212f' }}>Bạn đang đăng ký cho</span>
          </div>
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[{ id: null, name: `${user.name} (Tôi)` }, ...data.children].map(s => (
              <label key={String(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input type="radio" name="student" checked={selectedStudent === s.id}
                  onChange={() => setSelectedStudent(s.id)}
                  style={{ width: 18, height: 18, accentColor: '#00a651' }} />
                <span style={{ fontWeight: selectedStudent === s.id ? 700 : 400, color: '#17212f' }}>{s.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Section 3: Lịch học */}
        <div style={{ background: 'white', border: '1px solid #e6edf4', borderRadius: 20, marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ background: '#f7fafc', borderBottom: '1px solid #e6edf4', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>📅</span>
            <span style={{ fontWeight: 900, color: '#17212f' }}>Chọn Lịch học</span>
          </div>
          <div style={{ padding: '16px 20px' }}>
            {data.plans.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.plans.map(p => (
                  <label key={p.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                    <input type="radio" name="plan" checked={selectedPlan === p.id}
                      onChange={() => setSelectedPlan(p.id)}
                      style={{ width: 18, height: 18, marginTop: 2, accentColor: '#00a651' }} />
                    <div>
                      <div style={{ fontWeight: selectedPlan === p.id ? 700 : 400, color: '#17212f' }}>
                        {p.title || `Lịch ${p.id}`}
                        {p.weekdays && <span style={{ color: '#6d7a8a', fontWeight: 400 }}> — {p.weekdays}</span>}
                      </div>
                      {p.date_start && <div style={{ fontSize: 13, color: '#6d7a8a' }}>Bắt đầu từ ngày {new Date(p.date_start).toLocaleDateString('vi-VN')}</div>}
                      {p.location_title && <div style={{ fontSize: 13, color: '#6d7a8a' }}>{p.location_title}{p.address ? ` — ${p.address}` : ''}</div>}
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, color: '#6d7a8a' }}>
                Lịch học bắt đầu từ ngày {item.dateStart ? new Date(item.dateStart).toLocaleDateString('vi-VN') : 'sớm nhất'}
              </p>
            )}
          </div>
        </div>

        {/* Section 4: Hoạt động trải nghiệm */}
        {hasActivities && (
          <div style={{ background: 'white', border: '1px solid #e6edf4', borderRadius: 20, marginBottom: 16, overflow: 'hidden' }}>
            <div style={{ background: '#f7fafc', borderBottom: '1px solid #e6edf4', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>🎉</span>
              <span style={{ fontWeight: 900, color: '#17212f' }}>Các hoạt động trải nghiệm miễn phí</span>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {[
                    { key: 'trial', label: 'Học thử', checked: trialTrial, onCheck: setTrialTrial, date: trialTrialDate, onDate: setTrialTrialDate, note: trialTrialNote, onNote: setTrialTrialNote, show: data.activiyTrial },
                    { key: 'test', label: 'Đăng Kí Thi Đầu Vào', checked: trialTest, onCheck: setTrialTest, date: trialTestDate, onDate: setTrialTestDate, note: trialTestNote, onNote: setTrialTestNote, show: data.activiyTest },
                    { key: 'visit', label: 'Tham quan trường', checked: trialVisit, onCheck: setTrialVisit, date: trialVisitDate, onDate: setTrialVisitDate, note: trialVisitNote, onNote: setTrialVisitNote, show: data.activiyVisit },
                  ].filter(r => r.show).map(r => (
                    <tr key={r.key} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '10px 0', width: 160 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                          <input type="checkbox" checked={r.checked} onChange={e => r.onCheck(e.target.checked)} style={{ accentColor: '#00a651' }} />
                          <span style={{ fontSize: 14 }}>{r.label}</span>
                        </label>
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <input type="date" value={r.date} onChange={e => r.onDate(e.target.value)}
                          className="field" style={{ minHeight: 38, fontSize: 13 }} disabled={!r.checked} />
                      </td>
                      <td style={{ padding: '10px 0' }}>
                        <input type="text" placeholder="Ghi chú" value={r.note} onChange={e => r.onNote(e.target.value)}
                          className="field" style={{ minHeight: 38, fontSize: 13 }} disabled={!r.checked} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {error && <div style={{ background: '#fff5f5', border: '1px solid #ffc9c9', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#e73348' }}>{error}</div>}

        <button onClick={handleAddToCart} className="btn btn--green" disabled={submitting}
          style={{ width: '100%', fontSize: 17, padding: '16px', marginBottom: 12 }}>
          {submitting ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
        </button>
        <button onClick={() => router.back()} className="btn btn--outline" style={{ width: '100%' }}>
          Quay lại
        </button>
      </div>
    </div>
  )
}
