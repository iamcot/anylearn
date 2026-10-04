'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { sendPasswordOtp, verifyPasswordOtp, resetPassword } from '@/lib/api'

type Step = 'PHONE' | 'OTP' | 'NEW_PASSWORD'

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
  const [countdown, setCountdown] = useState(0)

  function startCountdown() {
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(timer); return 0 }
        return c - 1
      })
    }, 1000)
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!phone.match(/^0\d{9}$/)) { setError('Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)'); return }
    setLoading(true)
    const { error: err } = await sendPasswordOtp(phone)
    setLoading(false)
    if (err) { setError(err); return }
    setStep('OTP')
    startCountdown()
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (otp.length !== 6) { setError('Vui lòng nhập đủ 6 chữ số OTP'); return }
    setLoading(true)
    const { resetToken: token, error: err } = await verifyPasswordOtp(phone, otp)
    setLoading(false)
    if (err || !token) { setError(err || 'OTP không đúng'); return }
    setResetToken(token)
    setStep('NEW_PASSWORD')
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (newPassword.length < 6) { setError('Mật khẩu phải có ít nhất 6 ký tự'); return }
    if (newPassword !== confirmPassword) { setError('Mật khẩu không khớp'); return }
    setLoading(true)
    const { error: err } = await resetPassword(resetToken, newPassword)
    setLoading(false)
    if (err) { setError(err); return }
    router.push('/login?reset=success')
  }

  async function handleResend() {
    if (countdown > 0) return
    setError('')
    setLoading(true)
    const { error: err } = await sendPasswordOtp(phone)
    setLoading(false)
    if (err) { setError(err); return }
    startCountdown()
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center" style={{ padding: '3rem 1rem' }}>
      <div className="bg-white border border-[#e6edf4] rounded-[28px] shadow-[0_16px_42px_rgba(15,23,42,0.1)] w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/cdn/anylearn/img/LogoanyLEARN.svg" alt="anyLEARN" className="h-10 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-[#17212f]">Quên mật khẩu</h1>
          <p className="text-[#6d7a8a] text-sm mt-1">
            {step === 'PHONE' && 'Nhập số điện thoại đã đăng ký để nhận OTP qua Zalo'}
            {step === 'OTP' && `Nhập mã OTP đã được gửi tới số ${phone}`}
            {step === 'NEW_PASSWORD' && 'Tạo mật khẩu mới cho tài khoản của bạn'}
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {(['PHONE', 'OTP', 'NEW_PASSWORD'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full text-sm font-black grid place-items-center ${
                s === step ? 'bg-blue text-white' :
                (['PHONE', 'OTP', 'NEW_PASSWORD'].indexOf(step) > i) ? 'bg-[#00a651] text-white' :
                'bg-[#f0f5fa] text-[#6d7a8a]'
              }`}>{i + 1}</div>
              {i < 2 && <div className={`w-8 h-0.5 ${(['PHONE', 'OTP', 'NEW_PASSWORD'].indexOf(step) > i) ? 'bg-[#00a651]' : 'bg-[#e6edf4]'}`} />}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-[#fff0f0] border border-[#ffcdd2] rounded-xl px-4 py-3 text-sm text-red-600 mb-5">
            {error}
          </div>
        )}

        {/* Step 1: Phone */}
        {step === 'PHONE' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-black text-[#17212f] mb-1.5">Số điện thoại</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="0374900344"
                className="w-full border border-[#d0e3f5] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue"
                required
              />
            </div>
            <button type="submit" disabled={loading}
              className="btn btn--blue w-full" style={{ width: '100%', display: 'flex' }}>
              {loading ? 'Đang gửi...' : 'Gửi OTP qua Zalo'}
            </button>
          </form>
        )}

        {/* Step 2: OTP */}
        {step === 'OTP' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-black text-[#17212f] mb-1.5">Mã OTP (6 chữ số)</label>
              <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full border border-[#d0e3f5] rounded-xl px-4 py-3 text-center text-2xl font-black tracking-[0.5em] focus:outline-none focus:border-blue"
                maxLength={6}
                required
              />
            </div>
            <button type="submit" disabled={loading}
              className="btn btn--blue w-full" style={{ width: '100%', display: 'flex' }}>
              {loading ? 'Đang xác thực...' : 'Xác nhận OTP'}
            </button>
            <div className="text-center text-sm text-[#6d7a8a]">
              Không nhận được OTP?{' '}
              <button type="button" onClick={handleResend} disabled={countdown > 0}
                className={`font-black ${countdown > 0 ? 'text-[#9db4c8]' : 'text-blue hover:underline'}`}>
                {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại'}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: New password */}
        {step === 'NEW_PASSWORD' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-black text-[#17212f] mb-1.5">Mật khẩu mới</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full border border-[#d0e3f5] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-black text-[#17212f] mb-1.5">Xác nhận mật khẩu</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                className="w-full border border-[#d0e3f5] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue"
                required
              />
            </div>
            <button type="submit" disabled={loading}
              className="btn btn--green w-full" style={{ width: '100%', display: 'flex' }}>
              {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-[#6d7a8a]">
          <Link href="/login" className="text-blue font-black hover:underline">← Quay lại đăng nhập</Link>
        </div>
      </div>
    </div>
  )
}
