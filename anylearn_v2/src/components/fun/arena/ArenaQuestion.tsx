'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { answerArena, getArenaQuestion, type ArenaQuestion as Question } from '@/lib/api/arena'
import { answerEndsAt, endsAt, questionAt, type ArenaPhase, type ArenaTiming } from '@/lib/arena/timeline'

const LETTERS = ['A', 'B', 'C', 'D']

/**
 * The full-screen question of Đấu trường Leo. The countdown, the time bar and the way back to the lobby all follow the server clock
 * (`now`), so every phone moves together. The right answer is asked from the server only when the time is up; until then the person
 * only sees that their choice was locked and how many others have answered.
 */
export default function ArenaQuestion({ token, sessionId, title, timing, phase, now, sync }: {
  token: string; title?: string; sessionId: number; timing: ArenaTiming; phase: ArenaPhase; now: number; sync: (serverNow: number) => void
}) {
  const qNo = phase.qNo
  const [question, setQuestion] = useState<Question | null>(null)
  const [picked, setPicked] = useState<number | null>(null)
  const [error, setError] = useState('')
  const away = useRef(false)
  const loadedFor = useRef(0)
  // the page gives this component a new `key` for every question, so all of this state starts clean

  // the page being hidden while answering is reported with the answer
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') away.current = true }
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [])

  const load = useCallback(async (): Promise<boolean> => {
    const { data, error: err } = await getArenaQuestion(token, sessionId, qNo)
    if (!data) { setError(err ?? ''); return false }
    sync(data.serverNow)
    setQuestion(data)
    setError('')
    return true
  }, [token, sessionId, qNo, sync])

  const msToStart = questionAt(timing, qNo) - now
  const over = now >= answerEndsAt(timing, qNo)
  const wantQuestion = phase.kind !== 'countdown' || msToStart <= 1200

  // fetch the question when its time comes (a few tries, the first moment can be a hair early on the server)
  useEffect(() => {
    if (!wantQuestion || loadedFor.current === qNo) return
    loadedFor.current = qNo
    let cancelled = false
    ;(async () => {
      for (let i = 0; i < 4 && !cancelled; i++) {
        if (await load()) return
        await new Promise(r => setTimeout(r, 600))
      }
    })()
    return () => { cancelled = true }
  }, [wantQuestion, qNo, load])

  // after a choice, refresh how many have answered every 3 seconds
  useEffect(() => {
    if (picked === null || over) return
    const id = setInterval(load, 3000)
    return () => clearInterval(id)
  }, [picked, over, load])

  // when the time is up ask for the right answer (retry until the server says it is over)
  useEffect(() => {
    if (!over || !question || question.over) return
    const id = setInterval(load, 1000)
    const first = setTimeout(load, 0)
    return () => { clearInterval(id); clearTimeout(first) }
  }, [over, question, load])

  async function choose(option: number) {
    if (picked !== null || over || !question) return
    setPicked(option)
    const { data, error: err } = await answerArena(token, sessionId, qNo, option, away.current)
    if (!data) {
      setPicked(null)
      setError(err ?? 'Không gửi được đáp án')
    }
  }

  const total = timing.questionCount
  const header = (
    <div className="flex items-center justify-between gap-2 text-xs font-bold text-[#b9c8dd]">
      <Link href="/fun" className="rounded-full bg-white/10 px-2.5 py-1 text-[#b9c8dd] no-underline">‹ Thoát</Link>
      <span className="min-w-0 truncate rounded-full bg-white/10 px-2.5 py-1">{title ?? 'Đấu trường Leo'}</span>
      <span className="rounded-full bg-white/10 px-2.5 py-1">Câu {qNo}/{total}</span>
    </div>
  )

  const shell = (children: React.ReactNode) => (
    <div className="fixed inset-0 z-[100] overflow-auto text-[#e7eefb]" style={{ background: 'radial-gradient(260px 200px at 50% 0, rgba(57,255,136,.15), transparent 70%), linear-gradient(170deg, #0d2a4d, #071b33)' }}>
      <div className="mx-auto flex min-h-full w-full max-w-[560px] flex-col px-4 pb-5 pt-4">{header}{children}</div>
    </div>
  )

  if (phase.kind === 'countdown') {
    const n = Math.max(1, Math.ceil(msToStart / 1000))
    return shell(
      <div className="grid flex-1 place-items-center text-center">
        <div>
          <div key={n} className="arena-count text-[120px] font-black leading-none tabular-nums text-white [text-shadow:0_0_30px_rgba(57,255,136,.6)]">{n}</div>
          <p className="mt-1.5 text-[#b9c8dd]">Câu hỏi sắp bắt đầu, sẵn sàng nhé!</p>
        </div>
      </div>,
    )
  }

  if (!question) {
    return shell(<div className="grid flex-1 place-items-center text-center text-[#b9c8dd]">{error || 'Đang tải câu hỏi…'}</div>)
  }

  const expires = question.expiresAt
  const left = Math.max(0, expires - now)
  const secs = Math.ceil(left / 1000)
  const mine = picked ?? question.mine?.option ?? null
  const right = question.rightOption
  const reveal = question.over && right !== undefined
  const lobbyIn = Math.max(0, Math.ceil((endsAtOfReveal(timing, qNo) - now) / 1000))

  return shell(
    <>
      <div className="my-3 h-2 overflow-hidden rounded-full bg-white/10"><i className="block h-full rounded-full bg-gradient-to-r from-[#39ff88] to-[#ffca05] transition-[width] duration-200 ease-linear" style={{ width: `${Math.min(100, (left / (timing.answerSeconds * 1000)) * 100)}%` }} /></div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[#9fe8bf]">{question.topicLabel} · {question.levelLabel}</span>
        <span className="text-base font-bold tabular-nums text-white">{secs}s</span>
      </div>
      {mine !== null && !reveal && (
        <div className="mt-2 flex items-center gap-1.5 text-[13px] font-bold text-[#ffe27a]" aria-live="polite">
          <i className="arena-blink size-[7px] rounded-full bg-[#ffe27a]" />Đã chọn · đang chờ người khác trả lời ({question.answeredCount}/{Math.max(question.inRoom, question.answeredCount)})
        </div>
      )}
      <h2 className="my-2 mb-3.5 text-[19px] font-extrabold leading-snug text-white [text-wrap:balance]">{question.body}</h2>
      <div className="grid gap-[9px]">
        {question.options.map((text, i) => {
          let tone = 'text-ink'
          let ring = ''
          let letter = 'bg-[#eef2f7]'
          if (reveal && i === right) { tone = 'bg-[#d8ffe8]'; ring = 'outline outline-[3px] outline-green'; letter = 'bg-green text-white' }
          else if (reveal && i === mine) { tone = 'bg-[#ffe1e5]'; ring = 'outline outline-[3px] outline-red'; letter = 'bg-red text-white' }
          else if (i === mine) ring = 'outline outline-[3px] outline-yellow'
          return (
            <button key={i} type="button" disabled={mine !== null || over} onClick={() => choose(i)}
              className={`flex min-h-12 w-full items-center gap-2.5 rounded-[14px] border-0 p-3 text-left text-base font-bold ${tone === 'text-ink' ? 'bg-white text-ink' : `${tone} text-ink`} ${ring} ${mine === null && !over ? 'cursor-pointer' : 'cursor-default'}`}>
              <b className={`grid size-[26px] shrink-0 place-items-center rounded-lg ${letter}`}>{LETTERS[i]}</b>
              <span className="min-w-0">{text}</span>
            </button>
          )
        })}
      </div>
      {reveal && (
        <div className={`mt-3.5 rounded-2xl p-3 text-center font-extrabold ${mine === right ? 'bg-[#39ff88]/15 text-[#39ff88]' : 'bg-red/20 text-[#ffb3bd]'}`}>
          {mine === right ? 'Chính xác! +1 điểm' : mine === null ? 'Hết giờ' : 'Chưa đúng rồi'}
          {mine !== right && <small className="mt-0.5 block font-semibold text-[#b9c8dd]">Đáp án đúng: {question.options[right!]}</small>}
          {question.explanation && <small className="mt-0.5 block font-medium text-[#b9c8dd]">{question.explanation}</small>}
        </div>
      )}
      {error && <p className="mt-2 text-center text-[13px] font-bold text-[#ffb3bd]" role="alert">{error}</p>}
      <p className="mt-auto pt-3 text-center text-xs text-[#8ea3bf]">
        {reveal ? `Về sảnh sau ${lobbyIn} giây…` : mine !== null ? 'Đáp án hiện khi hết giờ' : 'Không có vật phẩm trợ giúp ở Đấu trường'}
      </p>
    </>,
  )
}

/** The moment the screen goes back to the lobby: the end of the answer reveal. */
function endsAtOfReveal(t: ArenaTiming, qNo: number): number {
  return Math.min(answerEndsAt(t, qNo) + t.revealSeconds * 1000, endsAt(t))
}
