import { POINT_VALUE_VND } from '@/config/points'

export function formatPoints(points: number): string {
  return points.toLocaleString('vi-VN')
}

export function formatVndAmount(amount: number): string {
  return `${amount.toLocaleString('vi-VN')}đ`
}

export function rewardLabel(points: number, vndValue = points * POINT_VALUE_VND): string {
  return `Nhận +${formatPoints(points)} anyPoint (~${formatVndAmount(vndValue)})`
}

export function cartRewardLabel(points: number): string {
  return `Đơn này bạn sẽ nhận +${formatPoints(points)} anyPoint (~${formatVndAmount(points * POINT_VALUE_VND)})`
}

export function sumCartPoints(items: { points?: number }[]): number {
  return items.reduce((sum, item) => sum + Math.max(0, item.points ?? 0), 0)
}

export function earnedLabel(pointsEarned: number, balance?: number): string {
  const earned = `Đã cộng ${formatPoints(pointsEarned)} anyPoint`
  return balance === undefined ? earned : `${earned}, số dư ${formatPoints(balance)} anyPoint`
}
