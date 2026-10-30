'use client'

import { useAuth } from '@/context/AuthContext'
import type { PublicExplorePost } from '@/lib/api/explore'

/**
 * What a visitor without an account finds after the post of a shared link (plan 19.A3): a few comments, read only, and
 * the ask to sign in or register to see more. Signing in keeps the person on this link, which then becomes the feed.
 */
export default function VisitorGate({ post }: { post: PublicExplorePost }) {
  const { openAuthModal } = useAuth()
  const comments = post.previewComments ?? []
  return (
    <section data-gate className="relative flex h-dvh snap-start flex-col items-center justify-center gap-5 bg-gradient-to-b from-green-dark to-[#064e3b] px-6 text-center text-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/fun/leo_discovery.png" alt="" className="size-32 object-contain drop-shadow-lg" />
      <div className="max-w-xs">
        <h2 className="m-0 text-xl font-black">Đăng nhập hoặc đăng ký để xem tiếp</h2>
        <p className="mt-2 text-sm text-white/85">Còn nhiều clip, mẹo nuôi dạy con và trò chơi cùng Leo. Đăng ký chỉ mất một phút, bạn sẽ quay lại đúng bài này.</p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-2.5">
        <button type="button" onClick={() => openAuthModal('register')} className="min-h-12 cursor-pointer rounded-full border-0 bg-white px-6 font-[inherit] text-sm font-extrabold text-green-dark">Đăng ký miễn phí</button>
        <button type="button" onClick={() => openAuthModal('login')} className="min-h-12 cursor-pointer rounded-full border-2 border-white/80 bg-transparent px-6 font-[inherit] text-sm font-extrabold text-white">Tôi đã có tài khoản</button>
      </div>
      {comments.length > 0 && (
        <div className="w-full max-w-sm rounded-2xl bg-black/25 p-4 text-left">
          <p className="m-0 mb-2 text-xs font-bold uppercase tracking-wide text-white/70">Bình luận ({post.comments})</p>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {comments.map(c => (
              <li key={c.id} className="text-sm leading-snug">
                <span className="font-extrabold">{c.name}</span> <span className="text-white/90">{c.body}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
