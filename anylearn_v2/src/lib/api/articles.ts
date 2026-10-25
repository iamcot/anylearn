import { apiFetch } from './client'

export interface Article {
  id: number
  title: string
  type: string
  image?: string
  short_content?: string
  view?: number
  like?: number
  createdAt?: string
}

export interface ArticleDetail extends Article {
  content?: string
  video?: string
  tags?: string
  userId?: number
}

export interface ArticleListResult {
  items: Article[]
  page: number
  limit: number
  total: number
}

export function getArticleUrl(article: { id: number; title: string }): string {
  const slug = article.title.toLowerCase()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `/article/${article.id}/${slug}.html`
}

export async function getArticles(page = 0, limit = 12, type?: string): Promise<ArticleListResult> {
  let path = `/article?page=${page}&limit=${limit}`
  if (type) path += `&type=${encodeURIComponent(type)}`
  const result = await apiFetch<ArticleListResult>(path)
  return result ?? { items: [], page, limit, total: 0 }
}

export async function getArticle(id: number): Promise<ArticleDetail | null> {
  return apiFetch<ArticleDetail>(`/article/${id}`)
}
