'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { getCart, removeCartItem, checkout, CartItem } from '@/lib/api'
import Link from 'next/link'

function formatPrice(p: number) {
  if (!p) return 'Liên hệ'
  if (p >= 1_000_000) return `${(p / 1_000_000).toFixed(1).replace('.0', '')} triệu`
  return p.toLocaleString('vi-VN') + ' đ'
}

const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Chuyển khoản ngân hàng hoặc thanh toán tại trường' },
  { value: 'card', label: 'Thanh toán trực tuyến bằng thẻ' },
  { value: 'vnpay', label: 'Quét mã QR qua VNPay (giảm 1%) (trên 100 triệu)' },
  { value: 'installment', label: 'Trả góp qua thẻ tín dụng (trên 3 triệu) (kỳ hạn 3 tháng) (0% lãi suất)' },
]

export default function CheckoutPage() {
  const { user, token, refreshCartCount } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [coupon, setCoupon] = useState('')
  const [points, setPoints] = useState('')
  const [agreedTerms, setAgreedTerms] = useState(false)

  useEffect(() => {
    if (!token) return
    getCart(token).then(data => { setItems(data); setLoading(false) })
  }, [token])

  if (!user) { router.push('/login'); return null }

  const total = items.reduce((sum, i) => sum + i.price, 0)

  const handleRemove = async (id: number) => {
    if (!token) return
    await removeCartItem(id, token)
    setItems(prev => prev.filter(i => i.cartItemId !== id))
    await refreshCartCount()
  }

  const handleCheckout = async () => {
    if (!agreedTerms) { setError('Vui lòng đồng ý với điều khoản thanh toán'); return }
    if (!token) return
    setSubmitting(true)
    setError('')
    const { data, error: err } = await checkout({
      paymentMethod,
      couponCode: coupon || undefined,
      pointsUsed: points ? Number(points) : undefined,
    }, token)
    setSubmitting(false)
    if (err || !data) { setError(err || 'Thanh toán thất bại'); return }
    await refreshCartCount()
    router.push(`/order/${data.orderId}`)
  }

  return (
    <div className="section section--soft">
      <div className="container" style={{ maxWidth: 800 }}>
        {/* Đơn hàng */}
        <div style={{ background: 'white', border: '1px solid #e6edf4', borderRadius: 20, marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ background: '#f7fafc', borderBottom: '1px solid #e6edf4', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>🛒</span>
            <span style={{ fontWeight: 900, color: '#17212f' }}>Đơn hàng của bạn</span>
          </div>
          {loading ? (
            <div style={{ padding: 20, color: '#6d7a8a' }}>Đang tải...</div>
          ) : items.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center' }}>
              <p style={{ color: '#6d7a8a', marginBottom: 16 }}>Giỏ hàng trống</p>
              <Link href="/search" className="btn btn--green">Tìm khóa học</Link>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e6edf4', background: '#f7fafc' }}>
                  <td style={{ padding: '10px 20px', fontWeight: 700, fontSize: 13, color: '#6d7a8a', width: 30 }}>#</td>
                  <td style={{ padding: '10px 0', fontWeight: 700, fontSize: 13, color: '#6d7a8a' }}>Khoá học/Sản phẩm</td>
                  <td style={{ padding: '10px 20px', fontWeight: 700, fontSize: 13, color: '#6d7a8a', textAlign: 'right' }}>Đơn giá</td>
                  <td style={{ padding: '10px 12px', width: 40 }}></td>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.cartItemId} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '14px 20px', color: '#6d7a8a', fontSize: 14, verticalAlign: 'top' }}>{idx + 1}</td>
                    <td style={{ padding: '14px 0', verticalAlign: 'top' }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        {item.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.image} alt={item.title} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} />
                        )}
                        <div>
                          <div style={{ fontWeight: 900, color: '#008244', fontSize: 15, lineHeight: 1.3 }}>
                            {item.title}
                            {item.studentName && <span style={{ color: '#6d7a8a', fontWeight: 400 }}> ({item.studentName})</span>}
                          </div>
                          {item.dateStart && <div style={{ color: '#6d7a8a', fontSize: 13, marginTop: 4 }}>Bắt đầu từ ngày {new Date(item.dateStart).toLocaleDateString('vi-VN')}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', verticalAlign: 'top', fontWeight: 700 }}>{formatPrice(item.price)}</td>
                    <td style={{ padding: '14px 12px', verticalAlign: 'top', textAlign: 'center' }}>
                      <button onClick={() => handleRemove(item.cartItemId)} style={{
                        width: 32, height: 32, borderRadius: '50%', background: 'white', border: '1px solid #e73348',
                        color: '#e73348', cursor: 'pointer', fontSize: 14, display: 'grid', placeItems: 'center',
                      }}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {items.length > 0 && (
            <div style={{ padding: 20, borderTop: '1px solid #e6edf4' }}>
              {/* anyPoint */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <input className="field" type="number" placeholder="Nhập anyPoint" value={points} onChange={e => setPoints(e.target.value)}
                  style={{ maxWidth: 200, minHeight: 42 }} />
                <button className="btn btn--yellow" style={{ padding: '10px 18px' }} onClick={() => setPoints(String(user.walletM ?? 0))}>
                  Dùng hết
                </button>
                {user.walletM != null && <span style={{ color: '#6d7a8a', fontSize: 13 }}>Bạn đang có <strong style={{ color: '#008244' }}>{user.walletM}</strong> anyPoint</span>}
              </div>
              {/* Coupon */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: 13, color: '#6d7a8a', marginBottom: 5 }}>Mã giảm giá</label>
                  <input className="field" type="text" placeholder="Nhập mã giảm giá" value={coupon} onChange={e => setCoupon(e.target.value)}
                    style={{ maxWidth: 200, minHeight: 42 }} />
                </div>
                <button className="btn btn--yellow" style={{ padding: '10px 18px', marginTop: 22 }}>Áp dụng</button>
              </div>
              {/* Tổng */}
              <div style={{ fontWeight: 900, fontSize: 16, color: '#17212f' }}>
                TỔNG TIỀN: <span style={{ color: '#e73348', fontSize: 18 }}>{formatPrice(total)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Phương thức thanh toán */}
        {items.length > 0 && (
          <div style={{ background: 'white', border: '1px solid #e6edf4', borderRadius: 20, marginBottom: 16, overflow: 'hidden' }}>
            <div style={{ background: '#f7fafc', borderBottom: '1px solid #e6edf4', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>💳</span>
              <span style={{ fontWeight: 900, color: '#17212f' }}>Phương thức Thanh toán</span>
            </div>
            <div style={{ padding: '20px' }}>
              {PAYMENT_METHODS.map(m => (
                <label key={m.value} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, cursor: 'pointer' }}>
                  <input type="radio" name="payment" value={m.value} checked={paymentMethod === m.value}
                    onChange={() => setPaymentMethod(m.value)} style={{ accentColor: '#00a651' }} />
                  <span style={{ fontSize: 15, color: '#17212f', lineHeight: 1.4 }}>{m.label}</span>
                </label>
              ))}

              <div style={{ borderTop: '1px solid #e6edf4', paddingTop: 16, marginTop: 8 }}>
                {error && <div style={{ background: '#fff5f5', border: '1px solid #ffc9c9', borderRadius: 10, padding: '10px 14px', marginBottom: 14, color: '#e73348', fontSize: 14 }}>{error}</div>}
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 20, cursor: 'pointer' }}>
                  <input type="checkbox" checked={agreedTerms} onChange={e => setAgreedTerms(e.target.checked)} style={{ marginTop: 2, accentColor: '#00a651' }} />
                  <span style={{ fontSize: 13, color: '#6d7a8a', lineHeight: 1.5 }}>
                    Tôi đồng ý với điều khoản thanh toán và{' '}
                    <Link href="/terms" target="_blank" style={{ color: '#00539b', fontWeight: 700 }}>chính sách bảo mật</Link>
                    {' '}của Công ty
                  </span>
                </label>
                <button onClick={handleCheckout} className="btn btn--green" disabled={submitting}
                  style={{ width: '100%', fontSize: 17, padding: 16 }}>
                  {submitting ? 'Đang xử lý...' : 'THANH TOÁN'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
