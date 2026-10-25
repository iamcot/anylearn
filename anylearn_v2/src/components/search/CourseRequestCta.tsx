'use client'

import { useState } from 'react'
import CourseRequestModal, { type CourseRequestDefaults } from './CourseRequestModal'

type Variant = 'primary' | 'link'

// Button that opens the "Tìm giúp tôi" form. Primary = the green action of an empty result; link = a quiet line elsewhere.
export default function CourseRequestCta({ label, variant = 'link', defaults }: {
  label: string
  variant?: Variant
  defaults: CourseRequestDefaults
}) {
  const [open, setOpen] = useState(false)
  const className = variant === 'primary'
    ? 'btn btn--green min-h-11'
    : 'min-h-11 cursor-pointer border-0 bg-transparent p-0 text-sm font-medium text-green-dark underline'

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>{label}</button>
      {open && <CourseRequestModal defaults={defaults} onClose={() => setOpen(false)} />}
    </>
  )
}
