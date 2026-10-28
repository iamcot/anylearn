'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/ToastProvider'
import { ChevronLeftIcon, PlusSquareIcon } from '@/components/icons'
import FixedBar from '@/components/fun/FixedBar'
import PostTile from '@/components/fun/explore/PostTile'
import ProgressRing from '@/components/fun/explore/ProgressRing'
import { deleteMyPost, getCreatorMe, getMyPosts, hideMyPost, showMyPost, type CreatorLevel, type ExplorePost } from '@/lib/api/explore'
import { creatorActions, mergePosts, statusAfterText, statusLabel, type CreatorAction } from '@/lib/explore/creator'
import { cancelClipUpload, onClipUploadFinished, useClipUploads, type ClipUpload } from '@/lib/explore/uploads'

const PAGE = 12
const ACTION_LABEL: Record<CreatorAction, string> = { view: 'Xem', edit: 'Sửa', hide: 'Ẩn', show: 'Hiện', delete: 'Xóa' }

/** The grey first tile while a clip uploads: its frame (when the browser could take one) and a ring with the percentage. */
function UploadTile({ upload }: { upload: ClipUpload }) {
  return (
    <div className="relative grid aspect-[9/16] place-items-center overflow-hidden rounded-lg bg-slate-200">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {upload.preview && <img src={upload.preview} alt="" className="absolute inset-0 size-full object-cover opacity-40" />}
      <div className="relative flex flex-col items-center gap-1 px-2 text-center">
        {upload.error
          ? <><span className="text-[11px] font-bold text-warn-text">Tải video lỗi</span><button type="button" onClick={() => cancelClipUpload(upload.postId)} className="cursor-pointer rounded-full border-0 bg-white px-3 py-1 text-[11px] font-bold">Đóng</button></>
          : <><ProgressRing percent={upload.percent} /><span className="line-clamp-2 text-[11px] font-bold text-ink">{upload.title}</span></>}
      </div>
    </div>
  )
}

/**
 * "Bài đăng của tôi" of a creator (plan 16.5): every post of theirs in a 3-column grid, newest first, uploads in progress
 * first. A tap on a tile shows its three buttons; "Đăng bài mới" stays at the bottom.
 */
