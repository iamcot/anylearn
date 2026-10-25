'use client'

import { CloseIcon } from '@/components/icons'

export default function Modal({ title, onClose, children, maxWidth = 'max-w-[400px]' }: {
  title: string
  onClose: () => void
  children: React.ReactNode
  maxWidth?: string
}) {
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-ink/45 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-label={title}
        className={`w-full ${maxWidth} rounded-[18px] bg-white p-6 shadow-raised`}
        onClick={event => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="m-0 text-base font-extrabold text-ink">{title}</h3>
          <button type="button" aria-label="Đóng" onClick={onClose} className="-mr-2 grid size-11 cursor-pointer place-items-center border-0 bg-transparent text-muted hover:text-ink">
            <CloseIcon />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
