'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { SearchIcon } from '@/components/icons'
import PostTile from '@/components/fun/explore/PostTile'
import { getCreatorMe, getExploreFeed, searchExplore, type ExplorePost } from '@/lib/api/explore'
import { rememberBrowse } from '@/lib/explore/browse'
import { mergePosts } from '@/lib/explore/creator'

const PAGE = 12

/**
 * Khám phá on /fun (plan 16.4): a search box (title, description, tags), the creator's "Bài đăng của tôi" button, and a
 * 3-column grid of 9:16 tiles, 12 at a time, loading more when the end comes on screen. No words = the suggested order.
 * A tile opens the full-screen viewer on that post, which goes on with this same list.
 */
export default function ExploreBrowser({ token }: { token: string }) {
  const router = useRouter()
  const [typed, setTyped] = useState('')
  const [q, setQ] = useState('')
  const [posts, setPosts] = useState<ExplorePost[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isCreator, setIsCreator] = useState(false)
  const page = useRef(0)
  const since = useRef(0)
  const busy = useRef(false)
  const generation = useRef(0)
  const sentinel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getCreatorMe(token).then(({ data }) => setIsCreator(!!data?.level))
  }, [token])

  useEffect(() => {
    const t = setTimeout(() => setQ(typed.trim()), 400)
    return () => clearTimeout(t)
  }, [typed])

  const loadMore = useCallback(async (reset = false) => {
    if (busy.current && !reset) return
    const run = reset ? ++generation.current : generation.current
    if (reset) { page.current = 0; since.current = Date.now() }
    busy.current = true
    setLoading(true)
    const next = page.current + 1
    const { data, error: err } = q ? await searchExplore(token, q, next, PAGE) : await getExploreFeed(token, next, PAGE, since.current)
    if (run !== generation.current) return
    busy.current = false
    setLoading(false)
    if (!data) return setError(err ?? 'Không tải được bài')
    setError('')
    page.current = next
    setTotal(data.total)
    setPosts(prev => mergePosts(reset ? [] : prev, data.items))
  }, [token, q])

  useEffect(() => {
    loadMore(true)
  }, [loadMore])

  // the end of the grid on screen loads the next 12
  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const observer = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting) && posts.length < total && !busy.current) loadMore()
    }, { rootMargin: '400px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [posts.length, total, loadMore])

  function open(post: ExplorePost) {
    rememberBrowse({ q, since: since.current, posts, page: page.current, total })
    router.push(`/fun/explore?p=${post.id}&from=list`)
  }

  return (
    <section className="mt-5">
      <label className="flex min-h-11 items-center gap-2 rounded-full bg-white px-4 ring-1 ring-line focus-within:ring-2 focus-within:ring-green">
        <SearchIcon className="size-4 shrink-0 text-muted" />
        <input type="search" value={typed} onChange={e => setTyped(e.target.value)} placeholder="Tìm bài Khám phá: mẹo, clip, chủ đề..."
          aria-label="Tìm bài Khám phá" className="min-w-0 flex-1 border-0 bg-transparent py-2 text-base outline-none" />
      </label>
      {isCreator && (
        <Link href="/fun/explore/mine" className="mt-3 flex min-h-11 items-center justify-center rounded-full bg-green px-5 text-sm font-extrabold text-white no-underline">
          Bài đăng của tôi
        </Link>
      )}
      <div className="mt-3 grid grid-cols-3 gap-1">
        {posts.map(p => <PostTile key={p.id} post={p} onClick={() => open(p)} />)}
        {loading && Array.from({ length: posts.length ? 3 : 6 }, (_, i) => <div key={`s${i}`} className="aspect-[9/16] animate-pulse rounded-lg bg-slate-200" />)}
      </div>
      {!loading && !error && posts.length === 0 && <p className="mt-4 text-center text-sm text-muted">{q ? `Chưa có bài nào khớp “${q}”` : 'Chưa có bài nào'}</p>}
      {error && <p className="mt-4 text-center text-sm text-warn-text">{error} <button type="button" onClick={() => loadMore(true)} className="cursor-pointer border-0 bg-transparent font-bold text-green underline">Thử lại</button></p>}
      <div ref={sentinel} className="h-1" />
    </section>
  )
}
