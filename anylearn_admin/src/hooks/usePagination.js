import { useState } from 'react'

/**
 * Hook phân trang server-side không cần biết tổng số records.
 * Nếu API trả đủ pageSize → có thể còn trang sau.
 * Nếu trả ít hơn → đây là trang cuối.
 */
export function usePagination(pageSize = 20) {
  const [page, setPage] = useState(1)

  function paginationProps(content) {
    const len = content?.length ?? 0
    const hasMore = len === pageSize
    return {
      current: page,
      pageSize,
      showSizeChanger: false,
      onChange: (p) => setPage(p),
      total: hasMore ? page * pageSize + 1 : (page - 1) * pageSize + len,
      showTotal: (_, range) => `${range[0]}–${range[1]}`,
    }
  }

  return { page, setPage, paginationProps }
}
