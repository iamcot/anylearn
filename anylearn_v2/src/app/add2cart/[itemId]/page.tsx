'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getCartInfo, addToCart, saveChild, CartInfoData, ItemSchedule, getCourseUrl } from '@/lib/api'
import { formatPrice } from '@/lib/format/price'
import { formatSchedule } from '@/lib/format/schedule'
import { CYCLE_LABELS } from '@/config/itemLabels'
import {
  ACTIVITY_TYPES, EMPTY_SELECTION, buildActivityPayload, type ActivityChoice, type ActivitySelection, type ActivityType,
} from '@/lib/activities'
import { FormPageSkeleton, ListSkeleton } from '@/components/PageSkeleton'
import SectionCard from '@/components/SectionCard'
import RadioOption from '@/components/RadioOption'
import ActivityFields from '@/components/ActivityFields'
import ChildFormModal, { type ChildDraft } from '@/components/ChildFormModal'
import { useToast } from '@/components/ToastProvider'
import { BookIcon, CalendarIcon, GiftIcon, PencilIcon, UserIcon } from '@/components/icons'
import { takePendingChildId } from '@/components/guest/guestLearnerStore'
import { useChildrenVersion } from '@/components/guest/useGuestLearners'
import DuplicateOrderModal from '@/components/orders/DuplicateOrderModal'
import { usePendingOrders } from '@/components/orders/usePendingOrders'
import { findDuplicatePendingOrder } from '@/lib/orders/pendingOrders'
import type { PendingOrder } from '@/lib/api/orders'
import { getMyProfile, updateProfile } from '@/lib/api/account'

const ACTIVITY_ROW_LABELS: Record<ActivityType, string> = { trial: 'Học thử', test: 'Đăng ký thi đầu vào', visit: 'Tham quan trường' }
const BILLING_CYCLES = ['month', 'year', 'week', 'day']

function calcAge(dob: string) {
  const birth = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const birthdayPassed = now.getMonth() > birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate())
  if (!birthdayPassed) age--
  return age
}

function scheduleLabel(schedule: ItemSchedule) {
  const text = formatSchedule(schedule)
  return schedule.scheduleType === 'event' && schedule.eventDate ? `Ngày khai giảng: ${text}` : text
}

