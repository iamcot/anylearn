'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { collectVoucher } from '@/lib/api/vouchers'
import { CheckIcon, TicketIcon } from '@/components/icons'
import { useToast } from '@/components/ToastProvider'

/**
 * "Lưu mã" on a promotion banner: saves the article's voucher group into the wallet (once per person).
 * A visitor gets the login form first; "already saved" from the server just shows the saved state.
 */
/** `onLight`: the button sits on a white card (smaller, saved text in green) instead of the dark banner. */
export default function SaveVoucherButton({ groupId, className = '', onLight = false }: { groupId: number; className?: string; onLight?: boolean }) {
  const { token, openAuthModal } = useAuth()
  const toast = useToast()
  const [state, setState] = useState<'idle' | 'busy' | 'saved'>('idle')

  const save = async (jwt: string) => {
    setState('busy')
    const { error } = await collectVoucher(groupId, jwt)
    if (!error || /đã nhận/i.test(error)) {
      setState('saved')
      if (!error) toast({ kind: 'success', text: 'Đã lưu mã vào ví voucher, dùng khi thanh toán.' })
      return
    }
    setState('idle')
    toast({ kind: 'error', text: error })
  }

  if (state === 'saved') {
    return (
      <span className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 text-sm font-extrabold ${onLight ? 'text-green-dark' : 'text-white'} ${className}`}>
        <CheckIcon className="size-5" /> Đã lưu mã
      </span>
    )
  }
  return (
    <button
      type="button"
      disabled={state === 'busy'}
      onClick={() => (token ? save(token) : openAuthModal('login'))}
      className={`btn shrink-0 cursor-pointer gap-2 border-0 ${onLight ? 'min-h-10 px-4 py-2 text-sm' : ''} bg-gradient-to-r from-[#ff8a3d] to-[#e8336d] text-white shadow-[0_4px_14px_rgba(232,51,109,.35)] hover:brightness-105 disabled:opacity-70 ${className}`}
    >
      <TicketIcon className="size-5" />
      {state === 'busy' ? 'Đang lưu...' : 'Lưu mã'}
    </button>
  )
}
