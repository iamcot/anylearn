'use client'

import { useState } from 'react'

const COPIED_FEEDBACK_MS = 2000

// Old iOS Safari has no navigator.clipboard outside secure contexts, so fall back to execCommand
function copyWithSelection(text: string): boolean {
  const field = document.createElement('textarea')
  field.value = text
  field.setAttribute('readonly', '')
  field.style.position = 'fixed'
  field.style.opacity = '0'
  document.body.appendChild(field)
  field.select()
  field.setSelectionRange(0, text.length)
  const copied = document.execCommand('copy')
  document.body.removeChild(field)
  return copied
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return copyWithSelection(text)
  }
}

export default function CopyButton({ text, label = 'Sao chép' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  async function handleClick() {
    if (!(await copyText(text))) return
    setCopied(true)
    setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="min-h-11 shrink-0 cursor-pointer rounded-lg border border-line bg-white px-3 text-sm font-semibold text-ink active:bg-surface"
    >
      {copied ? 'Đã sao chép' : label}
    </button>
  )
}
