'use client'

import { useState } from 'react'
import { CheckIcon, ClipboardIcon } from '@/components/icons'

type CodeData =
  | { isPlain: true; value: string }
  | { isPlain: false; isAccountType: boolean; account?: string; password?: string; entries: { key: string; value: string }[] }

export function parseCode(raw: string): CodeData {
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const entries = Object.entries(parsed)
        .filter(([k]) => k !== 'order_id')
        .map(([k, v]) => ({ key: k, value: String(v) }))
      return { isPlain: false, isAccountType: 'account' in parsed, account: parsed.account, password: parsed.password, entries }
    }
  } catch {}
  return { isPlain: true, value: raw }
}

function CopyButton({ text, copied, onCopy }: { text: string; copied: boolean; onCopy: (text: string) => void }) {
  return (
    <button
      type="button"
      aria-label={copied ? 'Đã sao chép' : 'Sao chép'}
      onClick={() => onCopy(text)}
      className={`grid size-11 shrink-0 cursor-pointer place-items-center rounded-lg border-0 transition-colors ${
        copied ? 'bg-green-soft text-green-dark' : 'bg-blue-soft text-blue hover:bg-blue hover:text-white'
      }`}
    >
      {copied ? <CheckIcon className="size-5" /> : <ClipboardIcon className="size-5" />}
    </button>
  )
}

function CodeLine({ label, value, copied, onCopy }: { label?: string; value: string; copied: boolean; onCopy: (text: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      {label && <span className="w-20 shrink-0 text-xs capitalize text-muted">{label}</span>}
      <code className="min-w-0 flex-1 break-all rounded-lg bg-bg px-3 py-2 font-mono text-sm text-ink">{value}</code>
      <CopyButton text={value} copied={copied} onCopy={onCopy} />
    </div>
  )
}

/** The lines of one course code (plain code, account + password, or key/value pairs), each with a copy button. */
export default function ItemCodeLines({ code }: { code: string }) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const data = parseCode(code)
  const copy = (key: string) => async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }
  const line = (key: string, label: string | undefined, value: string) =>
    <CodeLine key={key} label={label} value={value} copied={copiedKey === key} onCopy={copy(key)} />
  return (
    <div className="flex flex-col gap-2">
      {data.isPlain
        ? line('code', undefined, data.value)
        : data.isAccountType
          ? <>
              {data.account && line('acc', 'Tài khoản', data.account)}
              {data.password && line('pwd', 'Mật khẩu', data.password)}
            </>
          : data.entries.map(({ key, value }) => line(key, key, value))}
    </div>
  )
}
