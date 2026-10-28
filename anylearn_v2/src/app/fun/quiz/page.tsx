'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { ChevronLeftIcon } from '@/components/icons'
import BrandText from '@/components/fun/BrandText'
import LobbyView from '@/components/fun/quiz/LobbyView'
import QuestionView from '@/components/fun/quiz/QuestionView'
import ResultView from '@/components/fun/quiz/ResultView'
import type { Prep } from '@/components/fun/quiz/PrepRow'
import { deactivateQuizPack, getQuizMe, openQuizBox, startQuiz, type ItemKey, type QuizMe, type QuizQuestion, type QuizResult } from '@/lib/api/quiz'
import { getShop, type Shop } from '@/lib/api/shop'
import { sendDevice } from '@/lib/api/stickers'
import { deviceId } from '@/lib/stickers/device'
import { clockOffset, toggleMult } from '@/lib/quiz/rules'

type View =
  | { kind: 'lobby' }
  | { kind: 'question'; question: QuizQuestion; offset: number }
  | { kind: 'result'; result: QuizResult }

const NO_PREP: Prep = { mult: null, shield: false, topic: null }

export default function QuizPage() {
  const { token } = useAuth()
  const [me, setMe] = useState<QuizMe | null>(null)
  const [shop, setShop] = useState<Shop | null>(null)
  // when `me` was read: the energy countdown on the lobby counts from it
  const [meAt, setMeAt] = useState(() => Date.now())
  const [view, setView] = useState<View>({ kind: 'lobby' })
  const [prep, setPrep] = useState<Prep>(NO_PREP)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [boxText, setBoxText] = useState('')

  const load = useCallback(async () => {
    if (!token) return
    const [{ data, error: err }, shopResult] = await Promise.all([getQuizMe(token), getShop(token)])
    if (err || !data) return setError(err ?? 'Không tải được Leo rank')
    setError('')
    setMe(data)
    setMeAt(Date.now())
    // the shop is an extra: Leo rank still plays when it does not load
    setShop(shopResult.data)
  }, [token])

  const takeMe = useCallback((next: QuizMe) => {
    setMe(next)
    setMeAt(Date.now())
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  useEffect(() => {
    const id = deviceId()
    if (token && id) sendDevice(token, id)
  }, [token])

  const start = async () => {
    if (!token) return
    setBusy(true)
    setError('')
    // a training pack in use takes no items
    const practice = me?.activePackId != null
    const { data, error: err } = await startQuiz(token, practice ? {} : { mult: prep.mult, shield: prep.shield, topic: prep.topic })
    setBusy(false)
    if (err || !data) return setError(err ?? 'Không bắt đầu được')
    setPrep(NO_PREP)
    setBoxText('')
    setView({ kind: 'question', question: data, offset: clockOffset(data.serverNow) })
  }

  const openBox = async () => {
    if (!token) return
    setBusy(true)
    const { data, error: err } = await openQuizBox(token)
    setBusy(false)
    if (err || !data) return setError(err ?? 'Không mở được hộp quà')
    const names = data.given.map(key => me?.itemList.find(r => r.key === key)?.label ?? key)
    setBoxText(`Bạn nhận được: ${names.join(', ')}`)
    load()
  }

  const leavePractice = async () => {
    if (!token) return
    setBusy(true)
    const { data, error: err } = await deactivateQuizPack(token)
    setBusy(false)
    if (err || !data) return setError(err ?? 'Không thoát được tập luyện')
    takeMe(data)
  }

  const done = useCallback((result: QuizResult) => setView({ kind: 'result', result }), [])
  const backToLobby = () => { setView({ kind: 'lobby' }); setBoxText(''); load() }

  const prepHandlers = {
    onMult: (item: ItemKey) => setPrep(p => ({ ...p, mult: toggleMult(p.mult, item) })),
    onShield: () => setPrep(p => ({ ...p, shield: !p.shield })),
    onTopic: (topic: string | null) => setPrep(p => ({ ...p, topic })),
  }

  const inGame = view.kind !== 'lobby'
  return (
    <div className="mx-auto max-w-[720px] px-4 pb-28 pt-5 lg:px-0 lg:pb-12 lg:pt-8">
      {view.kind === 'lobby'
        ? <Link href="/fun" className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-text no-underline"><ChevronLeftIcon className="size-4" /> Vui học</Link>
        : view.kind === 'result'
          ? <button type="button" onClick={backToLobby} className="inline-flex min-h-11 cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-sm font-bold text-text"><ChevronLeftIcon className="size-4" /> Về sảnh</button>
          : <div className="min-h-11" />}
      {!inGame && <h1 className="m-0 text-2xl font-black lg:text-3xl"><BrandText text="Leo rank" /></h1>}
      {error && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-warn-text" role="alert">{error}</p>}
      {!error && !me && <div className="mt-4 h-60 animate-pulse rounded-2xl bg-slate-200" />}

      {me && token && !me.enabled && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Leo rank đang tạm nghỉ, hạng và vật phẩm của bạn vẫn được giữ nguyên.</p>}

      {me && token && me.enabled && view.kind === 'lobby' && (
        <div className="mt-3 grid gap-4">
          {me.forfeited && <p className="m-0 rounded-xl bg-amber-50 p-3 text-sm text-amber-900" role="status">Câu bỏ dở lần trước đã tính là sai.</p>}
          <LobbyView token={token} me={me} shop={shop} fetchedAt={meAt} prep={prep} busy={busy} boxText={boxText} onStart={start} onOpenBox={openBox}
            onLeavePractice={leavePractice} onMe={takeMe} onChanged={load} {...prepHandlers} />
        </div>
      )}

      {me && token && view.kind === 'question' && (
        <div className="mt-1"><QuestionView key={view.question.attemptId} token={token} initial={view.question} initialOffset={view.offset} total={me.seconds} onDone={done} /></div>
      )}

      {me && view.kind === 'result' && (
        <div className="mt-1"><ResultView me={me} result={view.result} prep={prep} busy={busy} onAgain={start} onLobby={backToLobby} {...prepHandlers} /></div>
      )}
    </div>
  )
}
