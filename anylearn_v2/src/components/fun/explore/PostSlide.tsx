'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChatIcon, HeartIcon, ShareIcon } from '@/components/icons'
import type { ExplorePost } from '@/lib/api/explore'
import { countText, videoSource } from '@/lib/explore/media'

/** Seconds of video the next clip downloads before its turn, so it starts at once when the viewer swipes. */
const BUFFER_NEXT = 3
/** Seconds ahead the clip on screen keeps buffered. */
const BUFFER_ACTIVE = 30

/** Once a viewer turns the sound on, the next clips start with sound too (like Reels and TikTok). */
let soundPreferred = false

type HlsInstance = import('hls.js').default

/**
 * A clip in the viewer. The clip on screen plays by itself (with sound when the browser allows it, else muted with a hint to tap),
 * the next one is loaded ahead (about 3 seconds buffered, paused), the others are dropped so they stop downloading.
 * Tap = pause / play, or sound on when it started muted. Streaming playlists (.m3u8) play natively on Safari and with hls.js elsewhere,
 * loaded only now (never for plain files); the same hls.js instance goes from "next" to "on screen", so its buffer is kept.
 */
function ClipVideo({ src, hls: streaming, poster, active, near }: { src: string; hls: boolean; poster?: string; active: boolean; near: boolean }) {
  const ref = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<HlsInstance | null>(null)
  const activeRef = useRef(active)
  const userPaused = useRef(false)
  const [muted, setMuted] = useState(!soundPreferred)
  const [waiting, setWaiting] = useState(false)
  const [paused, setPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const wanted = active || near

  const tryPlay = useCallback(() => {
    const video = ref.current
    if (!video || !activeRef.current || userPaused.current) return
    video.muted = !soundPreferred
    setMuted(video.muted)
    video.play().catch(() => {
      // the browser refuses sound before a tap: start muted instead
      video.muted = true
      setMuted(true)
      video.play().catch(() => {})
    })
  }, [])

  // the source is attached while the clip is on screen or next, and dropped again when it is further away
  useEffect(() => {
    const video = ref.current
    if (!video || !wanted || !streaming) return
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.preload = 'auto'
      video.src = src
      return () => { video.removeAttribute('src'); video.load() }
    }
    let cancelled = false
    import('hls.js').then(({ default: Hls }) => {
      if (cancelled || !Hls.isSupported()) return
      const buffer = activeRef.current ? BUFFER_ACTIVE : BUFFER_NEXT
      const instance = new Hls({ maxBufferLength: buffer, maxMaxBufferLength: buffer, startLevel: 0 })
      instance.loadSource(src)
      instance.attachMedia(video)
      hlsRef.current = instance
      tryPlay()
    })
    return () => {
      cancelled = true
      hlsRef.current?.destroy()
      hlsRef.current = null
    }
  }, [src, wanted, streaming, tryPlay])

  // on screen: play from the start and buffer more; off screen: pause and keep only a few seconds
  useEffect(() => {
    activeRef.current = active
    const video = ref.current
    if (!video) return
    const instance = hlsRef.current
    if (instance) {
      instance.config.maxBufferLength = active ? BUFFER_ACTIVE : BUFFER_NEXT
      instance.config.maxMaxBufferLength = active ? BUFFER_ACTIVE : BUFFER_NEXT
    }
    if (active) {
      userPaused.current = false
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPaused(false)
      tryPlay()
    } else {
      video.pause()
      try { video.currentTime = 0 } catch {}
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProgress(0)
    }
  }, [active, tryPlay])

  function tap() {
    const video = ref.current
    if (!video) return
    if (video.muted && !soundPreferred) {
      soundPreferred = true
      video.muted = false
      setMuted(false)
      if (video.paused) tryPlay()
      return
    }
    if (video.paused) { userPaused.current = false; setPaused(false); video.play().catch(() => {}) }
    else { userPaused.current = true; setPaused(true); video.pause() }
  }

  return (
    <>
      <video ref={ref} poster={poster} playsInline loop muted={muted} preload={active ? 'auto' : 'metadata'}
        src={streaming ? undefined : (wanted ? src : undefined)}
        onCanPlay={tryPlay} onWaiting={() => setWaiting(true)} onPlaying={() => setWaiting(false)}
        onTimeUpdate={e => { const v = e.currentTarget; if (v.duration) setProgress(v.currentTime / v.duration) }}
        className="absolute inset-0 size-full bg-black object-contain" />
      <button type="button" onClick={tap} aria-label={paused ? 'Phát' : muted && active ? 'Bật tiếng' : 'Tạm dừng'} className="absolute inset-0 cursor-pointer border-0 bg-transparent p-0" />
      {active && waiting && !paused && <div className="pointer-events-none absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-4 border-white/30 border-t-white" aria-hidden />}
      {active && paused && <div className="pointer-events-none absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-3xl" aria-hidden>▶</div>}
      {active && muted && !paused && <div className="pointer-events-none absolute left-4 top-16 rounded-full bg-black/55 px-3 py-1.5 text-xs font-bold">Chạm để bật tiếng</div>}
      {active && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-white/20"><div className="h-full bg-white/90" style={{ width: `${progress * 100}%` }} /></div>}
    </>
  )
}

function Media({ post, active, near }: { post: ExplorePost; active: boolean; near: boolean }) {
  if (post.kind === 'image' && post.mediaUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={post.mediaUrl} alt={post.title} className="absolute inset-0 size-full object-contain" />
  }
  if (post.kind === 'video' && post.mediaUrl) {
    const src = videoSource(post.mediaUrl)
    if (src.kind === 'youtube') {
      return active
        ? <iframe src={`${src.src}&autoplay=1`} title={post.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="absolute inset-0 size-full border-0" />
        : <div className="absolute inset-0 bg-black" />
    }
    return <ClipVideo src={src.src} hls={src.kind === 'hls'} poster={post.posterUrl ?? undefined} active={active} near={near} />
  }
  return <div className="absolute inset-0 bg-gradient-to-b from-green-dark to-[#064e3b]" />
}

/** The creator's name and the tags of a post, above its title. */
function Byline({ post }: { post: ExplorePost }) {
  const tags = post.tags ?? []
  if (!post.authorName && tags.length === 0) return null
  return (
    <p className="m-0 mb-1 text-xs font-bold text-white/85">
      {post.authorName && <span>@{post.authorName}</span>}
      {post.authorName && tags.length > 0 && ' · '}
      {tags.slice(0, 4).map(t => `#${t.name}`).join(' ')}
    </p>
  )
}

/** One full-screen post of the viewer: media or text card, title, link to the course and the action rail. */
export default function PostSlide({ post, active, near, commentsOn, onLike, onComments, onShare, index }: {
  post: ExplorePost; active: boolean; near: boolean; commentsOn: boolean; onLike: () => void; onComments: () => void; onShare: () => void; index: number
}) {
  const isArticle = post.kind === 'article'
  return (
    <section data-index={index} data-post={post.id} className="relative h-dvh w-full snap-start snap-always overflow-hidden bg-black text-white">
      <Media post={post} active={active} near={near} />
      {isArticle && (
        <div className="absolute inset-x-0 bottom-28 top-20 overflow-y-auto px-6 pr-20">
          <Byline post={post} />
          <h2 className="m-0 text-2xl font-black leading-tight">{post.title}</h2>
          {post.body && <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-white/90">{post.body}</p>}
        </div>
      )}
      {!isArticle && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-8 pt-20 pr-20">
          <Byline post={post} />
          <h2 className="m-0 text-lg font-extrabold leading-snug">{post.title}</h2>
          {post.body && <p className="mt-1 line-clamp-3 text-sm text-white/85">{post.body}</p>}
        </div>
      )}
      {post.itemId && (
        <Link href={`/class/${post.itemId}/khoa-hoc`} className="absolute bottom-6 left-4 z-10 inline-flex max-w-[60%] items-center gap-1 truncate rounded-full bg-white px-4 py-2 text-xs font-extrabold text-green-dark no-underline">
          Xem khóa học: {post.itemTitle ?? 'chi tiết'}
        </Link>
      )}
      <div className="absolute bottom-24 right-3 z-10 flex flex-col items-center gap-4">
        <button type="button" onClick={onLike} aria-label="Thích" aria-pressed={post.likedByMe} className="flex cursor-pointer flex-col items-center border-0 bg-transparent p-0 text-white">
          <span className={`grid size-12 place-items-center rounded-full bg-black/40 ${post.likedByMe ? 'text-rose-500' : ''}`}><HeartIcon filled={post.likedByMe} className="size-6" /></span>
          <span className="mt-0.5 text-xs font-bold">{countText(post.likes)}</span>
        </button>
        <button type="button" onClick={onComments} aria-label="Bình luận" className="flex cursor-pointer flex-col items-center border-0 bg-transparent p-0 text-white">
          <span className="grid size-12 place-items-center rounded-full bg-black/40"><ChatIcon className="size-6" /></span>
          <span className="mt-0.5 text-xs font-bold">{commentsOn ? countText(post.comments) : '·'}</span>
        </button>
        <button type="button" onClick={onShare} aria-label="Chia sẻ" className="flex cursor-pointer flex-col items-center border-0 bg-transparent p-0 text-white">
          <span className="grid size-12 place-items-center rounded-full bg-black/40"><ShareIcon className="size-6" /></span>
          <span className="mt-0.5 text-xs font-bold">{countText(post.shares)}</span>
        </button>
      </div>
    </section>
  )
}
