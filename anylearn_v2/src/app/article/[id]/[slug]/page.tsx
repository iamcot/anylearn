import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getArticle, getArticleUrl } from '@/lib/api'

interface Props {
  params: Promise<{ id: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const article = await getArticle(Number(id))
  if (!article) return { title: 'Bài viết | anyLEARN' }
  return {
    title: `${article.title} | anyLEARN`,
    description: article.short_content ?? 'Bài viết từ anyLEARN',
    openGraph: {
      title: article.title,
      description: article.short_content ?? '',
      images: article.image ? [{ url: article.image }] : [],
    },
  }
}

const TYPE_LABELS: Record<string, string> = {
  read: '📖 Bài viết',
  video: '🎬 Video',
  event: '📅 Sự kiện',
  promotion: '🎁 Khuyến mãi',
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return ''
  }
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

  // Canonical URL for SEO redirect if slug is wrong
  const canonicalUrl = getArticleUrl(article)

  return (
    <div className="container" style={{ maxWidth: 800, padding: '2rem 1rem' }}>
      {/* Breadcrumb */}
      <nav className="flex gap-2 text-sm text-[#6d7a8a] mb-6">
        <Link href="/" className="hover:text-blue">Trang chủ</Link>
        <span>/</span>
        <Link href="/article" className="hover:text-blue">Bài viết</Link>
        <span>/</span>
        <span className="text-[#17212f] truncate max-w-[200px]">{article.title}</span>
      </nav>

      {/* Type badge + meta */}
      <div className="flex items-center gap-3 mb-4">
        <span className="bg-[#00539b] text-white rounded-full px-3 py-1 text-xs font-black uppercase">
          {TYPE_LABELS[article.type] ?? article.type}
        </span>
        {article.createdAt && (
          <span className="text-[#6d7a8a] text-sm">{formatDate(article.createdAt)}</span>
        )}
        {article.view != null && (
          <span className="text-[#6d7a8a] text-sm">👁 {article.view.toLocaleString('vi-VN')} lượt xem</span>
        )}
      </div>

      {/* Title */}
      <h1 className="text-[28px] font-black text-[#17212f] leading-snug mb-5">{article.title}</h1>

      {/* Video player (type=video) */}
      {isVideo && (
        <div className="rounded-[18px] overflow-hidden mb-6" style={{ aspectRatio: '16/9' }}>
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
        <div className="rounded-[18px] overflow-hidden mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={article.image} alt={article.title} className="w-full object-cover max-h-[400px]" />
        </div>
      )}

      {/* Content */}
      {article.content ? (
        <div
          className="prose prose-lg max-w-none text-[#374151]"
          style={{ lineHeight: 1.8 }}
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      ) : article.short_content ? (
        <p className="text-[#374151] text-lg leading-relaxed">{article.short_content}</p>
      ) : null}

      {/* Tags */}
      {article.tags && (
        <div className="mt-8 pt-6 border-t border-[#e6edf4] flex gap-2 flex-wrap">
          {article.tags.split(',').map(tag => tag.trim()).filter(Boolean).map(tag => (
            <span key={tag} className="bg-[#eef5ff] text-blue text-sm px-3 py-1 rounded-full">#{tag}</span>
          ))}
        </div>
      )}

      {/* Back link */}
      <div className="mt-10 pt-6 border-t border-[#e6edf4]">
        <Link href="/article" className="text-blue font-black hover:underline">← Xem tất cả bài viết</Link>
      </div>
    </div>
  )
}
