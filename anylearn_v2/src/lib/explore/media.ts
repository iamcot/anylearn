export type VideoSource = { kind: 'file'; src: string } | { kind: 'youtube'; src: string }

/** How a clip link is played: a YouTube link becomes an embed, anything else is a video file. */
export function videoSource(url: string): VideoSource {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,15})/)
  if (match) return { kind: 'youtube', src: `https://www.youtube.com/embed/${match[1]}?playsinline=1&rel=0` }
  return { kind: 'file', src: url }
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
