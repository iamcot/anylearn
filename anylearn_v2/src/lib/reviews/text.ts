// Adds a quick phrase to a comment ("Lớp vui" + "Giáo viên tốt" -> "Lớp vui. Giáo viên tốt"); one already there is not added twice.
export function appendPhrase(comment: string, phrase: string): string {
  const text = comment.trim()
  if (text.toLowerCase().includes(phrase.toLowerCase())) return comment
  if (!text) return phrase
  const separator = /[.!?]$/.test(text) ? ' ' : '. '
  return `${text}${separator}${phrase}`
}

// Share of each star level in percent, 5 stars first; all zero when there is no review.
export function distributionPercents(distribution: Record<string, number>, count: number): { stars: number; percent: number }[] {
  return [5, 4, 3, 2, 1].map(stars => ({ stars, percent: count > 0 ? Math.round(((distribution[String(stars)] ?? 0) / count) * 100) : 0 }))
}

// The line above the review form about the anyPoint a review earns; empty when the rewards are off.
export function rewardHint(rewards: { textPoints: number; mediaPoints: number; minTextLength: number } | null): string {
  if (!rewards) return ''
  const parts: string[] = []
  if (rewards.textPoints > 0) parts.push(`+${rewards.textPoints} anyPoint khi viết từ ${rewards.minTextLength} ký tự`)
  if (rewards.mediaPoints > 0) parts.push(`thêm +${rewards.mediaPoints} anyPoint khi có ảnh`)
  return parts.join(', ')
}

export function rewardThanks(pointsGiven: number): string {
  return pointsGiven > 0 ? `Cảm ơn bạn đã đánh giá! Bạn vừa nhận +${pointsGiven} anyPoint.` : 'Cảm ơn bạn đã đánh giá!'
}
