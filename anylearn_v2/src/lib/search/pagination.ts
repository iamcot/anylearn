export type PageItem = number | 'gap'

export function pageItems(currentPage: number, totalPages: number): PageItem[] {
  const pages = Array.from({ length: totalPages }, (_, index) => index)
    .filter(page => page === 0 || page === totalPages - 1 || Math.abs(page - currentPage) <= 1)

  return pages.reduce<PageItem[]>((items, page, index) => {
    const previous = pages[index - 1]
    if (previous !== undefined && page - previous > 1) items.push('gap')
    items.push(page)
    return items
  }, [])
}
