/** Format số theo locale Việt Nam: 1.234.567 */
export const fmtVND = (v) =>
  Number(v ?? 0).toLocaleString('vi-VN')

/** Format số triệu: 11.276 triệu */
export const fmtM = (v) =>
  Math.round((v ?? 0) / 1_000_000).toLocaleString('vi-VN')

/** Format datetime: HH:mm DD/MM/YYYY — works with "2026-10-10 10:28:40" or "2026-10-10T10:28:40.0" */
export const fmtDateTime = (v) => {
  if (!v) return '—'
  const s = String(v).trim()
  const [datePart, timePart] = s.split(/[T ]/)
  if (!datePart) return s
  const [year, month, day] = datePart.split('-')
  if (!year || !month || !day) return s
  const [hour = '00', minute = '00'] = (timePart || '').split(':')
  return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')} ${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`
}

/** Format date only: DD/MM/YYYY from ISO string or Date */
export const fmtDate = (v) => {
  if (!v) return '—'
  const s = typeof v === 'string' ? v.split('T')[0].split(' ')[0] : v
  const parts = s.split('-')
  if (parts.length !== 3) return v
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}
