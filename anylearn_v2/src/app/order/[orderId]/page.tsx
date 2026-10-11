'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { getOrder, initiatePayment, getBankInfo, OrderData, BankInfo, getCourseUrl } from '@/lib/api'
import PaymentMethodSelector from '@/components/PaymentMethodSelector'
import Link from 'next/link'
import CheckCircle from '@/components/CheckCircle'

function formatPrice(p: number) {
  if (!p) return 'Liên hệ'
  if (p >= 1_000_000) return `${(p / 1_000_000).toFixed(1).replace('.0', '')} triệu`
  return p.toLocaleString('vi-VN') + ' đ'
}

const PAYMENT_INSTRUCTIONS: Record<string, { title: string; steps: string[] }> = {
  bank_transfer: {
    title: 'Hướng dẫn chuyển khoản',
    steps: [
      'Chuyển khoản đến tài khoản: MB Bank - 0123456789 - CÔNG TY ANYLEARN',
      'Nội dung chuyển khoản: [Họ tên] + [Số điện thoại]',
      'Sau khi chuyển khoản, vui lòng gửi ảnh xác nhận qua Zalo: 0909xxxxxx',
    ],
  },
  card: { title: 'Thanh toán thẻ OnePay', steps: ['Giao dịch đang được xử lý. Vui lòng kiểm tra email xác nhận.'] },
  vnpay: { title: 'Thanh toán VNPay', steps: ['Giao dịch đang được xử lý. Vui lòng kiểm tra email xác nhận.'] },
  momo: { title: 'Thanh toán MoMo', steps: ['Giao dịch đang được xử lý. Vui lòng kiểm tra email xác nhận.'] },
  installment: { title: 'Đăng ký trả góp', steps: ['Đội ngũ anyLEARN sẽ liên hệ trong vòng 24h để hỗ trợ đăng ký trả góp 0% lãi suất.'] },
}

