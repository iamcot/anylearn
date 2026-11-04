'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { answerGuestQuiz, getGuestQuiz, type GuestAnswer, type GuestQuiz } from '@/lib/api/gamification'
import { GUEST_QUIZ_GAME, markSignupGame, scoreLine } from '@/lib/guestQuiz/store'
import { enqueueRewards } from '@/lib/journey/store'
import { Leo } from '@/components/fun/Leo'
import BrandText from '@/components/fun/BrandText'
import { ListSkeleton } from '@/components/PageSkeleton'

const LETTERS = ['A', 'B', 'C', 'D']

// Guest quiz (plan 21): a few parenting questions without an account, then the result and "Đăng ký để lưu điểm + nhận quà".
export default function GuestQuizPage() {
  const { token, openAuthModal } = useAuth()
  const [quiz, setQuiz] = useState<GuestQuiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [answer, setAnswer] = useState<GuestAnswer | null>(null)
  const [correct, setCorrect] = useState(0)
  const [finished, setFinished] = useState(false)
  const signedUpHere = useRef(false)
  const wasSignedIn = useRef<boolean | null>(null)

  useEffect(() => { getGuestQuiz().then(q => { setQuiz(q); setLoading(false) }) }, [])

  // Registering from the result screen: Leo hands over the sign-up gift (paid by the server on registration).
  useEffect(() => {
    if (wasSignedIn.current === null) { wasSignedIn.current = !!token; return }
    if (token && !wasSignedIn.current && signedUpHere.current && quiz && quiz.signupCoins > 0) {
      enqueueRewards([{ kind: 'quiz', key: 'guest_quiz', label: 'Quà đăng ký sau quiz thử', coins: quiz.signupCoins }], quiz.coinName)
    }
    wasSignedIn.current = !!token
  }, [token, quiz])

  if (loading) return <main className="container max-w-[560px] py-6"><ListSkeleton /></main>
  if (!quiz || !quiz.enabled || quiz.questions.length === 0) {
    return <main className="container max-w-[560px] py-10 text-center text-sm text-muted">Quiz thử đang tạm đóng. <Link href="/fun" className="font-bold text-blue">Xem Vui học</Link></main>
  }

  const total = quiz.questions.length
  const q = quiz.questions[index]

  const pick = async (option: number) => {
    if (picked != null) return
    setPicked(option)
    const res = await answerGuestQuiz(q.id, option)
    setAnswer(res)
    if (res?.correct) setCorrect(c => c + 1)
  }

  const next = () => {
    if (index + 1 >= total) { setFinished(true); return }
    setIndex(i => i + 1)
    setPicked(null)
    setAnswer(null)
  }

  const register = () => {
    markSignupGame(GUEST_QUIZ_GAME)
    signedUpHere.current = true
    openAuthModal('register')
  }

  if (finished) {
    return (
      <main className="container flex max-w-[560px] flex-col items-center gap-3 py-8 text-center">
        <Leo waving className="w-28" />
        <h1 className="m-0 text-2xl font-extrabold text-ink">Bạn đúng {correct}/{total} câu</h1>
        <p className="m-0 text-sm text-muted">{scoreLine(correct, total)}</p>
        {token ? (
          <Link href="/fun/quiz" className="btn btn--green mt-2 no-underline">Chơi tiếp Leo rank</Link>
        ) : (
          <>
            <button type="button" onClick={register} className="btn btn--green mt-2 w-full max-w-[320px] py-3.5 text-base">
              Đăng ký để lưu điểm + nhận quà
            </button>
            {quiz.signupCoins > 0 && <p className="m-0 text-sm font-bold text-green"><BrandText text={`Leo tặng ${quiz.signupCoins} ${quiz.coinName} khi bạn đăng ký`} /></p>}
            <p className="m-0 text-xs text-muted">Tài khoản anyLEARN giúp bạn tìm lớp hợp với bé, chơi Vui học mỗi ngày và nhận ưu đãi.</p>
          </>
        )}
        <button type="button" onClick={() => { setIndex(0); setPicked(null); setAnswer(null); setCorrect(0); setFinished(false); getGuestQuiz().then(setQuiz) }}
          className="cursor-pointer border-0 bg-transparent text-sm font-bold text-blue">Chơi lại câu khác</button>
      </main>
    )
  }

  return (
    <main className="container flex max-w-[560px] flex-col gap-4 py-5">
      <div className="flex items-center gap-3">
        <Leo className="size-14 shrink-0" />
        <div>
          <h1 className="m-0 text-lg font-extrabold text-ink">Đố vui nuôi dạy con</h1>
          <p className="m-0 text-xs text-muted">Câu {index + 1}/{total} · không cần đăng ký</p>
        </div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full bg-green" style={{ width: `${(index * 100) / total}%` }} /></div>
      <p className="m-0 rounded-card border border-line bg-white p-4 text-base font-bold text-ink">{q.body}</p>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {q.options.map((opt, i) => {
          const isRight = answer && answer.correctOption === i
          const isWrongPick = answer && picked === i && !answer.correct
          const tone = isRight ? 'border-green bg-green-soft' : isWrongPick ? 'border-red bg-red-soft' : picked === i ? 'border-blue bg-blue-soft' : 'border-line bg-white'
          return (
            <li key={i}>
              <button type="button" disabled={picked != null} onClick={() => pick(i)}
                className={`flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left text-sm font-semibold text-ink ${tone}`}>
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white text-xs font-extrabold">{LETTERS[i]}</span>
                <span className="flex-1">{opt}</span>
              </button>
            </li>
          )
        })}
      </ul>
      {answer && (
        <div className="rounded-card border border-line bg-white p-4">
          <p className={`m-0 text-sm font-extrabold ${answer.correct ? 'text-green' : 'text-red'}`}>{answer.correct ? 'Chính xác!' : `Đáp án đúng là ${LETTERS[answer.correctOption]}`}</p>
          {answer.explanation && <p className="m-0 mt-1 text-sm text-muted">{answer.explanation}</p>}
          <button type="button" onClick={next} className="btn btn--green mt-3 w-full">{index + 1 >= total ? 'Xem kết quả' : 'Câu tiếp'}</button>
        </div>
      )}
      {picked != null && !answer && <p className="m-0 text-center text-sm text-muted">Đang chấm…</p>}
    </main>
  )
}
