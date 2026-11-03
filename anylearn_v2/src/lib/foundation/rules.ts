/** Rows of bricks drawn in the house picture. */
export const HOUSE_ROWS = 8

/** How many brick rows of the house in progress are filled for a percent (a started house shows at least one row). */
export function filledRows(percent: number, rows = HOUSE_ROWS): number {
  if (!(percent > 0)) return 0
  return Math.min(rows, Math.max(1, Math.round(percent * rows / 100)))
}

/** The stage of the house picture: brick pile, walls, roof, door, done. */
export function houseStage(percent: number): 'bricks' | 'walls' | 'roof' | 'door' | 'done' {
  if (percent >= 100) return 'done'
  if (percent >= 75) return 'door'
  if (percent >= 50) return 'roof'
  if (percent >= 20) return 'walls'
  return 'bricks'
}

/** "12.500.000đ". */
export function vnd(amount: number): string {
  return `${Math.round(amount).toLocaleString('vi-VN')}đ`
}

/** "X3" next to the finished houses, nothing when none. */
export function housesBadge(built: number): string | null {
  return built > 0 ? `X${built}` : null
}

/** The line under a course: "Đăng ký khóa này góp 1 xô gạch cho anyLEARN Foundation". */
export function itemLine(label: string | null | undefined): string | null {
  return label ? `Đăng ký khóa này góp ${label} cho anyLEARN Foundation` : null
}
