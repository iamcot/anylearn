import type { CartItem } from '@/lib/api'

export interface LearnerNeedingDob {
  learnerId: number
  // null = the account owner, otherwise the id of the child
  childId: number | null
  name: string
  // Year the guest gave earlier; the form starts with it
  knownYear: number | null
}

// A learner needs a full date of birth before paying while the server says it is incomplete (birth year only, or none).
// Cart lines from an older backend carry no flag and are never blocked here.
export function learnersMissingFullDob(items: CartItem[]): LearnerNeedingDob[] {
  const found = new Map<number, LearnerNeedingDob>()
  for (const item of items) {
    if (item.dobComplete !== false || item.learnerId === undefined || found.has(item.learnerId)) continue
    found.set(item.learnerId, {
      learnerId: item.learnerId,
      childId: item.studentId ?? null,
      name: item.learnerName ?? item.studentName ?? 'Người học',
      knownYear: item.learnerDobYear ?? null,
    })
  }
  return [...found.values()]
}

export interface DobInput {
  day: number
  month: number
  year: number
}

export type DobCheck =
  | { ok: true; dob: string; yearChanged: boolean }
  | { ok: false; message: string }

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

// Real calendar date, not in the future. `yearChanged` tells the form to ask "did you mean another year?"
export function checkFullDob(input: DobInput, knownYear: number | null, today: Date): DobCheck {
  const { day, month, year } = input
  if (!day || !month || !year) return { ok: false, message: 'Chọn đủ ngày, tháng và năm sinh' }
  const date = new Date(Date.UTC(year, month - 1, day))
  const isRealDate = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  if (!isRealDate) return { ok: false, message: 'Ngày sinh không tồn tại, vui lòng chọn lại' }
  if (date.getTime() > Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) {
    return { ok: false, message: 'Ngày sinh không được ở tương lai' }
  }
  return { ok: true, dob: `${year}-${pad(month)}-${pad(day)}`, yearChanged: knownYear !== null && knownYear !== year }
}

export function nextLearnerMessage(learners: LearnerNeedingDob[]): string {
  const first = learners[0]
  if (!first) return ''
  const others = learners.length - 1
  return others > 0 ? `Nhập ngày sinh của ${first.name} và ${others} người học khác để tiếp tục` : `Nhập ngày sinh của ${first.name} để tiếp tục`
}
