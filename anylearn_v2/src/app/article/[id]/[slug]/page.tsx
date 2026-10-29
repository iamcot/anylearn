import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getArticle } from '@/lib/api'
import { formatDate } from '@/lib/format/date'
import BackLink from '@/components/BackLink'
import ArticleTypeLabel from '@/components/article/ArticleTypeLabel'
import { ChevronRightIcon } from '@/components/icons'
import { detailMeta } from '@/lib/seo/shareMeta'

interface Props {
  params: Promise<{ id: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const article = await getArticle(Number(id))
  if (!article) return { title: 'Bài viết | anyLEARN' }
  return detailMeta({ title: `${article.title} | anyLEARN`, ogTitle: article.title, description: article.short_content ?? 'Bài viết từ anyLEARN', image: article.image })
}

function getVideoEmbedUrl(url: string): string {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  return url
}

export default async function ArticleDetailPage({ params }: Props) {
  const { id } = await params
  const article = await getArticle(Number(id))
  if (!article) notFound()

  const isVideo = article.type === 'video' && !!article.video

  return (
    <div className="container max-w-[800px] py-8 lg:py-12">
      {/* Breadcrumb */}
      <nav aria-label="Đường dẫn" className="mb-6 flex items-center gap-1 text-sm text-muted">
        <Link href="/" className="shrink-0 whitespace-nowrap hover:text-blue">Trang chủ</Link>
        <ChevronRightIcon className="size-4 shrink-0" />
        <Link href="/article" className="shrink-0 whitespace-nowrap hover:text-blue">Bài viết</Link>
        <ChevronRightIcon className="size-4 shrink-0" />
        <span className="min-w-0 truncate text-ink">{article.title}</span>
      </nav>

      {/* Type badge + meta */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-blue px-3 py-1 text-xs font-semibold uppercase text-white">
          <ArticleTypeLabel type={article.type} />
        </span>
        {article.createdAt && (
          <span className="text-sm text-muted">{formatDate(article.createdAt)}</span>
        )}
        {article.view != null && (
          <span className="text-sm text-muted">{article.view.toLocaleString('vi-VN')} lượt xem</span>
        )}
      </div>

      {/* Title */}
      <h1 className="mb-5 text-[28px] font-extrabold leading-snug text-ink">{article.title}</h1>

      {/* Video player (type=video) */}
      {isVideo && (
        <div className="mb-6 aspect-video overflow-hidden rounded-card">
          <iframe
            src={getVideoEmbedUrl(article.video!)}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {/* Cover image — only for non-video articles */}
      {!isVideo && article.image && (
        <div className="mb-6 overflow-hidden rounded-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={article.image} alt={article.title} className="w-full object-cover max-h-[400px]" />
        </div>
      )}

      {/* Content */}
      {article.content ? (
        <div
          className="rich-content text-lg"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      ) : article.short_content ? (
        <p className="text-lg leading-relaxed text-text">{article.short_content}</p>
      ) : null}

      {/* Tags */}
      {article.tags && (
        <div className="mt-8 pt-6 border-t border-line flex gap-2 flex-wrap">
          {article.tags.split(',').map(tag => tag.trim()).filter(Boolean).map(tag => (
            <span key={tag} className="rounded-full bg-blue-soft px-3 py-1 text-sm text-blue">#{tag}</span>
          ))}
        </div>
      )}

      {/* Back link */}
      <div className="mt-10 pt-6 border-t border-line">
        <BackLink href="/article">Xem tất cả bài viết</BackLink>
      </div>
    </div>
  )
}
