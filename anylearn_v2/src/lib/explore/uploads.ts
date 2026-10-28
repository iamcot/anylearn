'use client'

import { useSyncExternalStore } from 'react'
import type * as Tus from 'tus-js-client'
import { attachMyMedia, createVideoUpload } from '@/lib/api/explore'

// Clip uploads of creators run here, outside any page, so the creator can close the form and keep using the app (the
// upload stops only when the tab is closed). Each upload belongs to a post that is already saved and waits for its clip.
export interface ClipUpload {
  postId: number
  title: string
  percent: number
  /** A frame of the chosen video, shown on the tile while it uploads. */
  preview: string | null
  error: string | null
}

let uploads: ClipUpload[] = []
const running = new Map<number, Tus.Upload>()
const listeners = new Set<() => void>()
const finished = new Set<(postId: number, ok: boolean, title: string) => void>()

function emit() {
  uploads = [...uploads]
  listeners.forEach(l => l())
}

function patch(postId: number, changes: Partial<ClipUpload>) {
  uploads = uploads.map(u => (u.postId === postId ? { ...u, ...changes } : u))
  emit()
}

function remove(postId: number) {
  uploads = uploads.filter(u => u.postId !== postId)
  running.delete(postId)
  emit()
}

const EMPTY: ClipUpload[] = []

export function useClipUploads(): ClipUpload[] {
  return useSyncExternalStore(cb => { listeners.add(cb); return () => { listeners.delete(cb) } }, () => uploads, () => EMPTY)
}

/** Called when an upload ends (ok or failed): the page reloads its posts and shows a toast. */
export function onClipUploadFinished(fn: (postId: number, ok: boolean, title: string) => void): () => void {
  finished.add(fn)
  return () => { finished.delete(fn) }
}

export function cancelClipUpload(postId: number) {
  running.get(postId)?.abort(true).catch(() => {})
  remove(postId)
}

/** Takes a frame at 1 second of a local video file as a small JPEG data URL (null when the browser cannot). */
async function framePreview(file: File): Promise<string | null> {
  if (typeof document === 'undefined') return null
  const url = URL.createObjectURL(file)
  try {
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'metadata'
    video.src = url
    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve()
      video.onerror = () => reject(new Error('no frame'))
      setTimeout(() => reject(new Error('timeout')), 4000)
    })
    video.currentTime = Math.min(1, (video.duration || 2) / 2)
    await new Promise<void>(resolve => { video.onseeked = () => resolve(); setTimeout(resolve, 1500) })
    const canvas = document.createElement('canvas')
    const scale = 360 / Math.max(video.videoWidth || 360, video.videoHeight || 640)
    canvas.width = Math.round((video.videoWidth || 360) * scale)
    canvas.height = Math.round((video.videoHeight || 640) * scale)
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.7)
  } catch {
    return null
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function startClipUpload(token: string, postId: number, title: string, file: File) {
  cancelClipUpload(postId)
  uploads = [{ postId, title, percent: 0, preview: null, error: null }, ...uploads]
  emit()
  framePreview(file).then(preview => { if (preview) patch(postId, { preview }) })
  const fail = (text: string) => {
    patch(postId, { error: text })
    running.delete(postId)
    finished.forEach(fn => fn(postId, false, title))
  }
  const { data: info, error } = await createVideoUpload(token, title || file.name)
  if (!info) return fail(error ?? 'Không bắt đầu được việc tải video')
  const tus = await import('tus-js-client')
  const upload = new tus.Upload(file, {
    endpoint: info.endpoint,
    retryDelays: [0, 3000, 5000, 10000, 20000],
    headers: {
      AuthorizationSignature: info.authorizationSignature,
      AuthorizationExpire: String(info.authorizationExpire),
      VideoId: info.videoId,
      LibraryId: String(info.libraryId),
    },
    metadata: { filetype: file.type, title: title || file.name },
    onError: err => fail(err?.message || String(err)),
    onProgress: (sent, total) => patch(postId, { percent: Math.min(99, Math.round((sent / total) * 100)) }),
    onSuccess: async () => {
      const { error: attachError } = await attachMyMedia(token, postId, info.mediaUrl, info.posterUrl)
      if (attachError) return fail(`video đã tải lên nhưng chưa gắn được vào bài (${attachError})`)
      remove(postId)
      finished.forEach(fn => fn(postId, true, title))
    },
  })
  running.set(postId, upload)
  upload.start()
}

/** Leaving the page while a clip uploads loses it: the browser asks first. */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', e => { if (running.size > 0) e.preventDefault() })
}