export default function MyExplorePosts() {
  const { token } = useAuth()
  const router = useRouter()
  const toast = useToast()
  const uploads = useClipUploads()
  const [level, setLevel] = useState<CreatorLevel | null | undefined>(undefined)
  const [posts, setPosts] = useState<ExplorePost[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)
  const page = useRef(0)
  const fetching = useRef(false)
  const sentinel = useRef<HTMLDivElement>(null)

  const load = useCallback(async (reset = false) => {
    if (!token || (fetching.current && !reset)) return
    fetching.current = true
    setLoading(true)
    const next = reset ? 1 : page.current + 1
    const { data, error } = await getMyPosts(token, next, PAGE)
    fetching.current = false
    setLoading(false)
    if (!data) return toast({ kind: 'error', text: error ?? 'Không tải được bài' })
    page.current = next
    setTotal(data.total)
    setPosts(prev => mergePosts(reset ? [] : prev, data.items))
  }, [token, toast])

  useEffect(() => {
    if (!token) return
    getCreatorMe(token).then(({ data }) => {
      setLevel(data?.level ?? null)
      if (data?.level) load(true)
    })
  }, [token, load])

  // a clip that finished uploading: reload so the tile gets its picture, and say it
  useEffect(() => onClipUploadFinished((_, ok, title) => {
    toast(ok ? { kind: 'success', text: `Đã tải xong video “${title}”` } : { kind: 'error', text: `Tải video “${title}” thất bại` })
    if (ok) load(true)
  }), [toast, load])

  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const observer = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting) && posts.length < total && !fetching.current) load()
    }, { rootMargin: '400px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [posts.length, total, load])

  async function act(post: ExplorePost, action: CreatorAction) {
    if (!token) return
    if (action === 'view') return router.push(`/fun/explore?p=${post.id}&from=mine`)
    if (action === 'edit') return router.push(`/fun/explore/compose?id=${post.id}`)
    if (action === 'delete' && !confirmDelete) return setConfirmDelete(true)
    setBusy(true)
    if (action === 'delete') {
      const { error } = await deleteMyPost(token, post.id)
      setBusy(false)
      if (error) return toast({ kind: 'error', text: error })
      setPosts(list => list.filter(p => p.id !== post.id))
      setTotal(n => n - 1)
      setSelected(null)
      return toast({ kind: 'success', text: 'Đã xóa bài' })
    }
    const { data, error } = action === 'hide' ? await hideMyPost(token, post.id) : await showMyPost(token, post.id)
    setBusy(false)
    if (!data) return toast({ kind: 'error', text: error ?? 'Không thực hiện được' })
    setPosts(list => list.map(p => (p.id === post.id ? { ...p, status: data.status, hiddenBy: data.status === 'hidden' ? 'creator' : null } : p)))
    setSelected(null)
    toast({ kind: 'success', text: action === 'hide' ? 'Đã ẩn bài' : statusAfterText(data.status) })
  }

  const uploadingIds = new Set(uploads.map(u => u.postId))
  return (
    <div className="mx-auto max-w-[720px] px-4 pb-32 pt-4 lg:px-0 lg:pt-8" onClick={() => { setSelected(null); setConfirmDelete(false) }}>
      <Link href="/fun" className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-text no-underline"><ChevronLeftIcon className="size-4" /> Vui học</Link>
      <h1 className="m-0 text-2xl font-black">Bài đăng của tôi</h1>
      {level && <p className="mt-1 text-sm text-muted">{level === 's_creator' ? 'Bài của bạn hiện ngay sau khi đăng.' : 'Bài mới hoặc bài sửa sẽ hiện sau khi anyLEARN duyệt.'} Nhấn vào một bài để xem, sửa hoặc ẩn.</p>}
      {level === null && <p className="mt-4 rounded-2xl bg-white p-4 text-center text-sm text-muted ring-1 ring-line">Bạn chưa được mở quyền đăng bài Khám phá.</p>}

      {level && (
        <div className="mt-4 grid grid-cols-3 gap-1">
          {uploads.map(u => <UploadTile key={`u${u.postId}`} upload={u} />)}
          {posts.filter(p => !uploadingIds.has(p.id)).map(p => {
            const open = selected === p.id
            return (
              <div key={p.id} onClick={e => e.stopPropagation()}>
                <PostTile post={p} label={statusLabel(p)} dim={p.status !== 'published'} onClick={() => { setSelected(open ? null : p.id); setConfirmDelete(false) }}>
                  {open && (
                    <div className="absolute inset-0 flex flex-col items-stretch justify-center gap-2 bg-black/60 p-3">
                      {p.reviewNote && (p.status === 'rejected' || p.status === 'hidden') && <p className="m-0 line-clamp-3 text-center text-[11px] font-bold text-white">{p.reviewNote}</p>}
                      {creatorActions(p).map(a => (
                        <button key={a} type="button" disabled={busy} onClick={() => act(p, a)}
                          className={`min-h-9 cursor-pointer rounded-full border-0 text-xs font-extrabold disabled:opacity-60 ${a === 'delete' ? 'bg-red text-white' : 'bg-white text-ink'}`}>
                          {a === 'delete' && confirmDelete ? 'Chắc chắn xóa?' : a === 'show' && p.status !== 'hidden' ? 'Gửi lại' : ACTION_LABEL[a]}
                        </button>
                      ))}
                    </div>
                  )}
                </PostTile>
              </div>
            )
          })}
          {loading && Array.from({ length: 3 }, (_, i) => <div key={`s${i}`} className="aspect-[9/16] animate-pulse rounded-lg bg-slate-200" />)}
        </div>
      )}
      {level && !loading && posts.length === 0 && uploads.length === 0 && <p className="mt-6 text-center text-sm text-muted">Bạn chưa có bài nào. Đăng bài đầu tiên nhé!</p>}
      <div ref={sentinel} className="h-1" />

      {level && (
        <FixedBar>
          <Link href="/fun/explore/compose" className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-green text-base font-extrabold text-white no-underline shadow-[0_6px_16px_rgba(15,23,42,.18)]">
            <PlusSquareIcon className="size-5" /> Đăng bài mới
          </Link>
        </FixedBar>
      )}
    </div>
  )
}
