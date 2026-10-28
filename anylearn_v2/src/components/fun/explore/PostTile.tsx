'use client'

import { HeartIcon, PlayIcon } from '@/components/icons'
import type { ExplorePost } from '@/lib/api/explore'
import { countText, thumbOf } from '@/lib/explore/media'

/** A 9:16 tile of the Khám phá grids: picture (or the title on green for an article), title and likes at the bottom. */
export default function PostTile({ post, label, dim, onClick, children }: {
  post: ExplorePost; label?: string | null; dim?: boolean; onClick?: () => void; children?: React.ReactNode
}) {
  const thumb = thumbOf(post)
  return (
    <div className="relative aspect-[9/16] overflow-hidden rounded-lg bg-slate-200">
      <button type="button" onClick={onClick} aria-label={post.title} className="absolute inset-0 cursor-pointer border-0 bg-transparent p-0 text-left">
        {thumb
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={thumb} alt="" loading="lazy" className={`size-full object-cover ${dim ? 'opacity-50 grayscale' : ''}`} onError={e => { e.currentTarget.style.visibility = 'hidden' }} />
          : <div className={`flex size-full items-center bg-gradient-to-b from-green-dark to-[#064e3b] p-2 text-[13px] font-extrabold leading-snug text-white ${dim ? 'opacity-60' : ''}`}><span className="line-clamp-6">{post.title}</span></div>}
        {post.kind === 'video' && <span className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-black/45 text-white"><PlayIcon className="size-3" /></span>}
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-1.5 pb-1.5 pt-6 text-white">
          {thumb && <span className="line-clamp-2 text-[11px] font-bold leading-tight">{post.title}</span>}
          <span className="mt-0.5 flex items-center gap-1 text-[11px] font-bold"><HeartIcon className="size-3" />{countText(post.likes)}</span>
        </span>
      </button>
      {label && <span className="pointer-events-none absolute left-1.5 top-1.5 rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-extrabold text-white">{label}</span>}
      {children}
    </div>
  )
}
