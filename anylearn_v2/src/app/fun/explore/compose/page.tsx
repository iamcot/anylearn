'use client'

import Link from 'next/link'
import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/ToastProvider'
import { ChevronLeftIcon } from '@/components/icons'
import CoursePicker from '@/components/fun/explore/CoursePicker'
import TagPicker from '@/components/fun/explore/TagPicker'
import { getCreatorMe, getMyPost, saveMyPost, uploadCreatorImage, type CourseHit, type CreatorMe, type ExploreKind, type ExploreTag } from '@/lib/api/explore'
import { statusAfterText } from '@/lib/explore/creator'
import { thumbOf } from '@/lib/explore/media'
import { startClipUpload } from '@/lib/explore/uploads'

const KINDS: [ExploreKind, string][] = [['video', 'Clip'], ['image', 'Hình ảnh'], ['article', 'Bài viết']]
const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024

const field = 'min-h-11 w-full rounded-xl border border-line bg-white px-3 text-base outline-none focus:border-green'
const label = 'mb-1 mt-4 block text-sm font-bold'

/** Picks a photo, uploads it and gives back its link. */
function PhotoButton({ token, text, onDone }: { token: string; text: string; onDone: (url: string) => void }) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  return (
    <label className={`inline-flex min-h-11 cursor-pointer items-center rounded-full bg-white px-4 text-sm font-bold ring-1 ring-line ${busy ? 'opacity-60' : ''}`}>
      {busy ? 'Đang tải hình...' : text}
      <input type="file" accept="image/*" className="hidden" disabled={busy} onChange={async e => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file) return
        setBusy(true)
        const { data, error } = await uploadCreatorImage(token, file)
        setBusy(false)
        if (data) onDone(data)
        else toast({ kind: 'error', text: error ?? 'Tải hình thất bại' })
      }} />
    </label>
  )
}

/**
 * New or edited post of a creator (plan 16.5), the same fields as the back office form. With a video file the post is
 * saved first, the clip uploads in the background and the creator goes back to "Bài đăng của tôi", where the first tile
 * shows the progress.
 */
