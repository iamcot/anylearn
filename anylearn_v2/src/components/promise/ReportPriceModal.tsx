'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import Alert from '@/components/Alert'
import FormField from '@/components/FormField'
import Modal from '@/components/Modal'
import { createPriceReport } from '@/lib/api'
import { checkPriceReport, type PriceReportErrors, type PriceReportForm } from '@/lib/promise/priceReport'

function Done({ onClose }: { onClose: () => void }) {
  return (
    <div className="text-center">
      <p className="m-0 mb-1 text-base font-medium text-ink">Cảm ơn bạn đã báo giá</p>
      <p className="m-0 mb-5 text-sm text-muted">anyLEARN sẽ kiểm tra và điều chỉnh để giá luôn bằng hoặc rẻ hơn. Chúng tôi liên hệ nếu cần thêm thông tin.</p>
      <button type="button" onClick={onClose} className="btn btn--green min-h-11 w-full">Đóng</button>
    </div>
  )
}

// "Thấy giá rẻ hơn ở nơi khác? Báo cho chúng tôi": where, how much, and a phone number for people without an account.
export default function ReportPriceModal({ itemId, onClose }: { itemId?: number; onClose: () => void }) {
  const { user, token } = useAuth()
  const [form, setForm] = useState<PriceReportForm>({ seenPlace: '', seenPrice: '', note: '', phone: user?.phone ?? '' })
  const [errors, setErrors] = useState<PriceReportErrors>({})
  const [serverError, setServerError] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const bind = (field: keyof PriceReportForm) => ({
    value: form[field],
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(prev => ({ ...prev, [field]: event.target.value })),
  })

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const check = checkPriceReport(form, !!user, itemId)
    if (!check.ok) { setErrors(check.errors); return }
    setErrors({})
    setServerError('')
    setSending(true)
    const { error } = await createPriceReport(check.payload, token ?? undefined)
    setSending(false)
    if (error) { setServerError(error); return }
    setSent(true)
  }

  return (
    <Modal title="Báo giá rẻ hơn" onClose={onClose} maxWidth="max-w-[440px]">
      {sent ? <Done onClose={onClose} /> : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <p className="m-0 text-sm text-muted">anyLEARN cam kết giá bằng hoặc rẻ hơn tại trường. Cho chúng tôi biết bạn thấy giá thấp hơn ở đâu để kiểm tra.</p>
          {serverError && <Alert kind="error">{serverError}</Alert>}
          <FormField label="Bạn thấy giá rẻ hơn ở đâu? *">
            <input className="field min-h-11 w-full" placeholder="Tên trường, website hoặc link" maxLength={255} {...bind('seenPlace')} />
            {errors.seenPlace && <span className="mt-1 block text-xs text-red">{errors.seenPlace}</span>}
          </FormField>
          <FormField label="Giá bạn thấy (đồng)">
            <input className="field min-h-11 w-full" inputMode="numeric" placeholder="Ví dụ: 1.200.000" {...bind('seenPrice')} />
            {errors.seenPrice && <span className="mt-1 block text-xs text-red">{errors.seenPrice}</span>}
          </FormField>
          <FormField label={user ? 'Số điện thoại (nếu muốn được gọi lại)' : 'Số điện thoại *'}>
            <input className="field min-h-11 w-full" type="tel" inputMode="tel" autoComplete="tel" placeholder="09xx xxx xxx" {...bind('phone')} />
            {errors.phone && <span className="mt-1 block text-xs text-red">{errors.phone}</span>}
          </FormField>
          <FormField label="Ghi chú thêm">
            <textarea className="field w-full py-2" rows={2} maxLength={1000} {...bind('note')} />
          </FormField>
          <button type="submit" disabled={sending} className="btn btn--green min-h-12 w-full disabled:opacity-60">
            {sending ? 'Đang gửi...' : 'Gửi báo giá'}
          </button>
        </form>
      )}
    </Modal>
  )
}
