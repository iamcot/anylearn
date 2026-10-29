'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getArenaLobby, type ArenaLobby as Lobby } from '@/lib/api/arena'
import { type ArenaTiming } from '@/lib/arena/timeline'
import ArenaLobby from '@/components/fun/arena/ArenaLobby'
import ArenaQuestion from '@/components/fun/arena/ArenaQuestion'
import { useArenaClock } from '@/components/fun/arena/useArenaClock'

function timingOf(l: Lobby): ArenaTiming | null {
  if (!l.sessionId || l.startsAt == null || l.openAt == null) return null
  return {
    startsAt: l.startsAt, openAt: l.openAt, questionCount: l.questionCount ?? 20, countdownSeconds: l.countdownSeconds ?? 10,
    answerSeconds: l.answerSeconds ?? 15, revealSeconds: l.revealSeconds ?? 5, gapSeconds: l.gapSeconds ?? 60,
  }
}

/** Đấu trường Leo: one route with two views, the lobby and the question. The view follows the server clock, never a button. */
export default function ArenaPage() {
  const { token } = useAuth()
  const [lobby, setLobby] = useState<Lobby | null>(null)
  const [error, setError] = useState('')
  const timing = lobby ? timingOf(lobby) : null
  const { now, phase, sync } = useArenaClock(timing)

  const load = useCallback(async () => {
    if (!token) return
    const { data, error: err } = await getArenaLobby(token)
    if (err || !data) return setError(err ?? 'Không tải được Đấu trường Leo')
    setError('')
    sync(data.serverNow)
    setLobby(data)
  }, [token, sync])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  const kind = phase?.kind
  const inQuestion = kind === 'countdown' || kind === 'question' || kind === 'reveal'

  // the lobby asks for the board every 5 seconds; a question screen does not
  useEffect(() => {
    if (inQuestion) return
    const id = setInterval(load, 5000)
    return () => clearInterval(id)
  }, [inQuestion, load])

  // back from a question: get the new board at once (the cleanup runs when the question screen goes away)
  useEffect(() => {
    if (!inQuestion) return
    return () => { load() }
  }, [inQuestion, load])

  // the evening is over: ask again so the lobby can offer the result and the next day
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (kind === 'ended') load()
  }, [kind, load])

  if (!token) return null
  if (error && !lobby) return <p className="mx-auto max-w-[720px] px-4 pt-8 text-warn-text">{error}</p>
  if (!lobby) return <div className="mx-auto mt-6 h-[200px] max-w-[720px] animate-pulse rounded-[22px] bg-slate-200" />
  if (!lobby.sessionId || !timing || !phase) {
    return (
      <div className="mx-auto max-w-[720px] px-4 pb-28 pt-8 text-center">
        <h1 className="m-0 text-2xl font-black">Đấu trường Leo</h1>
        <p className="mt-2 text-muted">Hiện chưa có trận nào được mở. Bạn quay lại sau nhé!</p>
      </div>
    )
  }

  if (inQuestion && phase.qNo > 0) {
    return <ArenaQuestion key={phase.qNo} token={token} sessionId={lobby.sessionId} timing={timing} phase={phase} now={now} sync={sync} />
  }
  return <ArenaLobby token={token} lobby={lobby} phase={phase} now={now} onRegistered={registered => setLobby(l => (l ? { ...l, registered } : l))} />
}
