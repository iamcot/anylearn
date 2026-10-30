import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound, permanentRedirect } from 'next/navigation'
import ExploreViewer from '@/components/fun/explore/ExploreViewer'
import JsonLd from '@/components/seo/JsonLd'
import { getPublicExplorePost, type PublicExplorePost } from '@/lib/api/explore'
import { siteOrigin } from '@/lib/achievements/share'
import { thumbOf, videoSource } from '@/lib/explore/media'
import { keptQuery } from '@/lib/explore/publicPath'
import { breadcrumbLd, isoVn, videoLd } from '@/lib/seo/jsonLd'
import { detailMeta } from '@/lib/seo/shareMeta'

type Props = { params: Promise<{ id: string; slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }

async function load(rawId: string): Promise<PublicExplorePost | null> {
  const id = Number(rawId)
  if (!Number.isInteger(id) || id <= 0) return null
  const post = await getPublicExplorePost(id)
  return post && post.id ? post : null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await load((await params).id)
  if (!post) return { title: 'Khám phá | anyLEARN' }
  const image = thumbOf(post)
  const meta = detailMeta({
    title: `${post.title} | Khám phá anyLEARN`,
    ogTitle: post.title,
    description: (post.body ?? '').slice(0, 200) || 'Clip, mẹo nuôi dạy con và chuyện vui cùng Leo trên anyLEARN.',
    image,
    path: `/fun/explore/${post.id}/${post.slug}`,
  })
  const media = post.kind === 'video' && post.mediaUrl ? videoSource(post.mediaUrl) : null
  if (media?.kind === 'file' && meta.openGraph) meta.openGraph = { ...meta.openGraph, type: 'video.other', videos: [{ url: media.src }] }
  return meta
}

/**
 * The public page of a Khám phá post (plan 19.A3): rendered on the server for everyone, the same content for search engines
 * and visitors. A visitor watches this post, then is asked to sign in for more; a member gets the feed from here.
 */
export default async function PublicExplorePage({ params, searchParams }: Props) {
  const { id, slug } = await params
  const post = await load(id)
  if (!post) notFound()
  if (slug !== post.slug) permanentRedirect(`/fun/explore/${post.id}/${post.slug}${keptQuery(await searchParams)}`)

  const origin = siteOrigin()
  const path = `/fun/explore/${post.id}/${post.slug}`
  const canonical = origin + path
  const media = post.kind === 'video' && post.mediaUrl ? videoSource(post.mediaUrl) : null
  return (
    <>
      <JsonLd data={[
        media ? videoLd({
          url: canonical, name: post.title, description: post.body, thumbnailUrl: thumbOf(post), uploadDate: isoVn(post.publishedAt), views: post.views,
          contentUrl: media.kind === 'youtube' ? null : media.src, embedUrl: media.kind === 'youtube' ? media.src : null,
        }) : null,
        breadcrumbLd(origin, [{ name: 'Trang chủ', path: '/' }, { name: 'Vui học', path: '/fun' }, { name: post.title, path }]),
      ]} />
      <Suspense fallback={null}><ExploreViewer initialPost={post} /></Suspense>
    </>
  )
}
