'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import LoginForm from '@/components/auth/LoginForm'
import RegisterForm from '@/components/auth/RegisterForm'
import { CloseIcon } from './icons'

type Tab = 'login' | 'register'

const TAB_LABELS: Record<Tab, string> = { login: 'Đăng nhập', register: 'Đăng ký' }

function AuthModalBody({ initialTab }: { initialTab: Tab }) {
  const { closeAuthModal, authModalOnSuccess } = useAuth()
  const [tab, setTab] = useState<Tab>(initialTab)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') closeAuthModal() }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [closeAuthModal])

  const finish = () => {
    closeAuthModal()
    authModalOnSuccess?.()
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center sm:p-4" onClick={closeAuthModal}>
      <div className="absolute inset-0 bg-ink/50" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Đăng nhập hoặc đăng ký"
        className="relative max-h-[92vh] w-full max-w-[420px] overflow-y-auto rounded-t-3xl bg-white shadow-raised sm:rounded-3xl"
        onClick={event => event.stopPropagation()}
      >
        <div role="tablist" className="flex border-b border-line pr-12">
          {(Object.keys(TAB_LABELS) as Tab[]).map(key => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`min-h-14 flex-1 cursor-pointer border-0 border-b-2 font-[inherit] text-[15px] transition-colors ${
                tab === key ? 'border-blue bg-white font-extrabold text-blue' : 'border-transparent bg-bg font-semibold text-muted'
              }`}
            >
              {TAB_LABELS[key]}
            </button>
          ))}
        </div>
        <button type="button" onClick={closeAuthModal} aria-label="Đóng"
          className="absolute right-0 top-1.5 grid size-11 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-muted hover:text-ink">
          <CloseIcon />
        </button>

        <div className="px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-6 sm:px-7">
          {tab === 'login'
            ? <LoginForm onSuccess={finish} onSwitchToRegister={() => setTab('register')} />
            : <RegisterForm onSuccess={finish} onSwitchToLogin={() => setTab('login')} />
          }
        </div>
      </div>
    </div>
  )
}

// Mounted only while open, so every opening starts on the requested tab with empty forms.
export default function AuthModal() {
  const { isAuthModalOpen, authModalTab } = useAuth()
  if (!isAuthModalOpen) return null
  return <AuthModalBody initialTab={authModalTab} />
}
