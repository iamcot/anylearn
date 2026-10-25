'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import Alert from '@/components/Alert'
import FormField from '@/components/FormField'
import Modal from '@/components/Modal'
import { BUDGET_OPTIONS, MODE_OPTIONS, PREFERRED_TIME_OPTIONS, PROVINCE_OPTIONS, type Option } from '@/config/courseRequest'
import { useGuestLearners } from '@/components/guest/useGuestLearners'
import { createCourseRequest } from '@/lib/api'
import { selectedGuestPerson } from '@/lib/guest/guestLearners'
import { checkCourseRequest, type CourseRequestForm } from '@/lib/search/courseRequest'

export interface CourseRequestDefaults {
  subject?: string
  learnerAge?: number
  provinceCode?: string
  sourceRef?: string | null
}

function OptionSelect({ label, value, options, onChange }: { label: string; value: string; options: Option[]; onChange: (value: string) => void }) {
  return (
    <FormField label={label}>
      <select className="field min-h-11 w-full" value={value} onChange={event => onChange(event.target.value)}>
        {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </FormField>
  )
}

function Done({ onClose }: { onClose: () => void }) {
  return (
    <div className="text-center">
      <p className="m-0 mb-1 text-base font-medium text-ink">Đã nhận yêu cầu của bạn</p>
      <p className="m-0 mb-5 text-sm text-muted">anyLEARN sẽ liên hệ qua số điện thoại bạn để lại trong vòng 48 giờ.</p>
      <button type="button" onClick={onClose} className="btn btn--green min-h-11 w-full">Đóng</button>
    </div>
  )
}

// "Tìm giúp tôi": what the visitor wants and how to reach them. The team looks for a partner and calls back.
export default function CourseRequestModal({ defaults, onClose }: { defaults: CourseRequestDefaults; onClose: () => void }) {
  const { user, token } = useAuth()
  const guestStore = useGuestLearners()
  // The age comes from what the visitor said about who the courses are for, unless the caller knows better.
  const knownAge = defaults.learnerAge ?? selectedGuestPerson(guestStore)?.age
  const [form, setForm] = useState<CourseRequestForm>({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    subject: defaults.subject ?? '',
    learnerAge: knownAge !== undefined ? String(knownAge) : '',
    provinceCode: defaults.provinceCode ?? '',
    districtText: '',
    budgetMax: '',
    preferredTime: '',
    mode: '',
    note: '',
  })
  const [errors, setErrors] = useState<Partial<Record<'phone' | 'subject' | 'learnerAge', string>>>({})
  const [serverError, setServerError] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const set = (field: keyof CourseRequestForm) => (value: string) => setForm(prev => ({ ...prev, [field]: value }))
  const bind = (field: keyof CourseRequestForm) => ({ value: form[field], onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(field)(event.target.value) })

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const check = checkCourseRequest(form, defaults.sourceRef ?? undefined)
    if (!check.ok) { setErrors(check.errors); return }
    setErrors({})
    setServerError('')
    setSending(true)
    const { error } = await createCourseRequest(check.payload, token ?? undefined)
    setSending(false)
    if (error) { setServerError(error); return }
    setSent(true)
  }

  return (
    <Modal title="Nhờ anyLEARN tìm giúp" onClose={onClose} maxWidth="max-w-[460px]">
      {sent ? <Done onClose={onClose} /> : (
        <form onSubmit={handleSubmit} className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto pr-1">
          <p className="m-0 text-sm text-muted">Cho chúng tôi biết bạn cần gì, anyLEARN sẽ tìm đối tác phù hợp và gọi lại cho bạn.</p>
          {serverError && <Alert kind="error">{serverError}</Alert>}
          <FormField label="Bạn muốn tìm khóa học gì? *">
            <input className="field min-h-11 w-full" placeholder="Ví dụ: cờ vua, tiếng Anh giao tiếp" maxLength={255} {...bind('subject')} />
            {errors.subject && <span className="mt-1 block text-xs text-red">{errors.subject}</span>}
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Số điện thoại *">
              <input className="field min-h-11 w-full" type="tel" inputMode="tel" autoComplete="tel" placeholder="09xx xxx xxx" {...bind('phone')} />
              {errors.phone && <span className="mt-1 block text-xs text-red">{errors.phone}</span>}
            </FormField>
            <FormField label="Tên của bạn">
              <input className="field min-h-11 w-full" autoComplete="name" maxLength={100} {...bind('name')} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Tuổi của người học">
              <input className="field min-h-11 w-full" type="number" inputMode="numeric" min={0} max={100} {...bind('learnerAge')} />
              {errors.learnerAge && <span className="mt-1 block text-xs text-red">{errors.learnerAge}</span>}
            </FormField>
            <OptionSelect label="Khu vực" value={form.provinceCode} options={PROVINCE_OPTIONS} onChange={set('provinceCode')} />
          </div>
          <FormField label="Quận / huyện (nếu có)">
            <input className="field min-h-11 w-full" maxLength={100} {...bind('districtText')} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <OptionSelect label="Ngân sách mỗi tháng" value={form.budgetMax} options={BUDGET_OPTIONS} onChange={set('budgetMax')} />
            <OptionSelect label="Thời gian rảnh" value={form.preferredTime} options={PREFERRED_TIME_OPTIONS} onChange={set('preferredTime')} />
          </div>
          <OptionSelect label="Hình thức học" value={form.mode} options={MODE_OPTIONS} onChange={set('mode')} />
          <FormField label="Ghi chú thêm">
            <textarea className="field w-full py-2" rows={2} maxLength={1000} {...bind('note')} />
          </FormField>
          <button type="submit" disabled={sending} className="btn btn--green min-h-12 w-full disabled:opacity-60">
            {sending ? 'Đang gửi...' : 'Gửi yêu cầu'}
          </button>
        </form>
      )}
    </Modal>
  )
}
