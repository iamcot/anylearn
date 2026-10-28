import type { ExplorePost, ExploreStatus } from '@/lib/api/explore'

export type CreatorAction = 'view' | 'edit' | 'hide' | 'show' | 'delete'

/** Off the feed: the creator may show it again (or send it for review), edit or delete it. */
export function isOff(status: ExploreStatus | undefined): boolean {
  return status === 'hidden' || status === 'rejected' || status === 'draft'
}

/** The three buttons on a tile of "Bài đăng của tôi": live or waiting → Xem, Sửa, Ẩn; hidden → Hiện, Sửa, Xóa. */
export function creatorActions(post: Pick<ExplorePost, 'status'>): CreatorAction[] {
  if (isOff(post.status)) return ['show', 'edit', 'delete']
  return ['view', 'edit', 'hide']
}

/** Label on a tile, or null for a live post. */
export function statusLabel(post: Pick<ExplorePost, 'status' | 'hiddenBy' | 'afterUpload'>): string | null {
  switch (post.status) {
    case 'pending': return 'Chờ duyệt'
    case 'rejected': return 'Bị từ chối'
    case 'hidden': return post.hiddenBy === 'admin' ? 'Admin đã ẩn' : 'Đã ẩn'
    case 'draft': return post.afterUpload ? 'Chưa tải xong' : 'Nháp'
    default: return null
  }
}

/** What happens after "Hiện" or a save, said to the creator. */
export function statusAfterText(status: ExploreStatus): string {
  if (status === 'published') return 'Bài đã hiện ở Khám phá'
  if (status === 'pending') return 'Bài đã gửi, chờ anyLEARN duyệt'
  if (status === 'hidden') return 'Đã lưu, bài vẫn đang ẩn'
  return 'Đã lưu'
}

/** Adds the posts of the next page, keeping the first copy of each id. */
export function mergePosts<T extends { id: number }>(current: T[], next: T[]): T[] {
  const seen = new Set(current.map(p => p.id))
  return [...current, ...next.filter(p => !seen.has(p.id))]
}
