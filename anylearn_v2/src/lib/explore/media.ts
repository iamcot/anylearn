export type VideoSource = { kind: 'file'; src: string } | { kind: 'youtube'; src: string } | { kind: 'hls'; src: string }

/** How a clip link is played: a YouTube link becomes an embed, anything else is a video file. */
export function videoSource(url: string): VideoSource {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,15})/)
  if (match) return { kind: 'youtube', src: `https://www.youtube.com/embed/${match[1]}?playsinline=1&rel=0` }
  if (isHls(url)) return { kind: 'hls', src: url }
  return { kind: 'file', src: url }
}

/** A streaming playlist (Bunny Stream gives `…/playlist.m3u8`): played natively on Safari and with hls.js elsewhere. */
export function isHls(url: string): boolean {
  return /\.m3u8(?:[?#].*)?$/i.test(url.trim())
}

/** 950 → "950", 1234 → "1,2K", 12500 → "12K". */
export function countText(n: number): string {
  if (n < 1000) return String(n)
  if (n < 10000) return `${(n / 1000).toFixed(1).replace('.', ',').replace(',0', '')}K`
  return `${Math.round(n / 1000)}K`
}

/** The link a post is shared with; it opens the viewer on that post. */
export function postLink(origin: string, id: number): string {
  return `${origin.replace(/\/+$/, '')}/fun/explore?p=${id}`
}

/** A picture for a grid tile: the photo, the clip's poster, a YouTube thumbnail, the Bunny thumbnail, or null (article). */
export function thumbOf(post: { kind: string; mediaUrl: string | null; posterUrl: string | null }): string | null {
  if (post.kind === 'image') return post.mediaUrl
  if (post.posterUrl) return post.posterUrl
  const url = post.mediaUrl ?? ''
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,15})/)
  if (yt) return `https://img.youtube.com/vi/${yt[1]}/hqdefault.jpg`
  if (isHls(url)) return url.replace(/playlist\.m3u8.*$/i, 'thumbnail.jpg')
  return null
}
