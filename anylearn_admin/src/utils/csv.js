// CSV that Excel opens with Vietnamese letters intact (UTF-8 with a byte order mark).
export function toCsv(columns, rows) {
  const escape = (value) => {
    const text = value === null || value === undefined ? '' : String(value)
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  const header = columns.map((column) => escape(column.title)).join(',')
  const lines = rows.map((row) => columns.map((column) => escape(row[column.key])).join(','))
  return [header, ...lines].join('\r\n')
}

export function downloadCsv(filename, columns, rows) {
  const blob = new Blob(['﻿', toCsv(columns, rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
