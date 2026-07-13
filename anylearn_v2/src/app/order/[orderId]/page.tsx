'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import { getOrder, OrderData, getCourseUrl } from '@/lib/api'
import Link from 'next/link'

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
  card: { title: 'Thanh toán bằng thẻ', steps: ['Đội ngũ anyLEARN sẽ liên hệ để hướng dẫn thanh toán trực tuyến.'] },
  vnpay: { title: 'Thanh toán VNPay', steps: ['Quét mã QR được gửi qua SMS/email để hoàn tất thanh toán.'] },
  installment: { title: 'Đăng ký trả góp', steps: ['Đội ngũ anyLEARN sẽ liên hệ trong vòng 24h để hỗ trợ đăng ký trả góp 0% lãi suất.'] },
}

export default function OrderPage() {
  const { user, token } = useAuth()
  const router = useRouter()
  const { orderId } = useParams<{ orderId: string }>()
  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    getOrder(orderId, token).then(d => { setOrder(d); setLoading(false) })
  }, [token, orderId])

  if (!user) { router.push('/login'); return null }

  const instructions = order?.paymentMethod ? PAYMENT_INSTRUCTIONS[order.paymentMethod] : null

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: 680, textAlign: 'center' }}>
        {loading ? (
          <p style={{ color: '#6d7a8a' }}>Đang tải...</p>
        ) : !order ? (
          <div>
            <p style={{ color: '#e73348', marginBottom: 16 }}>Không tìm thấy đơn hàng</p>
            <Link href="/" className="btn btn--outline">Về trang chủ</Link>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#17212f', marginBottom: 8 }}>Đặt hàng thành công!</h1>
            <p style={{ color: '#6d7a8a', marginBottom: 32 }}>Cảm ơn bạn đã tin tưởng anyLEARN. Vui lòng hoàn tất thanh toán để xác nhận đăng ký.</p>

            {/* Danh sách khóa học đã đặt */}
            <div style={{ background: 'white', border: '1px solid #e6edf4', borderRadius: 20, marginBottom: 20, overflow: 'hidden', textAlign: 'left' }}>
              <div style={{ background: '#f7fafc', borderBottom: '1px solid #e6edf4', padding: '12px 20px', fontWeight: 900, color: '#17212f' }}>
                Khóa học đã đặt
              </div>
              {order.items.map((item, i) => (
                <div key={item.itemId} style={{ display: 'flex', gap: 14, padding: '14px 20px', borderBottom: i < order.items.length - 1 ? '1px solid #f0f0f0' : undefined, alignItems: 'center' }}>
                  {item.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt={item.title} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <Link href={getCourseUrl({ id: item.itemId, seoUrl: item.seoUrl })} style={{ fontWeight: 900, color: '#008244', fontSize: 15, textDecoration: 'none', lineHeight: 1.3, display: 'block' }}>
                      {item.title}
                    </Link>
                    {item.dateStart && <div style={{ fontSize: 13, color: '#6d7a8a', marginTop: 3 }}>Bắt đầu: {new Date(item.dateStart).toLocaleDateString('vi-VN')}</div>}
                  </div>
                  <div style={{ fontWeight: 900, color: '#e73348', fontSize: 15 }}>{formatPrice(item.price)}</div>
                </div>
              ))}
            </div>

            {/* Hướng dẫn thanh toán */}
            {instructions && (
              <div style={{ background: '#eef7ff', border: '1px solid #d8e9f8', borderRadius: 20, padding: 20, marginBottom: 24, textAlign: 'left' }}>
                <h3 style={{ margin: '0 0 12px', fontWeight: 900, color: '#00539b', fontSize: 16 }}>{instructions.title}</h3>
                <ol style={{ margin: 0, paddingLeft: 20 }}>
                  {instructions.steps.map((step, i) => (
                    <li key={i} style={{ color: '#2f3b4a', fontSize: 14, lineHeight: 1.7, marginBottom: 4 }}>{step}</li>
                  ))}
                </ol>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/" className="btn btn--outline">Về trang chủ</Link>
              <Link href="/search" className="btn btn--green">Tìm thêm khóa học</Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
