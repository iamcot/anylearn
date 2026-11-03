'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  getCart, removeCartItem, checkout, initiatePayment, getPendingOrders, cancelOrder, saveChild, updateProfile,
  type CartItem, type PendingOrder,
} from '@/lib/api'
import { formatExactPrice } from '@/lib/format/price'
import { calcCheckoutTotals, maxUsablePoints, pointsToApply, type PointsChoice } from '@/lib/checkout/totals'
import UsePointsToggle from '@/components/cart/UsePointsToggle'
import DuplicateOrderModal from '@/components/orders/DuplicateOrderModal'
import { findDuplicateForCart } from '@/lib/orders/pendingOrders'
import { refreshPendingOrders } from '@/components/orders/pendingOrdersStore'
import PaymentMethodSelector from '@/components/PaymentMethodSelector'
import SectionCard from '@/components/SectionCard'
import OrderLine from '@/components/cart/OrderLine'
import { addLearnerHref, addLearnerLineIds } from '@/lib/cart/learners'
import { cartRewardLabel, sumCartPoints } from '@/lib/points/reward'
import { PRICE_GUARANTEE_LINE } from '@/config/promise'
import VoucherPicker, { type VoucherChoice } from '@/components/vouchers/VoucherPicker'
import LearnerDobForm from '@/components/cart/LearnerDobForm'
import { learnersMissingFullDob, nextLearnerMessage, type LearnerNeedingDob } from '@/lib/checkout/learnerDob'
import { useToast } from '@/components/ToastProvider'
import { FormPageSkeleton, ListSkeleton } from '@/components/PageSkeleton'
import { CardIcon, CartIcon, CheckIcon, ClockIcon, CloseIcon, CoinIcon, GiftIcon } from '@/components/icons'

const REMOVE_BUTTON_CLASS = 'grid size-11 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-red hover:bg-red-soft'

function TotalRow({ label, value, discount = false }: { label: string; value: number; discount?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-muted">{label}</span>
      <span className={discount ? 'text-green-dark' : 'text-ink'}>{discount ? '−' : ''}{formatExactPrice(value)}</span>
    </div>
  )
}

// Where the person pays, amounts are exact ("1.500.000 đ"), never rounded to "1.5 triệu".
function TotalsSummary({ subtotal, familyDiscount, pointsDiscount, voucherDiscount, voucherCode, finalTotal, pointsToEarn }: {
  subtotal: number
  familyDiscount: number
  pointsDiscount: number
  voucherDiscount: number
  voucherCode?: string
  finalTotal: number
  pointsToEarn: number
}) {
  return (
    <div className="flex flex-col gap-1.5 border-t border-line px-4 py-4 sm:px-5">
      <TotalRow label="Tạm tính" value={subtotal} />
      {familyDiscount > 0 && <TotalRow label="Ưu đãi gia đình (bé thứ 2 trở lên)" value={familyDiscount} discount />}
      {pointsDiscount > 0 && <TotalRow label="Dùng anyPoint" value={pointsDiscount} discount />}
      {voucherDiscount > 0 && <TotalRow label={voucherCode ? `Voucher: ${voucherCode}` : 'Voucher'} value={voucherDiscount} discount />}
      <div className="mt-1 flex items-baseline justify-between gap-3 border-t border-dashed border-line pt-2.5">
        <span className="text-sm font-bold text-ink">Tổng thanh toán</span>
        <span className="text-xl font-extrabold text-red">{formatExactPrice(finalTotal)}</span>
      </div>
      <div className="mt-1 flex items-center gap-1.5 text-sm text-green-dark">
        <CheckIcon className="size-4 text-green" />
        {PRICE_GUARANTEE_LINE}
      </div>
      {pointsToEarn > 0 && (
        <div className="flex items-center gap-1.5 text-sm text-green-dark">
          <CoinIcon className="size-4 text-green" />
          {cartRewardLabel(pointsToEarn)}
        </div>
      )}
    </div>
  )
}

