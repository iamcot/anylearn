'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getOrder, initiatePayment, getBankInfo, getCourseUrl, type OrderData, type BankInfo } from '@/lib/api'
import PaymentMethodSelector from '@/components/PaymentMethodSelector'
import CheckCircle from '@/components/CheckCircle'
import OrderLine from '@/components/cart/OrderLine'
import { FormPageSkeleton, ListSkeleton } from '@/components/PageSkeleton'
import { ClockIcon, CloseIcon, CoinIcon } from '@/components/icons'
import BankTransferPanel from '@/components/payment/BankTransferPanel'
import { orderTransferNote } from '@/lib/vietqr/payload'
import { useOrderStatus } from '@/components/payment/useOrderStatus'
import AppPromptCard from '@/components/pwa/AppPromptCard'
import { earnedLabel } from '@/lib/points/reward'
import { formatHoldUntil } from '@/lib/orders/deadline'
import { refreshPendingOrders } from '@/components/orders/pendingOrdersStore'

const GATEWAY_WAIT_STEPS = ['Giao dịch đang được xử lý. Vui lòng kiểm tra email xác nhận.']

const PAYMENT_INSTRUCTIONS: Record<string, { title: string; steps: string[] }> = {
  card: { title: 'Thanh toán thẻ OnePay', steps: GATEWAY_WAIT_STEPS },
  vnpay: { title: 'Thanh toán VNPay', steps: GATEWAY_WAIT_STEPS },
  momo: { title: 'Thanh toán MoMo', steps: GATEWAY_WAIT_STEPS },
  installment: { title: 'Đăng ký trả góp', steps: ['Đội ngũ anyLEARN sẽ liên hệ trong vòng 24h để hỗ trợ đăng ký trả góp 0% lãi suất.'] },
}

function StatusIcon({ failed }: { failed: boolean }) {
  return (
    <div className={`mx-auto mb-4 grid size-16 place-items-center rounded-full ${failed ? 'bg-red-soft text-red' : 'bg-blue-soft text-blue'}`}>
      {failed ? <CloseIcon className="size-8" /> : <ClockIcon className="size-8" />}
    </div>
  )
}

function InstructionBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 rounded-card border border-blue-line bg-blue-soft p-5 text-left">
      <h3 className="m-0 mb-3 text-base font-extrabold text-blue">{title}</h3>
      <ol className="m-0 list-decimal pl-5">{children}</ol>
    </div>
  )
}

function OrderHeading({ awaitingPayment, paid, holdUntil }: { awaitingPayment: boolean; paid: boolean; holdUntil: string | null }) {
  if (awaitingPayment) {
    return (
      <>
        <StatusIcon failed={false} />
        <h1 className="mb-2 text-[28px] font-extrabold text-ink">Vui lòng thanh toán để hoàn tất đăng ký</h1>
        <p className="mb-8 mt-0 text-muted">
          Đơn hàng đã được ghi nhận. Quét mã QR hoặc chuyển khoản theo thông tin bên dưới để hoàn tất đăng ký.
          {holdUntil && ` anyLEARN giữ chỗ đến ${holdUntil}.`}
        </p>
      </>
    )
  }
  return (
    <>
      <div className="mb-4 flex justify-center"><CheckCircle size={64} /></div>
      <h1 className="mb-2 text-[28px] font-extrabold text-ink">{paid ? 'Thanh toán thành công!' : 'Đặt hàng thành công!'}</h1>
      <p className="mb-8 mt-0 text-muted">
        {paid
          ? 'Cảm ơn bạn đã thanh toán. Đăng ký của bạn đã được xác nhận.'
          : 'Cảm ơn bạn đã tin tưởng anyLEARN. Vui lòng hoàn tất thanh toán để xác nhận đăng ký.'}
      </p>
    </>
  )
}

function PointsEarnedNote({ pointsEarned, balance }: { pointsEarned: number; balance?: number }) {
  return (
    <p className="mb-5 mt-0 flex items-center justify-center gap-1.5 text-sm font-medium text-green-dark">
      <CoinIcon className="size-4 text-green" />
      {earnedLabel(pointsEarned, balance)}
    </p>
  )
}

const AWAITING_PAYMENT_STATUSES = ['new', 'pay_pending']

const STEP_CLASS = 'mb-1 text-sm leading-[1.7] text-text'

