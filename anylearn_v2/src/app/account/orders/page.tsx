'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { getUserOrders, cancelOrder, getCourseUrl, getUserItemCodes, type ItemCode, type UserOrder } from '@/lib/api'
import { getMyVideoCourses, type MyVideoCourse } from '@/lib/api/learn'
import { learnHref } from '@/lib/learn/rules'
import OrderItemRating from '@/components/OrderItemRating'
import Modal from '@/components/Modal'
import ItemCodeLines from '@/components/account/ItemCodeLines'
import FavoriteCourses from '@/components/account/FavoriteCourses'
import { KeyIcon, PlayIcon } from '@/components/icons'
import AccountCard from '@/components/account/AccountCard'
import Badge, { type BadgeTone } from '@/components/Badge'
import { formatPrice } from '@/lib/format/price'
import { formatDate } from '@/lib/format/date'
import { ListSkeleton } from '@/components/PageSkeleton'
import { useToast } from '@/components/ToastProvider'
import { refreshPendingOrders } from '@/components/orders/pendingOrdersStore'
import { ORDER_TABS, defaultOrderTab, orderTab, type OrderTab } from '@/lib/orders/tabs'
import { GUEST_CHIP_OFF, GUEST_CHIP_ON } from '@/components/guest/chipStyles'

const UNPAID_STATUSES = new Set(['new', 'pay_pending'])

const STATUS_LABELS: Record<string, { label: string; tone: BadgeTone }> = {
  new:           { label: 'Mới',            tone: 'neutral' },
  pay_pending:   { label: 'Chờ thanh toán', tone: 'warning' },
  delivered:     { label: 'Đã thanh toán',  tone: 'success' },
  cancel_buyer:  { label: 'Đã hủy',         tone: 'danger' },
  cancel_system: { label: 'Đã hủy',         tone: 'danger' },
  cancel_seller: { label: 'Đã hủy',         tone: 'danger' },
  paid:          { label: 'Đã thanh toán',  tone: 'success' },
  refund:        { label: 'Hoàn tiền',      tone: 'info' },
}

const PAYMENT_LABELS: Record<string, string> = {
  bank_transfer: 'Chuyển khoản',
  card:          'Thẻ OnePay',
  vnpay:         'VNPay QR',
  momo:          'Ví MoMo',
  installment:   'Trả góp',
}

const ROW_BUTTON = 'inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-xs font-bold no-underline'

/** Progress, self-study plan and the "Đi học" button of a video course, under its title. */
function VideoRow({ course }: { course: MyVideoCourse }) {
  return (
    <>
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full bg-green" style={{ width: `${course.percent}%` }} /></div>
        <span className="shrink-0 text-xs font-bold text-green-dark">{course.percent}%</span>
      </div>
      {course.plan?.enabled && <div className="mt-1 text-xs text-muted">Lịch tự học: {course.plan.text}</div>}
    </>
  )
}

function GoLearn({ course }: { course: MyVideoCourse }) {
  return (
    <Link href={learnHref(course.itemId, course.resumeLessonId, course.learnerId)} className={`${ROW_BUTTON} bg-green text-white hover:opacity-90`}>
      <PlayIcon className="size-3.5" /> Đi học
    </Link>
  )
}

function ShowCodes({ onOpen }: { onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className={`${ROW_BUTTON} cursor-pointer border-0 bg-blue text-white hover:opacity-90`}>
      <KeyIcon className="size-3.5" /> Xem mã code
    </button>
  )
}

