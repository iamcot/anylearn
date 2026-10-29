'use client'

import { useEffect, useRef, useState } from 'react'
import { saveProgress, type PlayInfo, type ProgressResult } from '@/lib/api/learn'
import { videoSource } from '@/lib/explore/media'
import { SEEK_SECONDS, SPEEDS, seekTarget, speedLabel, tapZone, validSpeed, watchStep } from '@/lib/learn/rules'

type HlsInstance = import('hls.js').default

const SAVE_EVERY_MS = 15000
const DOUBLE_TAP_MS = 300
const SPEED_KEY = 'learn:speed'

/** What the page can ask of the player: jump to a note, read the time for a new note. */
export interface PlayerControl {
  seekTo: (seconds: number) => void
  time: () => number
}

interface Props {
  lesson: PlayInfo
  token: string | null
  learnerId: number | null
  /** Last digits of the viewer's phone, drawn faintly over the video. */
  mark: string | null
  onProgress: (result: ProgressResult) => void
  onEnded: () => void
  controlRef?: React.MutableRefObject<PlayerControl | null>
  /** A reading or link lesson: "Học xong, sang bài tiếp" marks it and moves on. */
  hasNext?: boolean
  onNext?: () => void
}

function storedSpeed(): number {
  if (typeof window === 'undefined') return 1
  try { return validSpeed(window.localStorage.getItem(SPEED_KEY)) } catch { return 1 }
}

/**
 * Plays one lesson and keeps its progress: starts where the learner stopped, counts real playing time (seeking adds
 * nothing), saves every 15 seconds, on pause, at the end and when the page is left. Visitors watching a free lesson
 * are not saved. Speed (remembered), double tap on the left or right side to jump 10 seconds, and our own full screen
 * button (the full screen box carries the phone watermark; the native one would drop it). A YouTube link or a reading
 * has a "Đánh dấu đã học" button instead.
 */
