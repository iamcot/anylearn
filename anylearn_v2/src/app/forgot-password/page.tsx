'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sendPasswordOtp, verifyPasswordOtp, resetPassword } from '@/lib/api'
import { digitsOnly, isCompleteOtp, isValidPhone, passwordError } from '@/lib/auth/validation'
import { MIN_PASSWORD_LENGTH, OTP_LENGTH, OTP_RESEND_SECONDS } from '@/config/auth'
import AuthCard from '@/components/auth/AuthCard'
import BackLink from '@/components/BackLink'
import FormField from '@/components/FormField'
import Alert from '@/components/Alert'
import { useCountdown } from '@/components/auth/useCountdown'
import { CheckIcon } from '@/components/icons'

type Step = 'PHONE' | 'OTP' | 'NEW_PASSWORD'

const STEPS: Step[] = ['PHONE', 'OTP', 'NEW_PASSWORD']

function StepIndicator({ current }: { current: Step }) {
  const currentIndex = STEPS.indexOf(current)
  return (
    <ol className="m-0 mb-6 flex list-none items-center justify-center gap-2 p-0" aria-label="Các bước">
      {STEPS.map((step, index) => {
        const done = currentIndex > index
        return (
          <li key={step} className="flex items-center gap-2" aria-current={step === current ? 'step' : undefined}>
            <span className={`grid size-8 place-items-center rounded-full text-sm font-extrabold ${
              step === current ? 'bg-green text-white' : done ? 'bg-green-soft text-green-dark' : 'bg-surface text-muted'
            }`}>
              {done ? <CheckIcon className="size-4" /> : index + 1}
            </span>
            {index < STEPS.length - 1 && <span className={`h-0.5 w-8 ${done ? 'bg-green' : 'bg-line'}`} />}
          </li>
        )
      })}
    </ol>
  )
}

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('PHONE')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { remaining, start: startCountdown } = useCountdown()

  const subtitles: Record<Step, string> = {
    PHONE: 'Nhập số điện thoại đã đăng ký để nhận OTP qua Zalo',
    OTP: `Nhập mã OTP đã được gửi tới số ${phone}`,
    NEW_PASSWORD: 'Tạo mật khẩu mới cho tài khoản của bạn',
  }

  const run = async (action: () => Promise<boolean>) => {
    setError('')
    setLoading(true)
    const ok = await action()
    setLoading(false)
    return ok
  }

  const handleSendOtp = (event: React.FormEvent) => {
    event.preventDefault()
    if (!isValidPhone(phone)) { setError('Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)'); return }
    run(async () => {
      const { error: err } = await sendPasswordOtp(phone)
      if (err) { setError(err); return false }
      setStep('OTP')
      startCountdown(OTP_RESEND_SECONDS)
      return true
    })
  }

  const handleVerifyOtp = (event: React.FormEvent) => {
    event.preventDefault()
    if (!isCompleteOtp(otp)) { setError(`Vui lòng nhập đủ ${OTP_LENGTH} chữ số OTP`); return }
    run(async () => {
      const { resetToken: token, error: err } = await verifyPasswordOtp(phone, otp)
      if (err || !token) { setError(err || 'OTP không đúng'); return false }
      setResetToken(token)
      setStep('NEW_PASSWORD')
      return true
    })
  }

  const handleResetPassword = (event: React.FormEvent) => {
    event.preventDefault()
    const problem = passwordError(newPassword, confirmPassword)
    if (problem) { setError(problem); return }
    run(async () => {
      const { error: err } = await resetPassword(resetToken, newPassword)
      if (err) { setError(err); return false }
      router.push('/login?reset=success')
      return true
    })
  }

  const handleResend = () => {
    if (remaining > 0) return
    run(async () => {
      const { error: err } = await sendPasswordOtp(phone)
      if (err) { setError(err); return false }
      startCountdown(OTP_RESEND_SECONDS)
      return true
    })
  }

  return (
    <AuthCard title="Quên mật khẩu" subtitle={subtitles[step]} maxWidth="max-w-[420px]">
      <StepIndicator current={step} />
      {error && <Alert kind="error" className="mb-5">{error}</Alert>}

      {step === 'PHONE' && (
        <form onSubmit={handleSendOtp} className="flex flex-col gap-3.5">
          <FormField label="Số điện thoại">
            <input type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={event => setPhone(event.target.value)}
              placeholder="0374900344" className="field" required />
          </FormField>
          <button type="submit" disabled={loading} className="btn btn--green mt-2 w-full py-3.5 text-base">
            {loading ? 'Đang gửi...' : 'Gửi OTP qua Zalo'}
          </button>
        </form>
      )}

      {step === 'OTP' && (
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3.5">
          <FormField label={`Mã OTP (${OTP_LENGTH} chữ số)`}>
            <input type="text" inputMode="numeric" autoComplete="one-time-code" value={otp}
              onChange={event => setOtp(digitsOnly(event.target.value, OTP_LENGTH))}
              placeholder="123456" maxLength={OTP_LENGTH} required
              className="field text-center text-2xl font-extrabold tracking-[0.5em]" />
          </FormField>
          <button type="submit" disabled={loading} className="btn btn--green mt-2 w-full py-3.5 text-base">
            {loading ? 'Đang xác thực...' : 'Xác nhận OTP'}
          </button>
          <div className="text-center text-sm text-muted">
            Không nhận được OTP?{' '}
            <button type="button" onClick={handleResend} disabled={remaining > 0}
              className={`min-h-11 cursor-pointer border-0 bg-transparent p-0 font-[inherit] font-extrabold ${remaining > 0 ? 'cursor-default text-subtle' : 'text-blue hover:underline'}`}>
              {remaining > 0 ? `Gửi lại sau ${remaining}s` : 'Gửi lại'}
            </button>
          </div>
        </form>
      )}

      {step === 'NEW_PASSWORD' && (
        <form onSubmit={handleResetPassword} className="flex flex-col gap-3.5">
          <FormField label="Mật khẩu mới">
            <input type="password" autoComplete="new-password" value={newPassword} onChange={event => setNewPassword(event.target.value)}
              placeholder={`Tối thiểu ${MIN_PASSWORD_LENGTH} ký tự`} className="field" required />
          </FormField>
          <FormField label="Xác nhận mật khẩu">
            <input type="password" autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)}
              placeholder="Nhập lại mật khẩu" className="field" required />
          </FormField>
          <button type="submit" disabled={loading} className="btn btn--green mt-2 w-full py-3.5 text-base">
            {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </button>
        </form>
      )}

      <div className="mt-4 flex justify-center">
        <BackLink href="/login">Quay lại đăng nhập</BackLink>
      </div>
    </AuthCard>
  )
}
