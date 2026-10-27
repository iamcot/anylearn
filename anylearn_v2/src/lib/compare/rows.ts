import type { CompareCourse } from '@/lib/api/compare'
import { SUBTYPE_LABELS } from '@/config/itemLabels'
import { formatExactPrice } from '@/lib/format/price'
import { formatPoints } from '@/lib/points/reward'
import { POINT_VALUE_VND } from '@/config/points'

export const NO_INFO = 'Chưa có thông tin'

export interface CompareRow {
  key: string
  label: string
  /** Name of the icon the table draws before the label (see ROW_ICONS in the view). */
  icon: string
  /** Key into `best` when this row can show a clear best figure. */
  bestKey?: string
  /** Keep the row even when no course has the information (it then reads "Chưa có thông tin"). */
  alwaysShow?: boolean
  /** Text of the cell, or null when the course has no such information. */
  cell: (course: CompareCourse) => string | null
}

function ratingText(course: CompareCourse): string | null {
  if (course.ratingAverage == null || course.ratingCount <= 0) return null
  return `${course.ratingAverage.toFixed(1).replace('.', ',')} ★ từ ${course.ratingCount} đánh giá`
}

/** 6 -> "6", 1.5 -> "1,5", 12.4 -> "12" (one decimal only under 10). */
function shareText(percent: number): string {
  if (percent >= 10) return String(Math.round(percent))
  const rounded = Math.round(percent * 10) / 10
  return String(rounded).replace('.', ',')
}

/** anyPoint earned with the share of the price it is worth, e.g. "120 anyPoint (~6% giá mua)". */
export function pointsText(points: number, price: number | null): string {
  if (points <= 0) return '0 anyPoint'
  const base = `${formatPoints(points)} anyPoint`
  if (price == null || price <= 0) return base
  const percent = (points * POINT_VALUE_VND * 100) / price
  return `${base} (~${shareText(percent)}% giá mua)`
}

/** The class line of a column: the classes it runs, or the number of sessions when no class is set up. */
function classesText(course: CompareCourse): string | null {
  if (course.schedules.length) return course.schedules.join('\n')
  return course.sessions != null ? `${course.sessions} buổi` : null
}

/** The rows of the table, in reading order. Figures only: nothing here scores or ranks a course. */
export const COMPARE_ROWS: CompareRow[] = [
  { key: 'categories', label: 'Lĩnh vực', icon: 'tag', cell: c => (c.categories.length ? c.categories.join(', ') : null) },
  { key: 'subtype', label: 'Hình thức', icon: 'format', cell: c => (c.subtype ? SUBTYPE_LABELS[c.subtype] ?? c.subtype : null) },
  { key: 'price', label: 'Học phí', icon: 'price', bestKey: 'price', cell: c => (c.price != null && c.price > 0 ? formatExactPrice(c.price) : null) },
  { key: 'sessions', label: 'Số buổi', icon: 'sessions', cell: c => (c.sessions != null ? `${c.sessions} buổi` : null) },
  { key: 'pricePerSession', label: 'Giá mỗi buổi', icon: 'perSession', bestKey: 'pricePerSession', cell: c => (c.pricePerSession != null ? `~${formatExactPrice(c.pricePerSession)}` : null) },
  { key: 'classes', label: 'Lịch học', icon: 'classes', alwaysShow: true, cell: classesText },
  { key: 'ages', label: 'Độ tuổi', icon: 'ages', cell: c => c.ages },
  { key: 'distanceKm', label: 'Khoảng cách', icon: 'distance', bestKey: 'distanceKm', cell: c => (c.distanceKm != null ? `${String(c.distanceKm).replace(".", ",")} km` + (c.branchCount > 1 ? ` (${c.branchCount} cơ sở)` : '') : null) },
  { key: 'rating', label: 'Đánh giá', icon: 'rating', cell: ratingText },
  { key: 'freeTrial', label: 'Học thử', icon: 'trial', cell: c => (c.freeTrial ? 'Có học thử' : null) },
  { key: 'points', label: 'anyPoint nhận về', icon: 'points', bestKey: 'points', cell: c => pointsText(c.points, c.price) },
]

/** Rows where every course has no information (e.g. no position given for the distance) are left out, except the ones marked `alwaysShow`. */
export function visibleRows(courses: CompareCourse[]): CompareRow[] {
  return COMPARE_ROWS.filter(row => row.alwaysShow || courses.some(course => row.cell(course) != null))
}
