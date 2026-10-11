'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { getCart, removeCartItem, checkout, initiatePayment, getPendingOrders, cancelOrder, checkVoucher, CartItem, PendingOrder, VoucherResult } from '@/lib/api'
import PaymentMethodSelector from '@/components/PaymentMethodSelector'
import Link from 'next/link'

function formatPrice(p: number) {
  if (!p) return 'Liên hệ'
  if (p >= 1_000_000) return `${(p / 1_000_000).toFixed(1).replace('.0', '')} triệu`
  return p.toLocaleString('vi-VN') + ' đ'
}

export default function CheckoutPage() {
  const { user, token, refreshCartCount, refreshUser, isAuthLoading } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState<CartItem[]>([])
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [coupon, setCoupon] = useState('')
  const [points, setPoints] = useState('')
  const [agreedTerms, setAgreedTerms] = useState(true)

  // Discount state
  const [pointsApplied, setPointsApplied] = useState(0)
  const [voucherResult, setVoucherResult] = useState<VoucherResult | null>(null)
  const [voucherError, setVoucherError] = useState('')
  const [voucherLoading, setVoucherLoading] = useState(false)

  useEffect(() => {
    if (!token) return
    Promise.all([
      getCart(token),
      getPendingOrders(token),
    ]).then(([cartData, pendingData]) => {
      setItems(cartData)
      setPendingOrders(pendingData)
      setLoading(false)
    })
  }, [token])

  if (isAuthLoading) return null
  if (!user) { router.push('/login'); return null }

  const total = items.reduce((sum, i) => sum + i.price, 0)
  const POINT_RATE = 1000                                              // 1 anyPoint = 1,000 VND
  const pointsDiscount = Math.min(pointsApplied * POINT_RATE, total)
  const voucherDiscount = voucherResult ? Math.min(voucherResult.discountValue, total) : 0
  const finalTotal = Math.max(0, total - pointsDiscount - voucherDiscount)

  const handleRemove = async (id: number) => {
    if (!token) return
    await removeCartItem(id, token)
    setItems(prev => prev.filter(i => i.cartItemId !== id))
    await refreshCartCount()
  }

  const handleApplyPoints = () => {
    const p = parseInt(points) || 0
    if (p <= 0) { setPoints(''); return }
    const capped = Math.min(p, user?.walletC ?? 0)
    setPointsApplied(capped)
    setPoints(String(capped))
    showToast(`Đã áp dụng ${capped.toLocaleString()} anyPoint`)
  }

  const handleApplyCoupon = async () => {
    if (!coupon.trim()) return
    setVoucherLoading(true)
    setVoucherError('')
    setVoucherResult(null)
    const { data, error: err } = await checkVoucher(coupon.trim(), total)
    setVoucherLoading(false)
    if (err || !data) { setVoucherError(err || 'Mã không hợp lệ'); return }
    setVoucherResult(data)
    showToast(data.message)
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleCancelPending = async (orderId: string) => {
    if (!token) return
    await cancelOrder(orderId, token)
    setPendingOrders(prev => prev.filter(o => o.orderId !== orderId))
    showToast('Đã hủy đơn hàng')
  }

  const handleCheckout = async () => {
    if (!agreedTerms) { setError('Vui lòng đồng ý với điều khoản thanh toán'); return }
    if (!token) return
    setSubmitting(true)
    setError('')
    const { data, error: err } = await checkout({ paymentMethod, couponCode: coupon || undefined, pointsUsed: points ? Number(points) : undefined }, token)
    if (err || !data) { setError(err || 'Thanh toán thất bại'); setSubmitting(false); return }

    // Refresh user (walletC may have been deducted)
    await refreshUser()

    // Always call initiatePayment — it sets order to pay_pending and returns redirectUrl if needed
    const { data: payData, error: payErr } = await initiatePayment(data.orderId, token)
    setSubmitting(false)
    if (payErr) { setError(payErr || 'Không thể khởi tạo thanh toán'); return }
    await refreshCartCount()

    if (payData?.redirectUrl) {
      window.location.href = payData.redirectUrl
    } else {
      // bank_transfer: no gateway redirect, go to order page (shows bank info)
      router.push(`/order/${data.orderId}`)
    }
  }

  return (
    <div className="section section--soft">
      <div className="container">

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-ink text-white py-2.5 px-5 rounded-xl text-sm font-semibold z-[9999] shadow-[0_4px_16px_rgba(0,0,0,0.2)] [animation:fadeIn_0.2s_ease]">
            ✓ {toast}
          </div>
        )}

        {/* Đơn hàng */}
        <div className="bg-white border border-line rounded-card mb-4 overflow-hidden">
          <div className="border-b border-line py-3.5 px-5 flex items-center gap-2">
            <span className="text-lg">🛒</span>
            <span className="font-black text-ink">Đơn hàng của bạn</span>
          </div>
          {loading ? (
            <div className="p-5 text-muted">Đang tải...</div>
          ) : items.length === 0 ? (
            <div className="p-5 text-center">
              <p className="text-muted mb-4">Giỏ hàng trống</p>
              <Link href="/search" className="btn btn--green">Tìm khóa học</Link>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-line bg-bg">
                  <td className="py-2.5 px-5 font-bold text-xs text-muted w-[30px]">#</td>
                  <td className="py-2.5 px-0 font-bold text-xs text-muted">Khoá học/Sản phẩm</td>
                  <td className="py-2.5 px-5 font-bold text-xs text-muted text-right">Đơn giá</td>
                  <td className="py-2.5 px-3 w-[40px]"></td>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.cartItemId} className="border-b border-[#f0f0f0]">
                    <td className="py-3.5 px-5 text-muted text-sm align-top">{idx + 1}</td>
                    <td className="py-3.5 px-0 align-top">
                      <div className="flex gap-3 items-start">
                        {item.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.image} alt={item.title} className="w-[60px] h-[60px] object-cover rounded-xl shrink-0" />
                        )}
                        <div>
                          <div className="font-black text-green-dark text-[15px] leading-tight">
                            {item.title}
                            {item.studentName && <span className="text-muted font-normal"> ({item.studentName})</span>}
                          </div>
                          {(item.scheduleTitle || item.scheduleTime) && (
                            <div className="text-xs text-[#00539b] mt-0.5">
                              {[item.scheduleTitle, item.scheduleTime].filter(Boolean).join(' · ')}
                            </div>
                          )}
                          {item.activities && item.activities.length > 0 && (
                            <div className="text-xs text-[#008244] mt-0.5 flex gap-2 flex-wrap">
                              {item.activities.map((a, i) => (
                                <span key={i} className="flex items-center gap-1">
                                  <span style={{color:'#00a651',fontWeight:900}}>✓</span>
                                  {{ trial:'Học thử', test:'Test đầu vào', visit:'Tham quan' }[a.type] ?? a.type}
                                  {a.date ? ` · ${a.date}` : ''}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-right align-top font-bold">{formatPrice(item.price)}</td>
                    <td className="py-3.5 px-3 align-top text-center">
                      <button onClick={() => handleRemove(item.cartItemId)} className="w-8 h-8 rounded-full bg-white border border-red text-red cursor-pointer text-sm grid place-items-center">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {items.length > 0 && (
            <>
              {/* Section header */}
              <div className="border-t border-b border-line bg-bg py-2.5 px-5 flex items-center gap-2">
                <span className="text-sm">🎁</span>
                <span className="text-sm font-bold text-muted">Đổi điểm & Mã khuyến mãi</span>
              </div>

              {/* anyPoint + Coupon */}
              <div className="px-5 py-4 flex flex-col gap-3">
                {/* anyPoint */}
                <div>
                  <div className="flex items-baseline justify-between mb-1">
                    <label className="font-bold text-xs text-muted">anyPoint</label>
                    {user.walletC != null && (
                      <span className="text-xs text-muted">
                        Có <strong className="text-green-dark">{user.walletC}</strong> điểm
                        {user.walletC > 0 && <span className="text-muted"> (~{formatPrice(user.walletC * 1000)})</span>}
                        {' · '}
                        <button className="text-blue font-bold border-0 bg-transparent cursor-pointer p-0 font-[inherit] text-xs"
                          onClick={() => setPoints(String(user.walletC ?? 0))}>Dùng hết</button>
                      </span>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <input className="field w-1/2 py-1.5 text-sm" style={{ minHeight: 'unset' }}
                      type="number" placeholder="Nhập số điểm" value={points}
                      onChange={e => { setPoints(e.target.value); setPointsApplied(0) }} />
                    <button className="w-[88px] rounded-[18px] py-1.5 text-xs font-bold text-ink bg-[#fefce8] border border-[#fde68a] cursor-pointer hover:bg-[#fef9c3] transition-colors shrink-0"
                      onClick={handleApplyPoints}>
                      {pointsApplied > 0 ? '✓ Đã dùng' : 'Dùng điểm'}
                    </button>
                  </div>
                  {pointsApplied > 0 && (
                    <div className="text-right mt-1 text-xs text-green-dark">
                      Giảm {formatPrice(pointsDiscount)} từ anyPoint
                    </div>
                  )}
                </div>

                {/* Coupon — dòng riêng */}
                <div>
                  <label className="block font-bold text-xs text-muted mb-1">Mã giảm giá</label>
                  <div className="flex justify-end gap-2">
                    <input className="field w-1/2 py-1.5 text-sm" style={{ minHeight: 'unset' }}
                      type="text" placeholder="Nhập mã giảm giá" value={coupon}
                      onChange={e => { setCoupon(e.target.value); setVoucherResult(null); setVoucherError('') }} />
                    <button className="w-[88px] rounded-[18px] py-1.5 text-xs font-bold text-ink bg-[#fefce8] border border-[#fde68a] cursor-pointer hover:bg-[#fef9c3] transition-colors shrink-0"
                      onClick={handleApplyCoupon} disabled={voucherLoading}>
                      {voucherLoading ? '...' : voucherResult ? '✓ Đã dùng' : 'Áp dụng'}
                    </button>
                  </div>
                  {voucherResult && (
                    <div className="text-right mt-1 text-xs text-green-dark">
                      Giảm {formatPrice(voucherDiscount)} từ mã {voucherResult.code}
                    </div>
                  )}
                  {voucherError && (
                    <div className="text-right mt-1 text-xs text-red">{voucherError}</div>
                  )}
                </div>
              </div>

              {/* Full-width divider + Total */}
              <div className="border-t border-line flex justify-end px-5 py-4">
                <div className="text-right mr-[52px]">
                  {(pointsDiscount > 0 || voucherDiscount > 0) && (
                    <div className="text-xs text-muted line-through mb-0.5">{formatPrice(total)}</div>
                  )}
                  <div className="text-xs text-muted font-bold uppercase tracking-wide mb-0.5">Tổng tiền</div>
                  <div className="text-xl font-black text-red">{formatPrice(finalTotal)}</div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Đơn hàng chờ thanh toán */}
        {!loading && items.length === 0 && pendingOrders.length > 0 && (
          <div className="bg-white border border-warn-line rounded-card mb-4 overflow-hidden">
            <div className="bg-warn-soft border-b border-warn-line py-3.5 px-5 flex items-center gap-2">
              <span className="text-lg">⏳</span>
              <span className="font-black text-warn-text">Đơn hàng chờ thanh toán</span>
            </div>
            {pendingOrders.map(order => (
              <div key={order.orderId} className="py-3.5 px-5 border-b border-[#fef3c7] flex items-center gap-3.5">
                <div className="flex-1">
                  <div className="font-bold text-sm text-ink mb-1">
                    {order.items.map(i => i.title).join(', ')}
                  </div>
                  <div className="text-xs text-muted">
                    {formatPrice(order.amount)} · {order.items.length} khóa học
                  </div>
                </div>
                <Link href={`/order/${order.orderId}?status=pending`} className="btn btn--green py-2 px-4 text-xs whitespace-nowrap">
                  Tiếp tục thanh toán
                </Link>
                <button onClick={() => handleCancelPending(order.orderId)} className="w-8 h-8 rounded-full bg-white border border-red text-red cursor-pointer text-sm grid place-items-center shrink-0" title="Hủy đơn hàng">
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Phương thức thanh toán */}
        {items.length > 0 && (
          <div className="bg-white border border-line rounded-card mb-4 overflow-hidden">
            <div className="bg-white border-b border-line py-3.5 px-5 flex items-center gap-2">
              <span className="text-lg">💳</span>
              <span className="font-black text-ink">Phương thức Thanh toán</span>
            </div>
            <div className="p-5">
              <PaymentMethodSelector total={total} value={paymentMethod} onChange={setPaymentMethod} />
              <div className="border-t border-line pt-4 mt-2">
                {error && <div className="bg-red-soft border border-[#ffc9c9] rounded-xl py-2.5 px-3.5 mb-3.5 text-red text-sm">{error}</div>}
                <label className="flex items-start gap-2.5 mb-5 cursor-pointer">
                  <input type="checkbox" checked={agreedTerms} onChange={e => setAgreedTerms(e.target.checked)} className="mt-[2px] accent-green" />
                  <span className="text-xs text-muted leading-normal">
                    Tôi đồng ý với điều khoản thanh toán và{' '}
                    <Link href="/terms" target="_blank" className="text-blue font-bold">chính sách bảo mật</Link>
                    {' '}của Công ty
                  </span>
                </label>
                <button onClick={handleCheckout} className="btn btn--green w-full text-[17px] p-4" disabled={submitting}>
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
