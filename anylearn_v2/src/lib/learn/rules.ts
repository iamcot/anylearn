// Pure helpers of the video courses (plan 17).

/** 3900 → "1:05:00", 125 → "2:05". */
export function clock(seconds: number | null | undefined): string {
  if (!seconds || seconds < 0) return ''
  const s = Math.floor(seconds)
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}` : `${m}:${String(r).padStart(2, '0')}`
}

/** 1 = Thứ 2 … 6 = Thứ 7, 7 = Chủ nhật; short labels for chips. */
export const WEEKDAYS: { value: number; short: string }[] = [
  { value: 1, short: 'T2' }, { value: 2, short: 'T3' }, { value: 3, short: 'T4' }, { value: 4, short: 'T5' },
  { value: 5, short: 'T6' }, { value: 6, short: 'T7' }, { value: 7, short: 'CN' },
]

export function toggleDay(days: number[], day: number): number[] {
  return days.includes(day) ? days.filter(d => d !== day) : [...days, day].sort((a, b) => a - b)
}

/** "T3, T5 lúc 20:00". */
export function planText(days: number[], time: string | null): string {
  const names = [...days].sort((a, b) => a - b).map(d => WEEKDAYS.find(w => w.value === d)?.short ?? '')
  return names.join(', ') + (time ? ` lúc ${time}` : '')
}

/**
 * Counts real playing time between progress saves: every timeupdate adds the gap since the previous one when it is
 * small (normal playback); a jump (seeking) adds nothing. The server caps each save again.
 */
export function watchStep(prev: number | null, now: number): number {
  if (prev == null) return 0
  const gap = now - prev
  return gap > 0 && gap <= 2 ? gap : 0
}

/** The text of the main button on a course page or a course card. */
export function resumeLabel(p: { started?: boolean; percent?: number; resumeNo?: number | null; resumeTitle?: string | null }): string {
  if (!p.started) return 'Bắt đầu học'
  if ((p.percent ?? 0) >= 100) return 'Xem lại khóa học'
  return p.resumeNo ? `Học tiếp: Bài ${p.resumeNo}${p.resumeTitle ? ` – ${p.resumeTitle}` : ''}` : 'Học tiếp'
}

/** Link of the learning page for a lesson and learner. */
export function learnHref(itemId: number, lessonId?: number | null, learnerId?: number | null): string {
  const q = new URLSearchParams()
  if (lessonId) q.set('lesson', String(lessonId))
  if (learnerId) q.set('learner', String(learnerId))
  const s = q.toString()
  return `/learn/${itemId}${s ? `?${s}` : ''}`
}

/** The first free lesson that can be played, for the "Học thử" button of a course page. */
export function firstFreeLesson<T extends { free: boolean; playable: boolean }>(chapters: { lessons: T[] }[]): T | null {
  for (const c of chapters) for (const l of c.lessons) if (l.free && l.playable) return l
  return null
}
