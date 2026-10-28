'use client'

import { useEffect, useRef, useState } from 'react'
import { saveProgress, type PlayInfo, type ProgressResult } from '@/lib/api/learn'
import { videoSource } from '@/lib/explore/media'
import { watchStep } from '@/lib/learn/rules'

type HlsInstance = import('hls.js').default

const SAVE_EVERY_MS = 15000

interface Props {
  lesson: PlayInfo
  token: string | null
  learnerId: number | null
  /** Last digits of the viewer's phone, drawn faintly over the video. */
  mark: string | null
  onProgress: (result: ProgressResult) => void
  onEnded: () => void
}

/**
 * Plays one lesson and keeps its progress: starts where the learner stopped, counts real playing time (seeking adds
 * nothing), saves every 15 seconds, on pause, at the end and when the page is left. Visitors watching a free lesson
 * are not saved. A YouTube link or a reading has a "Đánh dấu đã học" button instead.
 */
export default function LessonPlayer({ lesson, token, learnerId, mark, onProgress, onEnded }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const watched = useRef(0)
  const lastTime = useRef<number | null>(null)
  const latest = useRef({ lesson, token, learnerId, onProgress })
  const [marking, setMarking] = useState(false)
  const [playError, setPlayError] = useState<string | null>(null)
  const source = lesson.url ? videoSource(lesson.url) : null

  useEffect(() => {
    latest.current = { lesson, token, learnerId, onProgress }
  })

  // send what was watched since the last save
  const flush = (keepalive = false) => {
    const { lesson: l, token: t, learnerId: lid, onProgress: cb } = latest.current
    const video = videoRef.current
    if (!t || !video) return
    const delta = Math.floor(watched.current)
    watched.current -= delta
    saveProgress(t, { lessonId: l.id, learnerId: lid, positionSeconds: Math.floor(video.currentTime), watchedDelta: delta }, keepalive)
      .then(res => { if (res.data) cb(res.data) })
  }

  // attach the stream: Safari plays .m3u8 itself, other browsers through hls.js
  useEffect(() => {
    const video = videoRef.current
    if (!video || !source || source.kind === 'youtube') return
    let hls: HlsInstance | null = null
    let cancelled = false
    watched.current = 0
    lastTime.current = null
    setPlayError(null)
    if (source.kind === 'hls') {
      // hls.js first wherever it works (recent Chrome claims native HLS but plays signed playlists badly); native only on iPhone
      import('hls.js').then(({ default: Hls }) => {
        if (cancelled) return
        if (!Hls.isSupported()) {
          if (video.canPlayType('application/vnd.apple.mpegurl')) video.src = source.src
          else setPlayError('Trình duyệt không hỗ trợ phát video này')
          return
        }
        const player = new Hls({ startPosition: lesson.positionSeconds || -1 })
        hls = player
        // hls.js is silent by default: show what failed (HTTP code of the request, error type) instead of a still poster
        player.on(Hls.Events.ERROR, (_event, data) => {
          if (!data.fatal) return
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR) { player.recoverMediaError(); return }
          const code = data.response?.code
          console.warn('[lesson player]', data.type, data.details, code ?? '', data.response?.url ?? '')
          setPlayError(`${data.details}${code ? ` (HTTP ${code})` : ''}`)
        })
        player.loadSource(source.src)
        player.attachMedia(video)
      })
    } else {
      video.src = source.src
    }
    const start = () => { if (lesson.positionSeconds > 0 && video.currentTime < 1) video.currentTime = lesson.positionSeconds }
    video.addEventListener('loadedmetadata', start)
    return () => {
      cancelled = true
      video.removeEventListener('loadedmetadata', start)
      flush()
      hls?.destroy()
      video.removeAttribute('src')
      video.load()
    }
    // the lesson id is the identity of the stream; a new signed link for the same lesson must not restart it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id])

  // save every 15 s while playing, and when the tab is hidden or closed
  useEffect(() => {
    const timer = window.setInterval(() => { if (videoRef.current && !videoRef.current.paused) flush() }, SAVE_EVERY_MS)
    const hide = () => { if (document.visibilityState === 'hidden') flush(true) }
    const leave = () => flush(true)
    document.addEventListener('visibilitychange', hide)
    window.addEventListener('pagehide', leave)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', hide)
      window.removeEventListener('pagehide', leave)
    }
  }, [lesson.id])

  const markDone = async () => {
    if (!token) return
    setMarking(true)
    const res = await saveProgress(token, { lessonId: lesson.id, learnerId, positionSeconds: lesson.durationSeconds ?? 0, watchedDelta: 0, done: true })
    setMarking(false)
    if (res.data) onProgress(res.data)
  }

  const doneButton = token && (
    <button type="button" onClick={markDone} disabled={marking || lesson.completed}
      className={`btn mt-3 py-2 text-sm ${lesson.completed ? 'btn--outline' : 'btn--green'}`}>
      {lesson.completed ? '✓ Đã học xong bài này' : 'Đánh dấu đã học'}
    </button>
  )

  if (lesson.type === 'text') {
    return (
      <div className="rounded-card bg-white p-5 shadow-card">
        <div className="whitespace-pre-line leading-[1.8] text-ink">{lesson.text}</div>
        {doneButton}
      </div>
    )
  }

  if (source?.kind === 'youtube') {
    return (
      <div>
        <div className="relative aspect-video overflow-hidden rounded-card bg-black">
          <iframe src={source.src} title={lesson.title} className="absolute inset-0 size-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
        </div>
        {doneButton}
      </div>
    )
  }

  return (
    <div className="relative aspect-video overflow-hidden rounded-card bg-black">
      <video ref={videoRef} controls playsInline poster={lesson.posterUrl ?? undefined} className="absolute inset-0 size-full"
        controlsList="nodownload" onContextMenu={e => e.preventDefault()}
        onTimeUpdate={e => {
          const now = e.currentTarget.currentTime
          watched.current += watchStep(lastTime.current, now)
          lastTime.current = now
        }}
        onError={() => setPlayError('Trình duyệt không mở được video')}
        onSeeking={() => { lastTime.current = null }}
        onPause={() => { lastTime.current = null; flush() }}
        onEnded={() => { flush(); onEnded() }} />
      {playError && (
        <div className="absolute inset-x-0 bottom-0 bg-black/75 p-3 text-center text-sm text-white">
          Không phát được video. Hãy tải lại trang; nếu vẫn lỗi, báo cho anyLEARN kèm mã: {playError}
        </div>
      )}
      {mark && <span className="pointer-events-none absolute right-3 top-3 select-none text-xs font-bold text-white/30">{mark}</span>}
    </div>
  )
}
