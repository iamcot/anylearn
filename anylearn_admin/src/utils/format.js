/** Format số theo locale Việt Nam: 1.234.567 */
export const fmtVND = (v) =>
  Number(v ?? 0).toLocaleString('vi-VN')

/** Format số triệu: 11.276 triệu */
export const fmtM = (v) =>
  Math.round((v ?? 0) / 1_000_000).toLocaleString('vi-VN')

/** Format datetime: HH:MM DD/MM/YYYY */
export const fmtDateTime = (v) => {
  if (!v) return '—'
  const d = new Date(v)
  if (isNaN(d.getTime())) return v
  const HH = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const DD = String(d.getDate()).padStart(2, '0')
  const MM = String(d.getMonth() + 1).padStart(2, '0')
  const YYYY = d.getFullYear()
  return `${HH}:${mm} ${DD}/${MM}/${YYYY}`
}

/** Format date only: DD/MM/YYYY from ISO string or Date */
export const fmtDate = (v) => {
  if (!v) return '—'
  const s = typeof v === 'string' ? v.split('T')[0] : v
  const parts = s.split('-')
  if (parts.length !== 3) return v
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}
