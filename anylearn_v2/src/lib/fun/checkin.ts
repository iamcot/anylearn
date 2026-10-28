import type { CheckinClaim, CheckinStatus } from '@/lib/api/fun'

/** The line under the gift box. */
export function giftNote(status: CheckinStatus): string {
  if (!status.enabled) return 'Quà điểm danh đang tạm đóng'
  if (!status.claimedToday) return status.nextPoints ? `Mở quà hôm nay nhận ${status.nextPoints} anyPoint` : 'Mở quà hôm nay'
  const toWeekGift = 7 - status.dayInCycle
  return toWeekGift > 0 ? `Đã nhận quà hôm nay, còn ${toWeekGift} ngày nữa tới quà ngày 7` : 'Đã nhận quà ngày 7, tuần mới bắt đầu từ ngày mai'
}

/** What the toast says after a claim. */
export function claimMessage(claim: CheckinClaim): string {
  if (claim.alreadyClaimed) return 'Bạn đã nhận quà hôm nay rồi'
  if (claim.points > 0) return `+${claim.points} anyPoint` + (claim.capped ? ' (quà hôm nay đã hết phần, mai quay lại nhé)' : '')
  return claim.capped ? 'Quà hôm nay đã hết phần, mai quay lại nhé' : 'Đã điểm danh hôm nay'
}

/** After a claim the page shows the new state without asking again. */
export function afterClaim(status: CheckinStatus, claim: CheckinClaim): CheckinStatus {
  if (claim.alreadyClaimed) return { ...status, claimedToday: true }
  const streak = claim.streak ?? status.streak + 1
  const dayInCycle = claim.dayInCycle ?? status.dayInCycle
  return {
    ...status,
    claimedToday: true,
    streak,
    best: Math.max(status.best, streak),
    dayInCycle,
    nextPoints: null,
    days: status.days.map(d => (d.day <= dayInCycle ? { ...d, state: 'done' as const } : d)),
  }
}
