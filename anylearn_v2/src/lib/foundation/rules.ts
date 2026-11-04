/** Where Leo stands on the Foundation bar: the percent kept inside 0..100 (a started house shows a little progress). */
export function barPercent(percent: number): number {
  if (!(percent > 0)) return 0
  return Math.min(100, Math.max(2, percent))
}

/** "căn đầu tiên", "căn thứ 2", ... (never "căn số 1"). */
export function houseOrdinal(n: number): string {
  return n <= 1 ? 'căn đầu tiên' : `căn thứ ${n}`
}

/** The same with a capital letter, for titles: "Căn đầu tiên". */
export function houseTitle(n: number): string {
  const text = houseOrdinal(n)
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** "12.500.000đ". */
export function vnd(amount: number): string {
  return `${Math.round(amount).toLocaleString('vi-VN')}đ`
}

/** "X3" next to the finished houses, nothing when none. */
export function housesBadge(built: number): string | null {
  return built > 0 ? `X${built}` : null
}

/** The line under a course: "Đăng ký khóa này góp 1 bao gạch cho anyLEARN Foundation". */
export function itemLine(label: string | null | undefined): string | null {
  return label ? `Đăng ký khóa này góp ${label} cho anyLEARN Foundation` : null
}