export default function LessonPlayer({ lesson, token, learnerId, mark, onProgress, onEnded, controlRef, hasNext = false, onNext }: Props) {
  const boxRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const watched = useRef(0)
  const lastTime = useRef<number | null>(null)
  const latest = useRef({ lesson, token, learnerId, onProgress })
  const lastTap = useRef<{ at: number; zone: 'left' | 'right' } | null>(null)
  const tapTimer = useRef<number | null>(null)
  const flashTimer = useRef<number | null>(null)
  const [marking, setMarking] = useState(false)
  const [playError, setPlayError] = useState<string | null>(null)
  // the player only mounts after the lesson was fetched in the browser, so reading the saved speed here is safe
  const [speed, setSpeed] = useState(storedSpeed)
  const [speedOpen, setSpeedOpen] = useState(false)
  const [flash, setFlash] = useState<'left' | 'right' | null>(null)
  const [full, setFull] = useState(false)
  const speedRef = useRef(speed)
  const source = lesson.url ? videoSource(lesson.url) : null

  useEffect(() => {
    latest.current = { lesson, token, learnerId, onProgress }
  })

  const applySpeed = (value: number) => {
    speedRef.current = value
    if (videoRef.current) videoRef.current.playbackRate = value
  }

  const chooseSpeed = (value: number) => {
    setSpeed(value)
    setSpeedOpen(false)
    applySpeed(value)
    try { window.localStorage.setItem(SPEED_KEY, String(value)) } catch { /* private window: the speed is kept for this lesson only */ }
  }

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

  // attach the stream: hls.js first wherever it works (recent Chrome claims native HLS but plays signed playlists badly), native only on iPhone
  useEffect(() => {
    const video = videoRef.current
    if (!video || !source || source.kind === 'youtube') return
    let hls: HlsInstance | null = null
    let cancelled = false
    watched.current = 0
    lastTime.current = null
    setPlayError(null)
    if (source.kind === 'hls') {
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
    const start = () => {
      video.playbackRate = speedRef.current
      if (lesson.positionSeconds > 0 && video.currentTime < 1) video.currentTime = lesson.positionSeconds
    }
    const keepSpeed = () => { video.playbackRate = speedRef.current }
    video.addEventListener('loadedmetadata', start)
    video.addEventListener('play', keepSpeed)
    return () => {
      cancelled = true
      video.removeEventListener('loadedmetadata', start)
      video.removeEventListener('play', keepSpeed)
      flush()
      hls?.destroy()
      video.removeAttribute('src')
      video.load()
    }
    // the lesson id is the identity of the stream; a new signed link for the same lesson must not restart it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id])

  // the page jumps to a note and reads the time for a new one
  useEffect(() => {
    if (!controlRef) return
    controlRef.current = {
      seekTo: seconds => {
        const video = videoRef.current
        if (!video) return
        video.currentTime = Math.max(0, seconds)
        video.play().catch(() => {})
      },
      time: () => Math.floor(videoRef.current?.currentTime ?? 0),
    }
    return () => { controlRef.current = null }
  }, [controlRef, lesson.id])

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

  useEffect(() => {
    const change = () => {
      const on = document.fullscreenElement === boxRef.current
      setFull(on)
      if (!on) (screen.orientation as ScreenOrientation & { unlock?: () => void } | undefined)?.unlock?.()
    }
    document.addEventListener('fullscreenchange', change)
    return () => {
      document.removeEventListener('fullscreenchange', change)
      if (tapTimer.current) window.clearTimeout(tapTimer.current)
      if (flashTimer.current) window.clearTimeout(flashTimer.current)
    }
  }, [])

  const toggleFullscreen = async () => {
    const box = boxRef.current
    const video = videoRef.current
    if (!box) return
    if (document.fullscreenElement) { await document.exitFullscreen().catch(() => {}); return }
    try {
      await box.requestFullscreen()
      try { await (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> } | undefined)?.lock?.('landscape') } catch { /* desktop or a browser that refuses: stay as is */ }
    } catch {
      // iPhone Safari cannot full screen a box: its own video full screen is the only way (the watermark is lost there)
      (video as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null)?.webkitEnterFullscreen?.()
    }
  }

  const jump = (zone: 'left' | 'right') => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = seekTarget(video.currentTime, zone === 'left' ? -SEEK_SECONDS : SEEK_SECONDS, video.duration || lesson.durationSeconds)
    lastTime.current = null
    setFlash(zone)
    if (flashTimer.current) window.clearTimeout(flashTimer.current)
    flashTimer.current = window.setTimeout(() => setFlash(null), 600)
  }

  // a double tap on the left or right side jumps; a single tap there plays or pauses
  const tapSide = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.parentElement?.getBoundingClientRect()
    const zone = rect ? tapZone(event.clientX - rect.left, rect.width) : 'middle'
    if (zone === 'middle') return
    const now = Date.now()
    const previous = lastTap.current
    if (previous && previous.zone === zone && now - previous.at <= DOUBLE_TAP_MS) {
      if (tapTimer.current) window.clearTimeout(tapTimer.current)
      lastTap.current = null
      jump(zone)
      return
    }
    lastTap.current = { at: now, zone }
    if (tapTimer.current) window.clearTimeout(tapTimer.current)
    tapTimer.current = window.setTimeout(() => {
      lastTap.current = null
      const video = videoRef.current
      if (!video) return
      if (video.paused) video.play().catch(() => {}); else video.pause()
    }, DOUBLE_TAP_MS)
  }

  const markDone = async (andNext = false) => {
    if (!token) { if (andNext) onNext?.(); return }
    setMarking(true)
    const res = await saveProgress(token, { lessonId: lesson.id, learnerId, positionSeconds: lesson.durationSeconds ?? 0, watchedDelta: 0, done: true })
    setMarking(false)
    if (res.data) onProgress(res.data)
    if (andNext && res.data) onNext?.()
  }

  const doneButtons = (
    <div className="mt-3 flex flex-wrap gap-2">
      {token && !lesson.completed && (
        <button type="button" onClick={() => markDone(hasNext)} disabled={marking} className="btn btn--green min-h-11 py-2 text-sm">
          {hasNext ? 'Học xong, sang bài tiếp ›' : 'Đánh dấu đã học'}
        </button>
      )}
      {token && lesson.completed && (
        <>
          <span className="inline-flex min-h-11 items-center rounded-full bg-green-soft px-4 text-sm font-bold text-green-dark">✓ Đã học xong bài này</span>
          {hasNext && <button type="button" onClick={onNext} className="btn btn--green min-h-11 py-2 text-sm">Bài tiếp ›</button>}
        </>
      )}
      {!token && hasNext && <button type="button" onClick={onNext} className="btn btn--green min-h-11 py-2 text-sm">Bài tiếp ›</button>}
    </div>
  )

  if (lesson.type === 'text') {
    return (
      <div className="rounded-card bg-white p-5 shadow-card">
        <div className="whitespace-pre-line leading-[1.8] text-ink">{lesson.text}</div>
        {doneButtons}
      </div>
    )
  }

  if (source?.kind === 'youtube') {
    return (
      <div>
        <div className="relative aspect-video overflow-hidden rounded-card bg-black">
          <iframe src={source.src} title={lesson.title} className="absolute inset-0 size-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
        </div>
        {doneButtons}
      </div>
    )
  }

  return (
    <div ref={boxRef} tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'ArrowLeft') jump('left')
        else if (e.key === 'ArrowRight') jump('right')
        else if (e.key === 'f') toggleFullscreen()
      }}
      className="relative aspect-video overflow-hidden bg-black outline-none lg:rounded-card [&:fullscreen]:aspect-auto [&:fullscreen]:size-full [&:fullscreen]:rounded-none">
      <video ref={videoRef} controls playsInline poster={lesson.posterUrl ?? undefined} className="absolute inset-0 size-full"
        controlsList="nodownload nofullscreen" onContextMenu={e => e.preventDefault()}
        onTimeUpdate={e => {
          const now = e.currentTarget.currentTime
          watched.current += watchStep(lastTime.current, now)
          lastTime.current = now
        }}
        onError={() => setPlayError('Trình duyệt không mở được video')}
        onSeeking={() => { lastTime.current = null }}
        onPause={() => { lastTime.current = null; flush() }}
        onEnded={() => { flush(); onEnded() }} />

      {/* left and right sides catch taps for the 10 second jump; the middle and the bottom stay with the native controls */}
      <div className="pointer-events-none absolute inset-x-0 top-10 flex h-[58%] justify-between">
        <div onPointerUp={tapSide} className="pointer-events-auto w-[35%]" />
        <div onPointerUp={tapSide} className="pointer-events-auto w-[35%]" />
      </div>
      {flash && (
        <div className={`pointer-events-none absolute top-1/2 -translate-y-1/2 rounded-full bg-black/55 px-4 py-2 text-sm font-extrabold text-white ${flash === 'left' ? 'left-[12%]' : 'right-[12%]'}`}>
          {flash === 'left' ? `« ${SEEK_SECONDS} giây` : `${SEEK_SECONDS} giây »`}
        </div>
      )}

      <div className="absolute left-2 top-2 z-10">
        <button type="button" onClick={() => setSpeedOpen(o => !o)} aria-label="Tốc độ phát" aria-expanded={speedOpen}
          className="min-h-8 rounded-full bg-black/55 px-3 text-xs font-extrabold text-white">{speedLabel(speed)}</button>
        {speedOpen && (
          <ul className="absolute left-0 top-9 m-0 list-none overflow-hidden rounded-xl bg-black/80 p-1">
            {SPEEDS.map(s => (
              <li key={s}>
                <button type="button" onClick={() => chooseSpeed(s)}
                  className={`block min-h-9 w-full rounded-lg px-4 text-left text-sm font-bold ${s === speed ? 'bg-white/20 text-white' : 'text-white/80'}`}>{speedLabel(s)}</button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button type="button" onClick={toggleFullscreen} aria-label={full ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
        className="absolute right-2 top-2 z-10 grid size-8 place-items-center rounded-full bg-black/55 text-base text-white">{full ? '✕' : '⛶'}</button>

      {playError && (
        <div className="absolute inset-x-0 bottom-10 bg-black/75 p-3 text-center text-sm text-white">
          Không phát được video. Hãy tải lại trang; nếu vẫn lỗi, báo cho anyLEARN kèm mã: {playError}
        </div>
      )}
      {mark && <span className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 select-none text-xs font-bold text-white/30">{mark}</span>}
    </div>
  )
}
