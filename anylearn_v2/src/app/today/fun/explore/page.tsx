'use client'

import Link from 'next/link'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { CloseIcon } from '@/components/icons'
import CommentsSheet from '@/components/fun/explore/CommentsSheet'
import PostSlide from '@/components/fun/explore/PostSlide'
import { countExploreShare, countExploreView, getExploreFeed, toggleExploreLike, type ExplorePost } from '@/lib/api/explore'
import { postLink } from '@/lib/explore/media'

const PAGE = 10

// Khám phá: a full-screen viewer, one post per screen, swipe up for the next. The cross at the top goes back to Vui học.
function Explorer() {
  const { token } = useAuth()
  const search = useSearchParams()
  const wanted = Number(search.get('p')) || 0
  const [posts, setPosts] = useState<ExplorePost[]>([])
  const [commentsOn, setCommentsOn] = useState(true)
  const [enabled, setEnabled] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')
  const [active, setActive] = useState(0)
  const [openComments, setOpenComments] = useState<number | null>(null)
  const page = useRef(1)
  const total = useRef(0)
  const loading = useRef(false)
  const seen = useRef(new Set<number>())
  const scroller = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(async () => {
    if (!token || loading.current) return
    loading.current = true
    const { data, error: err } = await getExploreFeed(token, page.current, PAGE)
    loading.current = false
    if (err || !data) return setError(err ?? 'Không tải được bài viết')
    page.current += 1
    total.current = data.total
    setEnabled(data.enabled)
    setCommentsOn(data.commentsEnabled)
    setPosts(prev => [...prev, ...data.items.filter(i => !prev.some(p => p.id === i.id))])
    setLoaded(true)
  }, [token])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMore()
  }, [loadMore])

  // the link of a shared post opens on that post (loading more pages until it is found)
  useEffect(() => {
    if (!wanted || posts.length === 0) return
    const index = posts.findIndex(p => p.id === wanted)
    if (index >= 0) scroller.current?.querySelector(`[data-index="${index}"]`)?.scrollIntoView()
    else if (posts.length < total.current) loadMore()
  }, [wanted, posts, loadMore])

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
        if (index >= posts.length - 3 && posts.length < total.current) loadMore()
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
      <Link href="/today/fun" aria-label="Đóng Khám phá" className="absolute right-3 top-3 z-30 grid size-11 place-items-center rounded-full bg-black/50 text-white no-underline"><CloseIcon className="size-5" /></Link>
      <div ref={scroller} className="h-dvh snap-y snap-mandatory overflow-y-scroll overscroll-contain">
        {posts.map((p, i) => (
          <PostSlide key={p.id} post={p} index={i} active={i === active} commentsOn={commentsOn}
            onLike={() => like(p)} onComments={() => setOpenComments(p.id)} onShare={() => share(p)} />
        ))}
        {loaded && (!enabled || posts.length === 0) && (
          <section className="relative grid h-dvh place-items-center bg-gradient-to-b from-green-dark to-[#064e3b] px-8 text-center text-white">
            <div className="flex max-w-xs flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/fun/leo_discovery.png" alt="" className="size-40 object-contain drop-shadow-lg" />
              <h2 className="m-0 mt-4 text-xl font-black">{enabled ? 'Sắp có nhiều điều hay ho!' : 'Khám phá đang tạm nghỉ'}</h2>
              <p className="mt-2 text-sm text-white/85">{enabled ? 'Leo đang chuẩn bị mẹo nuôi dạy con, clip và hình ảnh vui. Bạn quay lại sau nhé!' : 'Bạn quay lại sau nhé!'}</p>
              <Link href="/today/fun" className="mt-5 inline-flex min-h-11 items-center rounded-full bg-white px-6 text-sm font-extrabold text-green-dark no-underline">Về Vui học</Link>
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
