'use client'

import Link from 'next/link'
import { ChatIcon, HeartIcon, ShareIcon } from '@/components/icons'
import type { ExplorePost } from '@/lib/api/explore'
import { countText, videoSource } from '@/lib/explore/media'

function Media({ post, active }: { post: ExplorePost; active: boolean }) {
  if (post.kind === 'image' && post.mediaUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={post.mediaUrl} alt={post.title} className="absolute inset-0 size-full object-contain" />
  }
  if (post.kind === 'video' && post.mediaUrl) {
    const src = videoSource(post.mediaUrl)
    if (src.kind === 'youtube') {
      return active
        ? <iframe src={src.src} title={post.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="absolute inset-0 size-full border-0" />
        : <div className="absolute inset-0 bg-black" />
    }
    return <video src={src.src} poster={post.posterUrl ?? undefined} controls playsInline loop muted={false} preload={active ? 'auto' : 'none'} className="absolute inset-0 size-full bg-black object-contain" />
  }
  return <div className="absolute inset-0 bg-gradient-to-b from-green-dark to-[#064e3b]" />
}

/** One full-screen post of the viewer: media or text card, title, link to the course and the action rail. */
export default function PostSlide({ post, active, commentsOn, onLike, onComments, onShare, index }: {
  post: ExplorePost; active: boolean; commentsOn: boolean; onLike: () => void; onComments: () => void; onShare: () => void; index: number
}) {
  const isArticle = post.kind === 'article'
  return (
    <section data-index={index} data-post={post.id} className="relative h-dvh w-full snap-start snap-always overflow-hidden bg-black text-white">
      <Media post={post} active={active} />
      {isArticle && (
        <div className="absolute inset-x-0 bottom-28 top-20 overflow-y-auto px-6 pr-20">
          <h2 className="m-0 text-2xl font-black leading-tight">{post.title}</h2>
          {post.body && <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-white/90">{post.body}</p>}
        </div>
      )}
      {!isArticle && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-8 pt-20 pr-20">
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
