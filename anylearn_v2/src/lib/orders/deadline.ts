// "Giữ chỗ đến 21:30 ngày 28/10" from the ISO time the server sends (local time of the server, no zone).
export function formatHoldUntil(isoLocal: string | undefined): string | null {
  if (!isoLocal) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(isoLocal)
  if (!match) return null
  const [, , month, day, hour, minute] = match
  return `${hour}:${minute} ngày ${day}/${month}`
}
