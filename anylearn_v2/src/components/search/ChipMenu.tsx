'use client'

import { useRef, type ReactNode } from 'react'
import { ChevronDownIcon, CloseIcon } from '@/components/icons'
import { useDismissOnOutside } from '@/components/useDismissOnOutside'
import { GUEST_CHIP_OFF, GUEST_CHIP_ON } from '@/components/guest/chipStyles'

interface Props {
  label: string
  icon: ReactNode
  active: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  footer: ReactNode
  children: ReactNode
}

// A chip that opens a menu: a bottom sheet on a phone, a popover under the chip from lg up.
export default function ChipMenu({ label, icon, active, open, onOpenChange, title, footer, children }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  useDismissOnOutside(ref, open, () => onOpenChange(false))

  return (
    <div ref={ref} className="relative shrink-0">
      <button type="button" aria-expanded={open} onClick={() => onOpenChange(!open)} className={`${active ? GUEST_CHIP_ON : GUEST_CHIP_OFF} gap-1.5`}>
        {icon}
        {label}
        <ChevronDownIcon className="size-3.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[60] bg-ink/40 lg:hidden" onClick={() => onOpenChange(false)} />
          <div
            role="dialog"
            aria-label={title}
            className="fixed inset-x-0 bottom-0 z-[61] max-h-[80vh] overflow-y-auto rounded-t-[22px] bg-white p-4 shadow-raised lg:absolute lg:inset-x-auto lg:bottom-auto lg:left-0 lg:top-full lg:z-40 lg:mt-2 lg:max-h-none lg:w-80 lg:rounded-2xl lg:border lg:border-line"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="m-0 text-sm font-extrabold text-ink">{title}</h3>
              <button type="button" aria-label="Đóng" onClick={() => onOpenChange(false)} className="-mr-2 grid size-11 cursor-pointer place-items-center border-0 bg-transparent text-muted lg:hidden">
                <CloseIcon />
              </button>
            </div>
            {children}
            <div className="mt-4 flex items-center justify-between gap-3">{footer}</div>
          </div>
        </>
      )}
    </div>
  )
}
