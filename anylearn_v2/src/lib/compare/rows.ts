import type { CompareCourse } from '@/lib/api/compare'
import { SUBTYPE_LABELS } from '@/config/itemLabels'
import { formatExactPrice } from '@/lib/format/price'
import { formatPoints } from '@/lib/points/reward'

export const NO_INFO = 'Chưa có thông tin'

export interface CompareRow {
  key: string
  label: string
  /** Key into `best` when this row can show a clear best figure. */
  bestKey?: string
  /** Text of the cell, or null when the course has no such information. */
  cell: (course: CompareCourse) => string | null
}

function ratingText(course: CompareCourse): string | null {
  if (course.ratingAverage == null || course.ratingCount <= 0) return null
  return `${course.ratingAverage.toFixed(1).replace('.', ',')} sao từ ${course.ratingCount} đánh giá`
}

/** The rows of the table, in reading order. Figures only: nothing here scores or ranks a course. */
export const COMPARE_ROWS: CompareRow[] = [
  { key: 'categories', label: 'Lĩnh vực', cell: c => (c.categories.length ? c.categories.join(', ') : null) },
  { key: 'subtype', label: 'Hình thức', cell: c => (c.subtype ? SUBTYPE_LABELS[c.subtype] ?? c.subtype : null) },
  { key: 'price', label: 'Học phí', bestKey: 'price', cell: c => (c.price != null && c.price > 0 ? formatExactPrice(c.price) : null) },
  { key: 'sessions', label: 'Số buổi', cell: c => (c.sessions != null ? `${c.sessions} buổi` : null) },
  { key: 'pricePerSession', label: 'Giá mỗi buổi', bestKey: 'pricePerSession', cell: c => (c.pricePerSession != null ? `~${formatExactPrice(c.pricePerSession)}` : null) },
  { key: 'schedules', label: 'Lịch học', cell: c => (c.schedules.length ? c.schedules.join('\n') : null) },
  { key: 'dateStart', label: 'Khai giảng', cell: c => (c.dateStart ? c.dateStart.split('-').reverse().join('/') : null) },
  { key: 'ages', label: 'Độ tuổi', cell: c => c.ages },
  { key: 'distanceKm', label: 'Khoảng cách', bestKey: 'distanceKm', cell: c => (c.distanceKm != null ? `${c.distanceKm} km` + (c.branchCount > 1 ? ` (${c.branchCount} cơ sở)` : '') : null) },
  { key: 'rating', label: 'Đánh giá', cell: ratingText },
  { key: 'freeTrial', label: 'Học thử', cell: c => (c.freeTrial ? 'Có học thử' : null) },
  { key: 'points', label: 'anyPoint nhận được', bestKey: 'points', cell: c => (c.points > 0 ? `${formatPoints(c.points)} anyPoint` : null) },
]

/** Rows where every course has no information (e.g. no position given for the distance) are left out of the table. */
export function visibleRows(courses: CompareCourse[]): CompareRow[] {
  return COMPARE_ROWS.filter(row => courses.some(course => row.cell(course) != null))
}