export default function OrderPage() {
  const { user, token, isAuthLoading } = useAuth()
  const router = useRouter()
  const { orderId } = useParams<{ orderId: string }>()
  const searchParams = useSearchParams()
  const paymentStatus = searchParams.get('status') // 'success' | 'fail' | 'pending' | null
  const isPending = paymentStatus === 'pending'  // đến từ checkout, chưa thanh toán lần nào
  const isFail = paymentStatus === 'fail'        // đến từ gateway sau khi thanh toán thất bại
  const [order, setOrder] = useState<OrderData | null>(null)
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [retrying, setRetrying] = useState(false)
  const [retryError, setRetryError] = useState('')
  const [retryMethod, setRetryMethod] = useState('bank_transfer')

  const handleRetry = async () => {
    if (!token) return
    setRetrying(true)
    setRetryError('')
    const { data, error } = await initiatePayment(orderId, token, retryMethod)
    setRetrying(false)
    if (error) { setRetryError(error); return }

    if (retryMethod === 'bank_transfer') {
      // Ghi nhận pay_pending, chuyển về trang hướng dẫn chuyển khoản
      window.location.href = `/order/${orderId}`
      return
    }
    if (!data?.redirectUrl) { setRetryError('Không thể khởi tạo thanh toán'); return }
    window.location.href = data.redirectUrl
  }

  useEffect(() => {
    if (!token) return
    Promise.all([
      getOrder(orderId, token),
      getBankInfo(),
    ]).then(([orderData, bank]) => {
      setOrder(orderData)
      setBankInfo(bank)
      setLoading(false)
    })
  }, [token, orderId])

  if (isAuthLoading) return null
  if (!user) { router.push('/login'); return null }

  const instructions = order?.paymentMethod ? PAYMENT_INSTRUCTIONS[order.paymentMethod] : null

  return (
    <div className="section">
      <div className="container text-center">
        {loading ? (
          <p className="text-muted">Đang tải...</p>
        ) : !order ? (
          <div>
            <p className="text-red mb-4">Không tìm thấy đơn hàng</p>
            <Link href="/" className="btn btn--outline">Về trang chủ</Link>
          </div>
        ) : (isFail || isPending) ? (
          <>
            <div className="text-[64px] mb-4">{isFail ? '❌' : '🔔'}</div>
            <h1 className={`text-[28px] font-black mb-2 ${isFail ? 'text-red' : 'text-ink'}`}>
              {isFail ? 'Thanh toán thất bại' : 'Tiếp tục thanh toán'}
            </h1>
            <p className="text-muted mb-6">
              {isFail
                ? 'Giao dịch không thành công hoặc đã bị hủy. Chọn phương thức khác để thử lại.'
                : 'Đơn hàng chưa được thanh toán. Vui lòng chọn một phương thức bên dưới.'}
            </p>

            {order.items.length > 0 && (
              <div className="bg-white border border-line rounded-card mb-4 overflow-hidden text-left">
                <div className="bg-bg border-b border-line py-3 px-5 font-black text-ink">Khóa học trong đơn</div>
                {order.items.map((item, i) => (
                  <div key={item.itemId} className={`flex gap-3 py-3 px-5 items-center ${i < order.items.length - 1 ? 'border-b border-[#f0f0f0]' : ''}`}>
                    {item.image && <img src={item.image} alt={item.title} className="w-11 h-11 object-cover rounded-lg shrink-0" />}
                    <span className="text-sm font-bold text-ink">{item.title}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Payment method selector */}
            <div className="bg-white border border-line rounded-card mb-4 p-5 text-left">
              <p className="font-bold text-ink mb-3">Chọn phương thức thanh toán</p>
              <PaymentMethodSelector
                total={order.items.reduce((s, i) => s + i.price, 0)}
                value={retryMethod}
                onChange={setRetryMethod}
                name="retryMethod"
              />
            </div>

            {retryError && <p className="text-red text-sm mb-3">{retryError}</p>}
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={handleRetry} className="btn btn--green" disabled={retrying}>
                {retrying ? 'Đang xử lý...' : 'Thử lại thanh toán'}
              </button>
              <Link href="/" className="btn btn--outline">Về trang chủ</Link>
            </div>
          </>
        ) : (
          /* Success or bank_transfer pending */
          <>
            <div className="mb-4 flex justify-center"><CheckCircle size={64} /></div>
            <h1 className="text-[28px] font-black text-ink mb-2">
              {paymentStatus === 'success' ? 'Thanh toán thành công!' : 'Đặt hàng thành công!'}
            </h1>
            <p className="text-muted mb-8">
              {paymentStatus === 'success'
                ? 'Cảm ơn bạn đã thanh toán. Đăng ký của bạn đã được xác nhận.'
                : 'Cảm ơn bạn đã tin tưởng anyLEARN. Vui lòng hoàn tất thanh toán để xác nhận đăng ký.'}
            </p>

            {/* Danh sách khóa học đã đặt */}
            <div className="bg-white border border-line rounded-card mb-5 overflow-hidden text-left">
              <div className="bg-bg border-b border-line py-3 px-5 font-black text-ink">
                Khóa học đã đặt
              </div>
              {order.items.map((item, i) => (
                <div key={item.itemId} className={`flex gap-3.5 py-3.5 px-5 items-center ${i < order.items.length - 1 ? 'border-b border-[#f0f0f0]' : ''}`}>
                  {item.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt={item.title} className="w-14 h-14 object-cover rounded-xl shrink-0" />
                  )}
                  <div className="flex-1">
                    <Link href={getCourseUrl({ id: item.itemId, seoUrl: item.seoUrl })} className="font-black text-green-dark text-[15px] no-underline leading-tight block">
                      {item.title}
                      {item.studentName && <span className="text-muted font-normal text-sm"> ({item.studentName})</span>}
                    </Link>
                    {(item.scheduleTitle || item.scheduleTime) && (
                      <div className="text-xs text-[#00539b] mt-[3px]">
                        {[item.scheduleTitle, item.scheduleTime].filter(Boolean).join(' · ')}
                      </div>
                    )}
                    {item.activities && item.activities.length > 0 && (
                      <div className="text-xs text-[#008244] mt-[3px] flex gap-2 flex-wrap">
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
                  <div className="font-black text-red text-[15px]">{formatPrice(item.price)}</div>
                </div>
              ))}
            </div>

            {/* Hướng dẫn chuyển khoản từ config */}
            {order.paymentMethod === 'bank_transfer' && bankInfo && (
              <div className="bg-blue-soft border border-[#d8e9f8] rounded-card p-5 mb-6 text-left">
                <h3 className="m-0 mb-3 font-black text-blue text-base">Hướng dẫn chuyển khoản</h3>
                <ol className="m-0 pl-5">
                  <li className="text-text text-sm leading-[1.7] mb-1">
                    Chuyển khoản đến tài khoản: <strong>{bankInfo.bankName} - {bankInfo.accountNumber} - {bankInfo.accountName}</strong>
                  </li>
                  <li className="text-text text-sm leading-[1.7] mb-1">
                    Nội dung chuyển khoản: <strong>{bankInfo.transferContent}</strong>
                  </li>
                  <li className="text-text text-sm leading-[1.7] mb-1">
                    Sau khi chuyển khoản, vui lòng gửi ảnh xác nhận qua Zalo: <strong>{bankInfo.zaloPhone}</strong>
                  </li>
                </ol>
              </div>
            )}

            {/* Hướng dẫn cho các phương thức khác */}
            {order.paymentMethod !== 'bank_transfer' && instructions && (
              <div className="bg-blue-soft border border-[#d8e9f8] rounded-card p-5 mb-6 text-left">
                <h3 className="m-0 mb-3 font-black text-blue text-base">{instructions.title}</h3>
                <ol className="m-0 pl-5">
                  {instructions.steps.map((step, i) => (
                    <li key={i} className="text-text text-sm leading-[1.7] mb-1">{step}</li>
                  ))}
                </ol>
              </div>
            )}

            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/" className="btn btn--outline">Về trang chủ</Link>
              <Link href="/search" className="btn btn--green">Tìm thêm khóa học</Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