export default function Add2CartPage() {
  const { user, token, openAuthModal, refreshCartCount, isAuthLoading } = useAuth()
  const router = useRouter()
  const toast = useToast()
  const { itemId } = useParams<{ itemId: string }>()

  const [data, setData] = useState<CartInfoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [selectedStudent, setSelectedStudent] = useState<number | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null)
  const [selectedSchedule, setSelectedSchedule] = useState<number | null>(null)
  const [activities, setActivities] = useState<ActivitySelection>(EMPTY_SELECTION)
  const [startMonth, setStartMonth] = useState('')

  const childrenVersion = useChildrenVersion()
  const [childDraft, setChildDraft] = useState<ChildDraft | null>(null)
  const [savingChild, setSavingChild] = useState(false)
  // The account owner can be the learner too: their date of birth is edited here as well (age-limited courses need it).
  const [selfDob, setSelfDob] = useState<string | null>(null)
  const [editingSelf, setEditingSelf] = useState(false)

  useEffect(() => {
    if (!token) return
    getMyProfile(token).then(profile => setSelfDob(profile?.dob ? profile.dob.substring(0, 10) : null))
  }, [token])

  useEffect(() => {
    if (isAuthLoading) return
    if (!user || !token) {
      openAuthModal('login', () => router.refresh())
      return
    }
    getCartInfo(Number(itemId), token).then(info => {
      setData(info)
      setLoading(false)
      if (info?.plans && info.plans.length > 0) setSelectedPlan(info.plans[0].id)
      if (info?.schedules && info.schedules.length === 1) setSelectedSchedule(info.schedules[0].id)

      // Links from /today can preselect the child and the start month.
      const params = new URLSearchParams(window.location.search)
      const childId = Number(params.get('child'))
      // The child created from what the visitor told us before registering is picked unless a link chose another one.
      const pendingChildId = takePendingChildId()
      const preselected = childId || pendingChildId
      if (preselected && info?.children?.some(c => c.id === preselected)) setSelectedStudent(preselected)
      const start = params.get('start')
      if (start && /^\d{4}-\d{2}$/.test(start)) setStartMonth(start)
    })
  }, [isAuthLoading, user, token, itemId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Children added (or matched) right after a login while this page was already open: refresh only the list and the
  // choice, so the plan and schedule picked meanwhile stay as they are.
  useEffect(() => {
    if (!token || childrenVersion === 0) return
    let cancelled = false
    getCartInfo(Number(itemId), token).then(info => {
      if (cancelled || !info) return
      setData(prev => (prev ? { ...prev, children: info.children } : prev))
      const pendingChildId = takePendingChildId()
      if (pendingChildId && info.children.some(child => child.id === pendingChildId)) setSelectedStudent(pendingChildId)
    })
    return () => { cancelled = true }
  }, [childrenVersion, token, itemId])

  async function handleSaveChild(draft: ChildDraft) {
    if (!token) return
    setSavingChild(true)
    const { data: saved, error: err } = await saveChild({ id: draft.id, name: draft.name, dob: draft.dob }, token)
    setSavingChild(false)
    if (err || !saved) { toast({ kind: 'error', text: err || 'Không lưu được thông tin' }); return }
    setData(prev => {
      if (!prev) return prev
      const child = { id: saved.id, name: saved.name ?? draft.name, dob: draft.dob }
      const children = draft.id ? prev.children.map(c => (c.id === draft.id ? { ...c, ...child } : c)) : [...prev.children, child]
      return { ...prev, children }
    })
    if (!draft.id) setSelectedStudent(saved.id)
    setChildDraft(null)
  }

  async function handleSaveSelf(draft: ChildDraft) {
    if (!token) return
    setSavingChild(true)
    const { error: err } = await updateProfile({ dob: draft.dob, dobYearOnly: false }, token)
    setSavingChild(false)
    if (err) { toast({ kind: 'error', text: err }); return }
    setSelfDob(draft.dob)
    setEditingSelf(false)
  }

  const updateActivity = (type: ActivityType, choice: ActivityChoice) => setActivities(prev => ({ ...prev, [type]: choice }))

  const pendingOrders = usePendingOrders()
  const [duplicateOrder, setDuplicateOrder] = useState<PendingOrder | null>(null)

  const handleAddToCart = async (ignoreDuplicate = false) => {
    if (!token || !data || !user) return
    const duplicate = findDuplicatePendingOrder(pendingOrders, {
      itemId: Number(itemId), learnerId: selectedStudent ?? user.id, scheduleId: selectedSchedule,
    })
    if (duplicate && !ignoreDuplicate) { setDuplicateOrder(duplicate); return }
    setDuplicateOrder(null)
    setSubmitting(true)
    setError('')

    const payload = buildActivityPayload(activities, { trial: !!data.activiyTrial, test: !!data.activiyTest, visit: !!data.activiyVisit })
    const { error: err } = await addToCart({
      itemId: Number(itemId),
      studentId: selectedStudent ?? undefined,
      planId: selectedPlan ?? undefined,
      scheduleId: selectedSchedule ?? undefined,
      activities: payload.length > 0 ? payload : undefined,
      startDate: startMonth ? startMonth + '-01' : undefined,
    }, token)

    setSubmitting(false)
    if (err) { setError(err); return }
    await refreshCartCount()
    router.push('/checkout')
  }

  if (isAuthLoading) return <FormPageSkeleton />
  if (!user) return null
  if (loading) return <div className="section"><div className="container max-w-[720px]"><ListSkeleton /></div></div>
  if (!data) return <div className="section"><div className="container text-center text-red">Không tìm thấy khóa học</div></div>

  const item = data.item
  const enabledActivities: Record<ActivityType, boolean> = { trial: !!data.activiyTrial, test: !!data.activiyTest, visit: !!data.activiyVisit }
  const hasActivities = ACTIVITY_TYPES.some(type => enabledActivities[type])
  const hasDiscount = !!item.orgPrice && item.orgPrice > item.price
  const schedules: ItemSchedule[] = data.schedules ?? []
  const isBillingOnly = schedules.length === 0 && !!item.cycleType && BILLING_CYCLES.includes(item.cycleType)
  const cycleAmount = item.cycleAmount && item.cycleAmount > 1 ? `${item.cycleAmount} ` : ''

  return (
    <div className="section bg-bg py-6 lg:py-10">
      <div className="container max-w-[900px]">

        <SectionCard icon={<BookIcon className="size-5" />} title="Khóa học bạn đang đăng ký">
          <div className="p-5">
            <Link href={getCourseUrl(item)} className="no-underline">
              <h3 className="m-0 mb-1.5 text-xl font-extrabold leading-tight text-green-dark">{item.title}</h3>
            </Link>
            {item.authorName && <p className="m-0 mb-3 text-sm text-muted">Đối tác: {item.authorName}</p>}
            <p className="m-0 text-[15px] text-ink">
              Học phí: <strong className="text-red">{formatPrice(item.price)}</strong>
              {hasDiscount && <span className="ml-2.5 text-xs text-subtle line-through">{formatPrice(item.orgPrice!)}</span>}
            </p>
          </div>
        </SectionCard>

        <SectionCard
          icon={<UserIcon className="size-5" />}
          title="Bạn đang đăng ký cho"
          action={
            <button type="button" onClick={() => setChildDraft({ name: '', dob: '' })}
              className="min-h-11 cursor-pointer rounded-full border border-line bg-white px-3 text-xs font-medium text-ink hover:bg-bg">
              + Thêm con
            </button>
          }
        >
          <div className="flex flex-col gap-2.5 p-4 sm:px-5">
            <div className="flex items-stretch gap-2">
              <div className="flex-1">
                <RadioOption name="student" checked={selectedStudent === null} onChange={() => setSelectedStudent(null)} label={`${user.name} (Tôi)`}
                  hint={selfDob ? `${calcAge(selfDob)} tuổi` : undefined} />
              </div>
              <button type="button" onClick={() => setEditingSelf(true)}
                aria-label="Sửa ngày sinh của bạn" title="Sửa ngày sinh"
                className="grid w-11 shrink-0 cursor-pointer place-items-center rounded-xl border border-line bg-white text-ink hover:bg-bg">
                <PencilIcon className="size-[18px]" />
              </button>
            </div>
            {data.children.map(child => (
              <div key={child.id} className="flex items-stretch gap-2">
                <div className="flex-1">
                  <RadioOption
                    name="student"
                    checked={selectedStudent === child.id}
                    onChange={() => setSelectedStudent(child.id)}
                    label={child.name}
                    hint={child.dob ? `${calcAge(child.dob)} tuổi` : undefined}
                  />
                </div>
                <button type="button" onClick={() => setChildDraft({ id: child.id, name: child.name, dob: child.dob ?? '' })}
                  aria-label={`Sửa thông tin ${child.name}`} title="Sửa"
                  className="grid w-11 shrink-0 cursor-pointer place-items-center rounded-xl border border-line bg-white text-ink hover:bg-bg">
                  <PencilIcon className="size-[18px]" />
                </button>
              </div>
            ))}
          </div>
        </SectionCard>

        {editingSelf && (
          <ChildFormModal initial={{ name: user.name, dob: selfDob ?? '' }} saving={savingChild} lockName
            onSave={handleSaveSelf} onClose={() => setEditingSelf(false)} />
        )}

        {childDraft && (
          <ChildFormModal initial={childDraft} saving={savingChild} onSave={handleSaveChild} onClose={() => setChildDraft(null)} />
        )}

        {schedules.length > 0 && (
          <SectionCard icon={<CalendarIcon className="size-5" />} title="Chọn ca học">
            <div className="flex flex-col gap-2.5 p-4 sm:px-5">
              {schedules.map(schedule => (
                <RadioOption
                  key={schedule.id}
                  name="schedule"
                  checked={selectedSchedule === schedule.id}
                  onChange={() => setSelectedSchedule(schedule.id)}
                  label={schedule.title || `Ca ${schedule.id}`}
                  hint={scheduleLabel(schedule) || undefined}
                >
                  {schedule.scheduleType === 'open' && (
                    <span className="mt-0.5 block text-xs font-medium text-green">Chọn ngày khai giảng linh hoạt sau khi đăng ký</span>
                  )}
                  {schedule.locationNote && <span className="block text-xs text-muted">{schedule.locationNote}</span>}
                </RadioOption>
              ))}
            </div>
          </SectionCard>
        )}

        {schedules.length === 0 && (
          <SectionCard icon={<CalendarIcon className="size-5" />} title={isBillingOnly ? 'Chọn tháng bắt đầu' : 'Chọn Lịch học'}>
            <div className="p-4 sm:px-5">
              {isBillingOnly ? (
                <div>
                  <p className="mb-3 mt-0 text-sm text-muted">
                    Khóa học thu phí theo {cycleAmount}{CYCLE_LABELS[item.cycleType!] ?? item.cycleType}.
                    Chọn tháng bắt đầu để tính ngày hết hạn.
                  </p>
                  <input
                    type="month"
                    value={startMonth}
                    onChange={event => setStartMonth(event.target.value)}
                    min={new Date().toISOString().substring(0, 7)}
                    aria-label="Tháng bắt đầu"
                    className="field accent-green"
                  />
                  {startMonth && (
                    <p className="mb-0 mt-2 text-xs text-green">
                      Bắt đầu từ {new Date(startMonth + '-01').toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                    </p>
                  )}
                </div>
              ) : data.plans.length > 0 ? (
                <div className="flex flex-col gap-2.5">
                  {data.plans.map(plan => (
                    <RadioOption
                      key={plan.id}
                      name="plan"
                      checked={selectedPlan === plan.id}
                      onChange={() => setSelectedPlan(plan.id)}
                      label={<>{plan.title || `Lịch ${plan.id}`}{plan.weekdays && <span className="font-normal text-muted"> — {plan.weekdays}</span>}</>}
                    >
                      {plan.date_start && <span className="block text-xs text-muted">Bắt đầu từ ngày {new Date(plan.date_start).toLocaleDateString('vi-VN')}</span>}
                      {plan.location_title && <span className="block text-xs text-muted">{plan.location_title}{plan.address ? ` — ${plan.address}` : ''}</span>}
                    </RadioOption>
                  ))}
                </div>
              ) : (
                <p className="m-0 text-muted">
                  Lịch học bắt đầu từ ngày {item.dateStart ? new Date(item.dateStart).toLocaleDateString('vi-VN') : 'sớm nhất'}
                </p>
              )}
            </div>
          </SectionCard>
        )}

        {hasActivities && (
          <SectionCard icon={<GiftIcon className="size-5" />} title="Các hoạt động trải nghiệm miễn phí">
            <div className="flex flex-col gap-2.5 p-4 sm:px-5">
              {ACTIVITY_TYPES.filter(type => enabledActivities[type]).map(type => (
                <ActivityFields key={type} type={type} label={ACTIVITY_ROW_LABELS[type]} choice={activities[type]} onChange={choice => updateActivity(type, choice)} />
              ))}
            </div>
          </SectionCard>
        )}

        {error && <div className="mb-4 rounded-xl border border-red-line bg-red-soft px-4 py-3 text-red">{error}</div>}

        <button type="button" onClick={() => handleAddToCart()} className="btn btn--green mb-3 w-full p-4 text-[17px]" disabled={submitting}>
          {submitting ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
        </button>
        {duplicateOrder && (
          <DuplicateOrderModal order={duplicateOrder} onCreateNew={() => handleAddToCart(true)} onClose={() => setDuplicateOrder(null)} />
        )}
        <button type="button" onClick={() => router.back()} className="btn btn--outline w-full">Quay lại</button>
      </div>
    </div>
  )
}