function Compose() {
  const { token } = useAuth()
  const router = useRouter()
  const toast = useToast()
  const editId = Number(useSearchParams().get('id')) || null
  const [me, setMe] = useState<CreatorMe | null>(null)
  const [loaded, setLoaded] = useState(!editId)
  const [kind, setKind] = useState<ExploreKind>('video')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [posterUrl, setPosterUrl] = useState('')
  const [video, setVideo] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [tags, setTags] = useState<ExploreTag[]>([])
  const [course, setCourse] = useState<CourseHit | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const videoInput = useRef<HTMLInputElement>(null)
  // the clip the post had: kept while a new one uploads, so a failed upload does not leave the post without its video
  const originalMedia = useRef('')

  useEffect(() => {
    if (!token) return
    getCreatorMe(token).then(({ data }) => setMe(data ?? { level: null, videoUpload: false }))
    if (!editId) return
    getMyPost(token, editId).then(({ data, error: err }) => {
      if (!data) return setError(err ?? 'Không tải được bài')
      setKind(data.kind)
      setTitle(data.title)
      setBody(data.body ?? '')
      setMediaUrl(data.mediaUrl ?? '')
      originalMedia.current = data.mediaUrl ?? ''
      setPosterUrl(data.posterUrl ?? '')
      setTags(data.tags ?? [])
      setCourse(data.itemId ? { id: data.itemId, title: data.itemTitle ?? `Khóa học #${data.itemId}`, image: data.itemImage, price: data.itemPrice } : null)
      setLoaded(true)
    })
  }, [token, editId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!video) { setVideoPreview(null); return }
    const url = URL.createObjectURL(video)
    setVideoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [video])

  function pickVideo(file: File | undefined) {
    if (!file) return
    if (file.size > MAX_VIDEO_BYTES) return toast({ kind: 'error', text: 'Video tối đa 2GB' })
    setVideo(file)
    setMediaUrl('')
  }

  async function save() {
    if (!token) return
    const cleanTitle = title.trim()
    if (!cleanTitle) return setError('Bạn nhập tiêu đề nhé')
    if (kind === 'image' && !mediaUrl) return setError('Bạn chọn một hình nhé')
    if (kind === 'video' && !video && !mediaUrl.trim()) return setError('Bạn chọn video hoặc dán link YouTube nhé')
    if (kind === 'article' && !body.trim()) return setError('Bạn viết nội dung nhé')
    setError('')
    setSaving(true)
    const uploading = kind === 'video' && !!video
    const { data, error: err } = await saveMyPost(token, editId, {
      kind, title: cleanTitle, body: body.trim(), mediaUrl: kind === 'article' ? '' : uploading ? originalMedia.current : mediaUrl.trim(),
      posterUrl: kind === 'video' ? posterUrl : '', itemId: course?.id ?? null, tagIds: tags.map(t => t.id), uploading,
    })
    setSaving(false)
    if (!data) return setError(err ?? 'Không lưu được bài')
    if (uploading && video) {
      startClipUpload(token, data.id, cleanTitle, video)
      toast({ kind: 'success', text: 'Đang tải video lên, bạn xem tiến độ ở ô đầu tiên' })
    } else {
      toast({ kind: 'success', text: statusAfterText(data.status) })
    }
    router.replace('/fun/explore/mine')
  }

  const heading = <h1 className="m-0 text-2xl font-black">{editId ? 'Sửa bài' : 'Đăng bài mới'}</h1>
  if (me && !me.level) return <p className="mt-6 rounded-2xl bg-white p-4 text-center text-sm text-muted ring-1 ring-line">Bạn chưa được mở quyền đăng bài Khám phá.</p>
  if (!loaded) return error ? <p className="mt-6 text-center text-warn-text">{error}</p> : <div className="mt-6 h-64 animate-pulse rounded-2xl bg-slate-200" />

  const shownMedia = kind === 'image' ? mediaUrl : thumbOf({ kind, mediaUrl: mediaUrl || null, posterUrl: posterUrl || null })
  return (
    <form onSubmit={e => { e.preventDefault(); save() }}>
      {heading}
      <div className="mt-3 grid grid-cols-3 gap-1 rounded-full bg-white p-1 ring-1 ring-line" role="radiogroup" aria-label="Loại bài">
        {KINDS.map(([k, text]) => (
          <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)}
            className={`min-h-10 cursor-pointer rounded-full border-0 text-sm font-extrabold ${kind === k ? 'bg-green text-white' : 'bg-transparent text-ink'}`}>{text}</button>
        ))}
      </div>

      <label className={label} htmlFor="ex-title">Tiêu đề</label>
      <input id="ex-title" className={field} value={title} maxLength={160} onChange={e => setTitle(e.target.value)} placeholder="Ví dụ: 3 trò chơi giúp bé học từ vựng" />

      {kind === 'video' && (
        <>
          <span className={label}>Video</span>
          {videoPreview && <video src={videoPreview} muted playsInline controls className="mb-2 aspect-[9/16] max-h-80 rounded-xl bg-black object-contain" />}
          {!videoPreview && mediaUrl && shownMedia && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shownMedia} alt="" className="mb-2 aspect-[9/16] max-h-60 rounded-xl bg-slate-200 object-cover" />
          )}
          <div className="flex flex-wrap items-center gap-2">
            {me?.videoUpload && (
              <button type="button" onClick={() => videoInput.current?.click()} className="min-h-11 cursor-pointer rounded-full border-0 bg-green px-4 text-sm font-extrabold text-white">
                {video || mediaUrl ? 'Chọn video khác' : 'Chọn video từ máy'}
              </button>
            )}
            {video && <button type="button" onClick={() => setVideo(null)} className="min-h-11 cursor-pointer rounded-full border-0 bg-white px-4 text-sm font-bold ring-1 ring-line">Bỏ video</button>}
            <input ref={videoInput} type="file" accept="video/*" className="hidden" onChange={e => { pickVideo(e.target.files?.[0]); e.target.value = '' }} />
          </div>
          {!video && (
            <input className={`${field} mt-2`} value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} inputMode="url"
              placeholder={me?.videoUpload ? 'hoặc dán link YouTube' : 'Dán link YouTube (https://...)'} />
          )}
          {video && <p className="mt-1 text-xs text-muted">Video sẽ tải lên sau khi bạn bấm Lưu, bạn vẫn dùng app bình thường trong lúc chờ (đừng đóng trang).</p>}

          <span className={label}>Ảnh bìa (tùy chọn)</span>
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {posterUrl && <img src={posterUrl} alt="" className="h-20 w-12 rounded-lg object-cover" />}
            <PhotoButton token={token!} text={posterUrl ? 'Đổi ảnh bìa' : 'Chọn ảnh bìa'} onDone={setPosterUrl} />
            {posterUrl && <button type="button" onClick={() => setPosterUrl('')} className="min-h-11 cursor-pointer border-0 bg-transparent text-sm font-bold text-muted underline">Bỏ</button>}
          </div>
        </>
      )}

      {kind === 'image' && (
        <>
          <span className={label}>Hình ảnh</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {mediaUrl && <img src={mediaUrl} alt="" className="mb-2 max-h-80 rounded-xl object-contain" />}
          <PhotoButton token={token!} text={mediaUrl ? 'Đổi hình' : 'Chọn hình'} onDone={setMediaUrl} />
        </>
      )}

      <label className={label} htmlFor="ex-body">{kind === 'article' ? 'Nội dung' : 'Mô tả ngắn'}</label>
      <textarea id="ex-body" className={`${field} py-2`} rows={kind === 'article' ? 10 : 3} maxLength={8000} value={body} onChange={e => setBody(e.target.value)} />

      <span className={label}>Tags</span>
      <TagPicker token={token!} value={tags} onChange={setTags} />

      <span className={label}>Gắn khóa học</span>
      <CoursePicker token={token!} value={course} onChange={setCourse} />

      {me?.level === 'creator' && <p className="mt-4 text-xs text-muted">Bài sẽ hiện sau khi anyLEARN duyệt.{editId ? ' Sửa bài đang hiện cũng cần duyệt lại.' : ''}</p>}
      {error && <p className="mt-3 text-sm font-bold text-warn-text">{error}</p>}
      <button type="submit" disabled={saving} className="mt-4 min-h-12 w-full cursor-pointer rounded-full border-0 bg-green text-base font-extrabold text-white disabled:opacity-60">
        {saving ? 'Đang lưu...' : editId ? 'Lưu thay đổi' : 'Đăng bài'}
      </button>
    </form>
  )
}

export default function ComposePage() {
  return (
    <div className="mx-auto max-w-[560px] px-4 pb-28 pt-4 lg:px-0 lg:pt-8">
      <Link href="/fun/explore/mine" className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-text no-underline"><ChevronLeftIcon className="size-4" /> Bài đăng của tôi</Link>
      <Suspense fallback={null}><Compose /></Suspense>
    </div>
  )
}
