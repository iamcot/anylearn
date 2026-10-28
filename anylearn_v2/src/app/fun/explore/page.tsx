'use client'

import Link from 'next/link'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { CloseIcon } from '@/components/icons'
import CommentsSheet from '@/components/fun/explore/CommentsSheet'
import PostSlide from '@/components/fun/explore/PostSlide'
import { countExploreShare, countExploreView, getExploreFeed, getExplorePost, getMyPost, searchExplore, toggleExploreLike, type ExplorePost } from '@/lib/api/explore'
import { browseList } from '@/lib/explore/browse'
import { mergePosts } from '@/lib/explore/creator'
import { postLink } from '@/lib/explore/media'

const PAGE = 12

// Khám phá: a full-screen viewer, one post per screen, swipe up for the next. The cross at the top goes back to Vui học.
function Explorer() {
  const { token } = useAuth()
  const search = useSearchParams()
  const wanted = Number(search.get('p')) || 0
  const from = search.get('from')
  const [posts, setPosts] = useState<ExplorePost[]>([])
  const [commentsOn, setCommentsOn] = useState(true)
  const [enabled, setEnabled] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')
  const [active, setActive] = useState(0)
  const [openComments, setOpenComments] = useState<number | null>(null)
  // where the next posts come from: the grid's search or the suggested feed (plan 16.4 / 16.6)
  const source = useRef({ q: '', page: 0, total: 0, since: 0, exclude: [] as number[] })
  const loading = useRef(false)
  const started = useRef(false)
  const seen = useRef(new Set<number>())
  const scroller = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(async () => {
    if (!token || loading.current) return
    loading.current = true
    const s = source.current
    const next = s.page + 1
    if (!s.since) s.since = Date.now()
    const { data, error: err } = s.q ? await searchExplore(token, s.q, next, PAGE) : await getExploreFeed(token, next, PAGE, s.since, s.exclude)
    loading.current = false
    if (err || !data) return setError(err ?? 'Không tải được bài viết')
    s.page = next
    s.total = data.total + s.exclude.length
    setEnabled(data.enabled)
    setCommentsOn(data.commentsEnabled)
    setPosts(prev => mergePosts(prev, data.items))
    setLoaded(true)
  }, [token])

  // Opened from a grid tile: go on with the grid's list. Opened on one post (shared link, "Xem" of a creator): that post
  // first, then the feed without it. Otherwise the feed.
  useEffect(() => {
    if (!token || started.current) return
    started.current = true
    const list = from === 'list' ? browseList() : null
    if (list && list.posts.some(p => p.id === wanted)) {
      source.current = { q: list.q, page: list.page, total: list.total, since: list.since, exclude: [] }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPosts(list.posts)
      setLoaded(true)
      return
    }
    if (!wanted) { loadMore(); return }
    ;(async () => {
      const { data } = from === 'mine' ? await getMyPost(token, wanted) : await getExplorePost(token, wanted)
      if (data) {
        source.current.exclude = [data.id]
        setPosts([data])
      }
      loadMore()
    })()
  }, [token, wanted, from, loadMore])

  // the post the viewer was opened on is shown first
  useEffect(() => {
    if (!wanted || posts.length === 0) return
    const index = posts.findIndex(p => p.id === wanted)
    if (index > 0 && active === 0) scroller.current?.querySelector(`[data-index="${index}"]`)?.scrollIntoView()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wanted, posts.length > 0])

  // which post is on screen: count its view once, and load more near the end
  useEffect(() => {
    const root = scroller.current
    if (!root || posts.length === 0) return
    const observer = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!e.isIntersecting || e.intersectionRatio < 0.6) continue
        const index = Number((e.target as HTMLElement).dataset.index)
        const id = Number((e.target as HTMLElement).dataset.post)
        setActive(index)
        if (token && !seen.current.has(id)) { seen.current.add(id); countExploreView(token, id) }
        if (index >= posts.length - 3 && posts.length < source.current.total) loadMore()
      }
    }, { root, threshold: 0.6 })
    root.querySelectorAll('section[data-post]').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [posts, token, loadMore])

  async function like(post: ExplorePost) {
    if (!token) return
    setPosts(list => list.map(p => (p.id === post.id ? { ...p, likedByMe: !p.likedByMe, likes: p.likes + (p.likedByMe ? -1 : 1) } : p)))
    const { data } = await toggleExploreLike(token, post.id)
    if (data) setPosts(list => list.map(p => (p.id === post.id ? { ...p, likedByMe: data.liked, likes: data.likes } : p)))
  }

  async function share(post: ExplorePost) {
    const url = postLink(window.location.origin, post.id)
    try {
      if (navigator.share) await navigator.share({ title: post.title, url })
      else await navigator.clipboard.writeText(url)
      if (token) countExploreShare(token, post.id)
      setPosts(list => list.map(p => (p.id === post.id ? { ...p, shares: p.shares + 1 } : p)))
    } catch {}
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black">
      <Link href={from === 'mine' ? '/fun/explore/mine' : '/fun'} aria-label="Đóng Khám phá" className="absolute right-3 top-3 z-30 grid size-11 place-items-center rounded-full bg-black/50 text-white no-underline"><CloseIcon className="size-5" /></Link>
      <div ref={scroller} className="h-dvh snap-y snap-mandatory overflow-y-scroll overscroll-contain">
        {posts.map((p, i) => (
          <PostSlide key={p.id} post={p} index={i} active={i === active} near={i === active + 1} commentsOn={commentsOn}
            onLike={() => like(p)} onComments={() => setOpenComments(p.id)} onShare={() => share(p)} />
        ))}
        {loaded && (!enabled || posts.length === 0) && (
          <section className="relative grid h-dvh place-items-center bg-gradient-to-b from-green-dark to-[#064e3b] px-8 text-center text-white">
            <div className="flex max-w-xs flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/fun/leo_discovery.png" alt="" className="size-40 object-contain drop-shadow-lg" />
              <h2 className="m-0 mt-4 text-xl font-black">{enabled ? 'Sắp có nhiều điều hay ho!' : 'Khám phá đang tạm nghỉ'}</h2>
              <p className="mt-2 text-sm text-white/85">{enabled ? 'Leo đang chuẩn bị mẹo nuôi dạy con, clip và hình ảnh vui. Bạn quay lại sau nhé!' : 'Bạn quay lại sau nhé!'}</p>
              <Link href="/fun" className="mt-5 inline-flex min-h-11 items-center rounded-full bg-white px-6 text-sm font-extrabold text-green-dark no-underline">Về Vui học</Link>
            </div>
          </section>
        )}
        {!loaded && !error && <section className="grid h-dvh place-items-center text-white/70">Đang tải...</section>}
        {error && <section className="grid h-dvh place-items-center px-8 text-center text-white"><p>{error}</p></section>}
      </div>
      {openComments !== null && token && (
        <CommentsSheet token={token} postId={openComments} enabled={commentsOn} onClose={() => setOpenComments(null)}
          onCount={n => setPosts(list => list.map(p => (p.id === openComments ? { ...p, comments: n } : p)))} />
      )}
    </div>
  )
}

export default function ExplorePage() {
  return <Suspense fallback={null}><Explorer /></Suspense>
}