export default function CheckoutPage() {
  const { user, token, refreshCartCount, refreshUser, isAuthLoading } = useAuth()
  const router = useRouter()
  const toast = useToast()
  const [items, setItems] = useState<CartItem[]>([])
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [duplicateOrder, setDuplicateOrder] = useState<PendingOrder | null>(null)
  const [agreedTerms, setAgreedTerms] = useState(true)

  const [pointsChoice, setPointsChoice] = useState<PointsChoice>({ on: false, custom: null })
  const [voucher, setVoucher] = useState<VoucherChoice | null>(null)
  const [savingDobFor, setSavingDobFor] = useState<number | null>(null)

  useEffect(() => {
    if (!isAuthLoading && !user) router.push('/login')
  }, [isAuthLoading, user, router])

  useEffect(() => {
    if (!token) return
    Promise.all([getCart(token), getPendingOrders(token)]).then(([cartData, pendingData]) => {
      setItems(cartData)
      setPendingOrders(pendingData)
      setLoading(false)
    })
  }, [token])

  if (isAuthLoading) return <FormPageSkeleton />
  if (!user) return null

  const grossSubtotal = items.reduce((sum, item) => sum + item.price, 0)
  const familyDiscount = items.reduce((sum, item) => sum + (item.familyDiscount ?? 0), 0)
  const subtotal = grossSubtotal - familyDiscount
  const walletPoints = user.walletC ?? 0
  const voucherValue = voucher?.discount ?? 0
  const maxPoints = maxUsablePoints(walletPoints, subtotal, voucherValue)
  const pointsApplied = pointsToApply(pointsChoice, maxPoints)
  const { pointsDiscount, voucherDiscount, finalTotal } = calcCheckoutTotals(subtotal, pointsApplied, voucherValue)
  const learnersMissingDob = learnersMissingFullDob(items)

  const handleRemove = async (id: number) => {
    if (!token) return
    await removeCartItem(id, token)
    setItems(prev => prev.filter(item => item.cartItemId !== id))
    await refreshCartCount()
  }

  const handleCancelPending = async (orderId: string) => {
    if (!token) return
    await cancelOrder(orderId, token)
    setPendingOrders(prev => prev.filter(order => order.orderId !== orderId))
    refreshPendingOrders(token, true)
    toast({ kind: 'success', text: 'Đã hủy đơn hàng' })
  }

  const handleSaveDob = async (learner: LearnerNeedingDob, dob: string) => {
    if (!token) return
    setSavingDobFor(learner.learnerId)
    const { error: err } = learner.childId === null
      ? await updateProfile({ dob }, token)
      : await saveChild({ id: learner.childId, name: learner.name, dob, dobYearOnly: false }, token)
    if (err) {
      setSavingDobFor(null)
      toast({ kind: 'error', text: err })
      return
    }
    setItems(await getCart(token))
    setSavingDobFor(null)
    toast({ kind: 'success', text: `Đã lưu ngày sinh của ${learner.name}` })
  }

  const handleCheckout = async (ignoreDuplicate = false) => {
    if (!agreedTerms) { setError('Vui lòng đồng ý với điều khoản thanh toán'); return }
    if (!token) return
    if (learnersMissingDob.length > 0) { setError(nextLearnerMessage(learnersMissingDob)); return }
    const duplicate = findDuplicateForCart(pendingOrders, items)
    if (duplicate && !ignoreDuplicate) { setDuplicateOrder(duplicate); return }
    setDuplicateOrder(null)
    setSubmitting(true)
    setError('')
    const { data, error: err } = await checkout({
      paymentMethod,
      voucherId: voucher?.walletId,
      couponCode: voucher && !voucher.walletId ? voucher.code : undefined,
      pointsUsed: pointsApplied > 0 ? pointsApplied : undefined,
    }, token)
    if (err || !data) {
      setError(err || 'Thanh toán thất bại')
      setSubmitting(false)
      // The server may have refused for a missing date of birth: reload the cart so the form for that learner shows.
      setItems(await getCart(token))
      return
    }

    // walletC may have been deducted
    await refreshUser()

    // Always call initiatePayment: it sets the order to pay_pending and returns a redirectUrl when a gateway is used.
    const { data: payData, error: payErr } = await initiatePayment(data.orderId, token)
    setSubmitting(false)
    if (payErr) { setError(payErr || 'Không thể khởi tạo thanh toán'); return }
    await refreshCartCount()
    refreshPendingOrders(token, true)

    if (payData?.redirectUrl) {
      window.location.assign(payData.redirectUrl)
    } else {
      router.push(`/order/${data.orderId}`)
    }
  }

  const addLearnerIds = addLearnerLineIds(items)

  return (
    <div className="section section--soft py-6 lg:py-10">
      <div className="container max-w-[900px]">

        <SectionCard
          icon={<CartIcon className="size-5" />}
          title="Đơn hàng của bạn"
          action={
            <Link href="/search" className="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap text-[13px] font-bold text-green-dark no-underline hover:underline sm:text-sm">
              + Thêm khóa học<span className="hidden sm:inline">&nbsp;khác</span>
            </Link>
          }
        >
          {loading ? (
            <div className="p-5"><ListSkeleton showTitle={false} /></div>
          ) : items.length === 0 ? (
            <div className="p-5 text-center">
              <p className="mb-4 mt-0 text-muted">Giỏ hàng trống</p>
              <Link href="/search" className="btn btn--green no-underline">Tìm khóa học</Link>
            </div>
          ) : (
            <>
              <ul className="m-0 list-none p-0">
                {items.map(item => (
                  <OrderLine
                    key={item.cartItemId}
                    item={item}
                    learnerAction={addLearnerIds.has(item.cartItemId) && (
                      <Link href={addLearnerHref(item.itemId)} className="inline-flex min-h-8 items-center text-xs font-bold text-green-dark no-underline hover:underline">
                        + Thêm người học
                      </Link>
                    )}
                    action={
                      <button type="button" aria-label={`Xóa ${item.title} khỏi giỏ`} onClick={() => handleRemove(item.cartItemId)} className={REMOVE_BUTTON_CLASS}>
                        <CloseIcon className="size-5" />
                      </button>
                    }
                  />
                ))}
              </ul>

              <div className="flex items-center gap-2 border-y border-line bg-bg px-5 py-2.5 text-muted">
                <GiftIcon className="size-4" />
                <span className="text-sm font-bold">Dùng anyPoint & Voucher</span>
              </div>

              <div className="flex flex-col gap-4 px-4 py-4 sm:px-5">
                <UsePointsToggle
                  balance={walletPoints}
                  maxPoints={maxPoints}
                  applied={pointsApplied}
                  on={pointsChoice.on}
                  onToggle={on => setPointsChoice({ on, custom: null })}
                  onCustomPoints={custom => setPointsChoice({ on: true, custom })}
                />
                {token && (
                  <VoucherPicker
                    token={token}
                    cartKey={items.map(item => `${item.cartItemId}:${item.price}:${item.familyDiscount ?? 0}`).join(',')}
                    value={voucher}
                    onChange={setVoucher}
                  />
                )}
              </div>

              <TotalsSummary
                subtotal={grossSubtotal}
                familyDiscount={familyDiscount}
                pointsDiscount={pointsDiscount}
                voucherDiscount={voucherDiscount}
                voucherCode={voucher?.label}
                finalTotal={finalTotal}
                pointsToEarn={sumCartPoints(items)}
              />
            </>
          )}
        </SectionCard>

        {!loading && items.length === 0 && pendingOrders.length > 0 && (
          <section className="mb-4 overflow-hidden rounded-card border border-warn-line bg-white">
            <div className="flex items-center gap-2 border-b border-warn-line bg-warn-soft px-5 py-3.5 text-warn-text">
              <ClockIcon className="size-5" />
              <h2 className="m-0 text-base font-extrabold">Đơn hàng chờ thanh toán</h2>
            </div>
            {pendingOrders.map(order => (
              <div key={order.orderId} className="flex flex-wrap items-center gap-3 border-b border-warn-line px-4 py-3.5 last:border-b-0 sm:px-5">
                <div className="min-w-[180px] flex-1">
                  <div className="mb-1 text-sm font-bold text-ink">{order.items.map(item => item.title).join(', ')}</div>
                  <div className="text-xs text-muted">{formatExactPrice(order.amount)} · {order.items.length} khóa học</div>
                </div>
                <Link href={`/order/${order.orderId}?status=pending`} className="btn btn--green min-h-11 whitespace-nowrap px-4 py-2 text-xs no-underline">
                  Tiếp tục thanh toán
                </Link>
                <button type="button" aria-label="Hủy đơn hàng" onClick={() => handleCancelPending(order.orderId)} className={REMOVE_BUTTON_CLASS}>
                  <CloseIcon className="size-5" />
                </button>
              </div>
            ))}
          </section>
        )}

        {items.length > 0 && (
          <SectionCard icon={<CardIcon className="size-5" />} title="Phương thức thanh toán">
            <div className="p-4 sm:p-5">
              {learnersMissingDob.length > 0 && (
                <div className="mb-4 flex flex-col gap-3">
                  <p className="m-0 text-sm text-text">Trước khi thanh toán, anyLEARN cần ngày sinh đầy đủ của người học để kiểm tra độ tuổi và lập hồ sơ.</p>
                  {learnersMissingDob.map(learner => (
                    <LearnerDobForm
                      key={learner.learnerId}
                      learner={learner}
                      saving={savingDobFor === learner.learnerId}
                      onSave={dob => handleSaveDob(learner, dob)}
                    />
                  ))}
                </div>
              )}
              <PaymentMethodSelector total={subtotal} value={paymentMethod} onChange={setPaymentMethod} />
              <div className="mt-4 border-t border-line pt-4">
                {error && <div className="mb-3.5 rounded-xl border border-red-line bg-red-soft px-3.5 py-2.5 text-sm text-red">{error}</div>}
                <label className="mb-5 flex cursor-pointer items-start gap-2.5">
                  <input type="checkbox" checked={agreedTerms} onChange={event => setAgreedTerms(event.target.checked)} className="mt-0.5 size-4 accent-green" />
                  <span className="text-xs leading-normal text-muted">
                    Tôi đồng ý với điều khoản thanh toán và{' '}
                    <Link href="/terms" target="_blank" className="font-bold text-blue">chính sách bảo mật</Link>
                    {' '}của Công ty
                  </span>
                </label>
                <button type="button" onClick={() => handleCheckout()} className="btn btn--green w-full p-4 text-[17px]" disabled={submitting || learnersMissingDob.length > 0}>
                  {submitting ? 'Đang xử lý...' : 'THANH TOÁN'}
                </button>
                {duplicateOrder && (
                  <DuplicateOrderModal order={duplicateOrder} onCreateNew={() => handleCheckout(true)} onClose={() => setDuplicateOrder(null)} />
                )}
              </div>
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  )
}
