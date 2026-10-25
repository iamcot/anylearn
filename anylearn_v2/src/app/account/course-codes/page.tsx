'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getUserItemCodes, ItemCode } from '@/lib/api'
import AccountCard from '@/components/account/AccountCard'
import { ListSkeleton } from '@/components/PageSkeleton'
import { CheckIcon, ClipboardIcon } from '@/components/icons'

type CodeData =
  | { isPlain: true; value: string }
  | { isPlain: false; isAccountType: boolean; account?: string; password?: string; entries: { key: string; value: string }[] }

function parseCode(raw: string): CodeData {
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const entries = Object.entries(parsed)
        .filter(([k]) => k !== 'order_id')
        .map(([k, v]) => ({ key: k, value: String(v) }))
      return {
        isPlain: false,
        isAccountType: 'account' in parsed,
        account: parsed.account,
        password: parsed.password,
        entries,
      }
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

export default function CourseCodesPage() {
  const { token } = useAuth()
  const [codes, setCodes] = useState<ItemCode[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    getUserItemCodes(token).then(data => { setCodes(data); setLoading(false) })
  }, [token])

  const copy = (key: string) => async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  return (
    <AccountCard title="Mã code khóa học" subtitle="Thông tin đăng nhập các khóa học kỹ thuật số của bạn">
      {loading ? (
        <div className="p-5"><ListSkeleton showTitle={false} /></div>
      ) : codes.length === 0 ? (
        <div className="p-10 text-center text-sm text-muted">Chưa có mã code nào.</div>
      ) : (
        <div className="flex flex-col gap-4 p-4 sm:p-5">
          {codes.map(item => {
            const codeData = parseCode(item.code)
            const id = `${item.codeId}`
            const line = (key: string, label: string | undefined, value: string) => {
              const lineKey = `${id}-${key}`
              return <CodeLine key={lineKey} label={label} value={value} copied={copiedKey === lineKey} onCopy={copy(lineKey)} />
            }
            return (
              <div key={item.codeId} className="overflow-hidden rounded-xl border border-line">
                <div className="flex items-center gap-3 border-b border-blue-line bg-blue-soft px-4 py-3">
                  {item.itemImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.itemImage} alt="" loading="lazy" className="size-10 shrink-0 rounded-lg object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-ink">{item.itemTitle}</div>
                    {item.createdAt && <div className="text-xs text-muted">Mua ngày {new Date(item.createdAt).toLocaleDateString('vi-VN')}</div>}
                  </div>
                </div>

                <div className="flex flex-col gap-2 px-4 py-3">
                  {codeData.isPlain
                    ? line('code', undefined, codeData.value)
                    : codeData.isAccountType
                      ? <>
                          {codeData.account && line('acc', 'Tài khoản', codeData.account)}
                          {codeData.password && line('pwd', 'Mật khẩu', codeData.password)}
                        </>
                      : codeData.entries.map(({ key, value }) => line(key, key, value))
                  }
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AccountCard>
  )
}