export default function OrderPage() {
  const { user, token, isAuthLoading, refreshUser } = useAuth()
  const router = useRouter()
  const { orderId } = useParams<{ orderId: string }>()
  const searchParams = useSearchParams()
  const paymentStatus = searchParams.get('status') // 'success' | 'fail' | 'pending' | null
  const isPending = paymentStatus === 'pending'    // from checkout, nothing paid yet
  const isFail = paymentStatus === 'fail'          // back from the gateway after a failed payment
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
      // Order is now pay_pending: show the bank transfer instructions
      window.location.href = `/order/${orderId}`
      return
    }
    if (!data?.redirectUrl) { setRetryError('Không thể khởi tạo thanh toán'); return }
    window.location.href = data.redirectUrl
  }

  useEffect(() => {
    if (!isAuthLoading && !user) router.push('/login')
  }, [isAuthLoading, user, router])

  useEffect(() => {
    if (!token) return
    Promise.all([getOrder(orderId, token), getBankInfo()]).then(([orderData, bank]) => {
      setOrder(orderData)
      setBankInfo(bank)
      setLoading(false)
    })
  }, [token, orderId])

  const isAwaitingBankTransfer = order?.paymentMethod === 'bank_transfer'
    && paymentStatus !== 'success'
    && AWAITING_PAYMENT_STATUSES.includes(order.status ?? '')
  const orderStatus = useOrderStatus(orderId, token, order?.status, isAwaitingBankTransfer)

  useEffect(() => {
    if (orderStatus === 'delivered' && isAwaitingBankTransfer) router.replace(`/order/${orderId}?status=success`)
  }, [orderStatus, isAwaitingBankTransfer, orderId, router])

  const isApproved = paymentStatus === 'success' || order?.status === 'delivered' || orderStatus === 'delivered'
  useEffect(() => {
    if (!token || !isApproved) return
    // The points are credited when the order is approved: read the order and the balance again
    getOrder(orderId, token).then(fresh => fresh && setOrder(fresh))
    refreshUser()
    refreshPendingOrders(token, true)
  }, [token, isApproved, orderId, refreshUser])

  if (isAuthLoading) return <FormPageSkeleton />
  if (!user) return null

  const instructions = order?.paymentMethod ? PAYMENT_INSTRUCTIONS[order.paymentMethod] : null

  return (
    <div className="section py-6 lg:py-10">
      <div className="container max-w-[720px] text-center">
        {loading ? (
          <div className="text-left"><ListSkeleton /></div>
        ) : !order ? (
          <div>
            <p className="mb-4 text-red">Không tìm thấy đơn hàng</p>
            <Link href="/" className="btn btn--outline no-underline">Về trang chủ</Link>
          </div>
        ) : (isFail || isPending) ? (
          <>
            <StatusIcon failed={isFail} />
            <h1 className={`mb-2 text-[28px] font-extrabold ${isFail ? 'text-red' : 'text-ink'}`}>
              {isFail ? 'Thanh toán thất bại' : 'Tiếp tục thanh toán'}
            </h1>
            <p className="mb-6 mt-0 text-muted">
              {isFail
                ? 'Giao dịch không thành công hoặc đã bị hủy. Chọn phương thức khác để thử lại.'
                : 'Đơn hàng chưa được thanh toán. Vui lòng chọn một phương thức bên dưới.'}
            </p>

            {order.items.length > 0 && (
              <section className="mb-4 overflow-hidden rounded-card border border-line bg-white text-left">
                <h2 className="m-0 border-b border-line bg-bg px-5 py-3 text-base font-extrabold text-ink">Khóa học trong đơn</h2>
                <ul className="m-0 list-none p-0">
                  {order.items.map(item => <OrderLine key={item.itemId} item={item} />)}
                </ul>
              </section>
            )}

            <div className="mb-4 rounded-card border border-line bg-white p-4 text-left sm:p-5">
              <p className="mb-3 mt-0 font-bold text-ink">Chọn phương thức thanh toán</p>
              <PaymentMethodSelector
                total={order.items.reduce((sum, item) => sum + item.price, 0)}
                value={retryMethod}
                onChange={setRetryMethod}
                name="retryMethod"
              />
            </div>

            {retryError && <p className="mb-3 mt-0 text-sm text-red">{retryError}</p>}
            <div className="flex flex-wrap justify-center gap-3">
              <button type="button" onClick={handleRetry} className="btn btn--green" disabled={retrying}>
                {retrying ? 'Đang xử lý...' : 'Thử lại thanh toán'}
              </button>
              <Link href="/" className="btn btn--outline no-underline">Về trang chủ</Link>
            </div>
          </>
        ) : (
          <>
            <OrderHeading awaitingPayment={isAwaitingBankTransfer} paid={paymentStatus === 'success'} holdUntil={formatHoldUntil(order.expiresAt)} />

            <section className="mb-5 overflow-hidden rounded-card border border-line bg-white text-left">
              <h2 className="m-0 border-b border-line bg-bg px-5 py-3 text-base font-extrabold text-ink">Khóa học đã đặt</h2>
              <ul className="m-0 list-none p-0">
                {order.items.map(item => (
                  <OrderLine key={item.itemId} item={item} href={getCourseUrl({ id: item.itemId, seoUrl: item.seoUrl })} />
                ))}
              </ul>
            </section>

            {isApproved && (order.pointsEarned ?? 0) > 0 && (
              <PointsEarnedNote pointsEarned={order.pointsEarned ?? 0} balance={user.walletC} />
            )}

            {isAwaitingBankTransfer && bankInfo && (
              <BankTransferPanel note={order.transferNote ?? orderTransferNote(orderId)} amount={order.amount ?? 0} bank={bankInfo} />
            )}

            {order.paymentMethod !== 'bank_transfer' && instructions && (
              <InstructionBox title={instructions.title}>
                {instructions.steps.map((step, index) => <li key={index} className={STEP_CLASS}>{step}</li>)}
              </InstructionBox>
            )}

            {(paymentStatus === 'success' || isAwaitingBankTransfer) && <div className="mb-5"><AppPromptCard context="order" /></div>}

            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/" className="btn btn--outline no-underline">Về trang chủ</Link>
              <Link href="/search" className="btn btn--green no-underline">Tìm thêm khóa học</Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
