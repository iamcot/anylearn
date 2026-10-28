import { useSyncExternalStore } from 'react'
import { message } from 'antd'
import * as tus from 'tus-js-client'
import client from '../api/client'

// Video uploads to Bunny run here, outside any page, so the admin can close the form and go elsewhere (as long as the tab stays open).
// Each upload belongs to a post that already exists as a draft; when it finishes the post gets its clip and the admin gets a toast.
let uploads = []
let snapshot = []
let onFinished = () => {}
const listeners = new Set()

function emit() {
  snapshot = [...uploads]
  listeners.forEach(l => l())
}

function patch(id, changes) {
  uploads = uploads.map(u => (u.id === id ? { ...u, ...changes } : u))
  emit()
}

function remove(id) {
  uploads = uploads.filter(u => u.id !== id)
  emit()
}

/** Called after an upload ends (done or failed) so the page can reload the posts. */
export function setUploadsFinishedHandler(fn) {
  onFinished = fn || (() => {})
}

export function useVideoUploads() {
  return useSyncExternalStore(
    cb => { listeners.add(cb); return () => listeners.delete(cb) },
    () => snapshot,
  )
}

export function hasActiveUploads() {
  return uploads.length > 0
}

export function cancelVideoUpload(id) {
  const u = uploads.find(x => x.id === id)
  if (!u) return
  u.tus?.abort(true).catch(() => {})
  remove(id)
  message.info(`Đã hủy tải video "${u.title}"`)
}

/**
 * Uploads a clip of a Khám phá post (default) or, with `createPath` + `attach`, any other video: `createPath` returns the
 * TUS info from the server and `attach(info)` tells the server the file has arrived (plan 17 uses it for lessons).
 */
export async function startVideoUpload({ postId, title, file, onDone, createPath, attach, doneText }) {
  const id = `${postId}-${Date.now()}`
  uploads = [...uploads, { id, postId, title, percent: 0, tus: null }]
  emit()
  const fail = text => { remove(id); message.error(`Tải video "${title}" thất bại: ${text}`, 8); onFinished() }
  try {
    const res = await client.post(createPath || '/admin/explore/video-upload', { title: title || file.name }).then(r => r.data)
    if (res.resultCode !== 1) return fail(res.message)
    const info = res.data
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
      onProgress: (sent, total) => patch(id, { percent: Math.round((sent / total) * 100) }),
      onSuccess: async () => {
        try {
          const done = await (attach ? attach(info) : client.put(`/admin/explore/posts/${postId}/media`, { mediaUrl: info.mediaUrl, posterUrl: info.posterUrl })).then(r => r.data)
          if (done.resultCode !== 1) throw new Error(done.message)
          remove(id)
          onDone?.({ mediaUrl: info.mediaUrl, posterUrl: info.posterUrl })
          message.success(doneText || `Video "${title}" đã tải xong và gắn vào bài. Bunny cần vài phút xử lý trước khi phát được, bài đang ở Nháp.`, 8)
          onFinished()
        } catch (e) {
          fail(`video đã lên Bunny nhưng chưa gắn được vào bài (${e.message})`)
        }
      },
    })
    patch(id, { tus: upload })
    upload.start()
  } catch (e) {
    fail(e.message || 'Không bắt đầu được việc tải video')
  }
}
