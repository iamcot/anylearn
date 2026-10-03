'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getUserItemCodes, ItemCode } from '@/lib/api'

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

export default function CourseCodesPage() {
  const { token } = useAuth()
  const [codes, setCodes] = useState<ItemCode[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    getUserItemCodes(token).then(data => { setCodes(data); setLoading(false) })
  }, [token])

  const handleCopy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const CopyBtn = ({ text, id }: { text: string; id: string }) => (
    <button
      onClick={() => handleCopy(text, id)}
      className={`shrink-0 px-2 py-1 rounded text-xs font-bold border-0 cursor-pointer transition-colors
        ${copiedKey === id ? 'bg-green-soft text-green-dark' : 'bg-blue-soft text-blue hover:bg-blue hover:text-white'}`}>
      {copiedKey === id ? '✓' : '📋'}
    </button>
  )

  return (
    <div className="bg-white border border-line rounded-card overflow-hidden">
      <div className="border-b border-line px-5 py-4">
        <h2 className="m-0 text-lg font-black text-ink">Mã code khóa học</h2>
        <p className="m-0 mt-1 text-xs text-muted">Thông tin đăng nhập các khóa học kỹ thuật số của bạn</p>
      </div>

      {loading ? (
        <div className="p-5 text-muted text-sm">Đang tải...</div>
      ) : codes.length === 0 ? (
        <div className="p-10 text-center text-muted text-sm">Chưa có mã code nào.</div>
      ) : (
        <div className="p-5 flex flex-col gap-4">
          {codes.map(item => {
            const codeData = parseCode(item.code)
            return (
              <div key={item.codeId} className="border border-line rounded-xl overflow-hidden">
                {/* Header */}
                <div className="bg-blue-soft border-b border-[#d8e9f8] px-4 py-3 flex items-center gap-3">
                  {item.itemImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.itemImage} alt={item.itemTitle} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-ink truncate">{item.itemTitle}</div>
                    {item.createdAt && (
                      <div className="text-xs text-muted">
                        Mua ngày {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Code body */}
                <div className="px-4 py-3 flex flex-col gap-2">
                  {codeData.isPlain ? (
                    /* Plain string code */
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-bg text-ink font-mono text-sm px-3 py-2 rounded-lg tracking-widest overflow-hidden text-ellipsis whitespace-nowrap">
                        {codeData.value}
                      </code>
                      <CopyBtn text={codeData.value} id={`${item.codeId}`} />
                    </div>
                  ) : codeData.isAccountType ? (
                    /* JSON with account/password */
                    <>
                      {codeData.account && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted w-20 shrink-0">Tài khoản</span>
                          <code className="flex-1 bg-bg text-ink font-mono text-sm px-3 py-1.5 rounded-lg">{codeData.account}</code>
                          <CopyBtn text={codeData.account} id={`${item.codeId}-acc`} />
                        </div>
                      )}
                      {codeData.password && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted w-20 shrink-0">Mật khẩu</span>
                          <code className="flex-1 bg-bg text-ink font-mono text-sm px-3 py-1.5 rounded-lg">{codeData.password}</code>
                          <CopyBtn text={codeData.password} id={`${item.codeId}-pwd`} />
                        </div>
                      )}
                    </>
                  ) : (
                    /* JSON with other keys — show each key-value */
                    codeData.entries.map(({ key, value }) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-xs text-muted w-20 shrink-0 capitalize">{key}</span>
                        <code className="flex-1 bg-bg text-ink font-mono text-sm px-3 py-1.5 rounded-lg">{value}</code>
                        <CopyBtn text={value} id={`${item.codeId}-${key}`} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