function OrdersContent() {
  const { token } = useAuth()
  const searchParams = useSearchParams()
  const toast = useToast()
  const [orders, setOrders] = useState<UserOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [pickedTab, setPickedTab] = useState<OrderTab | null>(null)
  const [videos, setVideos] = useState<MyVideoCourse[]>([])
  const [codes, setCodes] = useState<ItemCode[]>([])
  const [codesFor, setCodesFor] = useState<{ title: string; codes: ItemCode[] } | null>(null)

  useEffect(() => {
    if (!token) return
    getUserOrders(token).then(data => { setOrders(data); setLoading(false) })
    getMyVideoCourses(token).then(res => setVideos(res.data ?? []))
    getUserItemCodes(token).then(setCodes)
  }, [token])

  // A paid line shows its video progress or its codes; a video of the line's learner first, else any learner's.
  const videoOf = (itemId: number, learnerId?: number) =>
    videos.find(v => v.itemId === itemId && v.learnerId === learnerId) ?? videos.find(v => v.itemId === itemId)
  const codesOf = (itemId: number) => codes.filter(c => c.itemId === itemId)
  const paidItemIds = new Set(orders.filter(order => orderTab(order.status) === 'completed').flatMap(order => order.items.map(item => item.itemId)))
  // Courses the person has without a paid order here (given by anyLEARN, for example).
  const otherVideos = videos.filter(v => !paidItemIds.has(v.itemId))
  const otherCodes = Array.from(new Map(codes.filter(c => !paidItemIds.has(c.itemId)).map(c => [c.itemId, c])).values())

  async function handleCancel(orderId: string) {
    if (!token) return
    setCancellingId(orderId)
    const { error } = await cancelOrder(orderId, token)
    if (error) toast({ kind: 'error', text: error })
    else {
      setOrders(prev => prev.map(order => (order.orderId === orderId ? { ...order, status: 'cancel_buyer' } : order)))
      refreshPendingOrders(token, true)
    }
    setCancellingId(null)
    setConfirmId(null)
  }

  const activeTab = pickedTab ?? defaultOrderTab(searchParams.get('tab'), orders.map(order => order.status))
  const countByTab = (tab: OrderTab) => orders.filter(order => orderTab(order.status) === tab && (!childFilter || order.items.some(item => String(item.learnerId) === childFilter))).length
  // Optional filter by learner, from the child page (?child=ID) or the picker below.
  const childParam = searchParams.get('child')
  const [pickedChild, setPickedChild] = useState<string | null>(null)
  const childFilter = pickedChild ?? childParam ?? ''
  const learners = Array.from(new Map(
    orders.flatMap(order => order.items).filter(item => item.learnerId).map(item => [String(item.learnerId), item.studentName ?? 'Bạn'])
  ))
  const byChild = childFilter ? orders.filter(order => order.items.some(item => String(item.learnerId) === childFilter)) : orders
  const shownOrders = byChild.filter(order => orderTab(order.status) === activeTab)

  return (
    <div className="flex flex-col gap-4">
    {codesFor && (
      <Modal title={codesFor.title} onClose={() => setCodesFor(null)} maxWidth="max-w-[480px]">
        <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto">
          {codesFor.codes.map(code => (
            <div key={code.codeId}>
              {codesFor.codes.length > 1 && code.createdAt && <div className="mb-1 text-xs text-muted">Mua ngày {formatDate(code.createdAt)}</div>}
              <ItemCodeLines code={code.code} />
            </div>
          ))}
        </div>
      </Modal>
    )}
    <AccountCard title="Khóa học của tôi">
      {!loading && orders.length > 0 && (
        <div className="flex gap-2 overflow-x-auto border-b border-line px-4 py-3 sm:px-5" role="tablist">
          {ORDER_TABS.map(tab => (
            <button
              key={tab.key} type="button" role="tab" aria-selected={activeTab === tab.key}
              onClick={() => setPickedTab(tab.key)}
              className={activeTab === tab.key ? GUEST_CHIP_ON : GUEST_CHIP_OFF}
            >
              {tab.label} ({countByTab(tab.key)})
            </button>
          ))}
        </div>
      )}
      {!loading && learners.length > 1 && (
        <div className="border-b border-line px-4 py-3 sm:px-5">
          <label className="flex items-center gap-2 text-xs text-muted">
            Người học
            <select value={childFilter} onChange={e => setPickedChild(e.target.value)}
              className="min-h-11 rounded-lg border border-line bg-white px-3 text-sm text-ink">
              <option value="">Tất cả</option>
              {learners.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          </label>
        </div>
      )}
      {loading ? (
        <div className="p-5"><ListSkeleton showTitle={false} /></div>
      ) : orders.length === 0 ? (
        <div className="p-10 text-center text-sm text-muted">Bạn chưa đăng ký khóa học nào.</div>
      ) : shownOrders.length === 0 && !(activeTab === 'completed' && (otherVideos.length > 0 || otherCodes.length > 0)) ? (
        <div className="p-10 text-center text-sm text-muted">Không có đơn nào trong mục này.</div>
      ) : (
        <div className="divide-y divide-line">
          {shownOrders.map(order => {
            const status = STATUS_LABELS[order.status] ?? { label: order.status, tone: 'neutral' as BadgeTone }
            const paymentLabel = PAYMENT_LABELS[order.payment] ?? order.payment

            return (
              <div key={order.orderId} className="px-4 py-4 sm:px-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {order.createdAt && <span className="text-xs text-muted">{formatDate(order.createdAt)}</span>}
                    <Badge tone={status.tone}>{status.label}</Badge>
                    <span className="font-mono text-xs text-muted">#{order.orderId}</span>
                  </div>

                  {UNPAID_STATUSES.has(order.status) && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/order/${order.orderId}`} className="inline-flex min-h-11 items-center rounded-full bg-green px-4 text-xs font-bold text-white no-underline hover:opacity-90">
                        Thanh toán ngay
                      </Link>
                      {confirmId === order.orderId ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted">Xác nhận hủy?</span>
                          <button type="button" onClick={() => handleCancel(order.orderId)} disabled={cancellingId === order.orderId}
                            className="min-h-11 cursor-pointer rounded-full border-0 bg-red px-4 text-xs font-bold text-white">
                            {cancellingId === order.orderId ? '...' : 'Hủy'}
                          </button>
                          <button type="button" onClick={() => setConfirmId(null)}
                            className="min-h-11 cursor-pointer rounded-full border border-line bg-white px-4 text-xs text-muted">
                            Thôi
                          </button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => setConfirmId(order.orderId)}
                          className="min-h-11 cursor-pointer rounded-full border border-red bg-white px-4 text-xs font-bold text-red hover:bg-red-soft">
                          Hủy đơn
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  {order.items.map((item, index) => (
                    <div key={item.itemId}>
                      <div className="flex items-center gap-3">
                        {item.image && (
                          <Link href={getCourseUrl({ id: item.itemId, title: item.title })} target="_blank" rel="noopener noreferrer" className="shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.image} alt="" loading="lazy" className="size-11 rounded-lg object-cover" />
                          </Link>
                        )}
                        <div className="min-w-0 flex-1">
                          <Link href={getCourseUrl({ id: item.itemId, title: item.title })} target="_blank" rel="noopener noreferrer"
                            className="line-clamp-2 block text-sm font-bold text-ink no-underline hover:underline">
                            {item.title}
                          </Link>
                          {item.studentName && <div className="text-xs text-muted">Học sinh: {item.studentName}</div>}
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-base font-extrabold text-red">{formatPrice(item.paidPrice, '0 đ')}</div>
                          {index === 0 && <div className="text-xs text-muted">{paymentLabel}</div>}
                        </div>
                      </div>
                      {orderTab(order.status) === 'completed' && (() => {
                        const video = videoOf(item.itemId, item.learnerId)
                        const itemCodes = codesOf(item.itemId)
                        return (
                          <div className={item.image ? 'pl-14' : ''}>
                            {video && <div className="mt-2"><VideoRow course={video} /></div>}
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {video && <GoLearn course={video} />}
                              {itemCodes.length > 0 && <ShowCodes onOpen={() => setCodesFor({ title: item.title, codes: itemCodes })} />}
                              {order.status === 'delivered' && <OrderItemRating itemId={item.itemId} className="" />}
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          {activeTab === 'completed' && (otherVideos.length > 0 || otherCodes.length > 0) && (
            <div className="px-4 py-4 sm:px-5">
              <div className="mb-3 text-xs font-bold text-muted">Khóa học khác của bạn</div>
              <div className="flex flex-col gap-4">
                {otherVideos.map(video => (
                  <OtherCourse key={`v-${video.learnerId}-${video.itemId}`} itemId={video.itemId} title={video.title} image={video.image}
                    learner={video.self ? undefined : video.learnerName}>
                    <div className="mt-2"><VideoRow course={video} /></div>
                    <div className="mt-2 flex flex-wrap items-center gap-2"><GoLearn course={video} /><OrderItemRating itemId={video.itemId} className="" /></div>
                  </OtherCourse>
                ))}
                {otherCodes.map(code => (
                  <OtherCourse key={`c-${code.itemId}`} itemId={code.itemId} title={code.itemTitle} image={code.itemImage}>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <ShowCodes onOpen={() => setCodesFor({ title: code.itemTitle, codes: codesOf(code.itemId) })} />
                      <OrderItemRating itemId={code.itemId} className="" />
                    </div>
                  </OtherCourse>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </AccountCard>
    <FavoriteCourses />
    </div>
  )
}

function OtherCourse({ itemId, title, image, learner, children }: { itemId: number; title: string; image?: string | null; learner?: string; children: React.ReactNode }) {
  const url = getCourseUrl({ id: itemId, title })
  return (
    <div>
      <div className="flex items-center gap-3">
        {image && (
          <Link href={url} target="_blank" rel="noopener noreferrer" className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" loading="lazy" className="size-11 rounded-lg object-cover" />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <Link href={url} target="_blank" rel="noopener noreferrer" className="line-clamp-2 block text-sm font-bold text-ink no-underline hover:underline">{title}</Link>
          {learner && <div className="text-xs text-muted">Học sinh: {learner}</div>}
        </div>
      </div>
      <div className={image ? 'pl-14' : ''}>{children}</div>
    </div>
  )
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="p-5"><ListSkeleton /></div>}>
      <OrdersContent />
    </Suspense>
  )
}
