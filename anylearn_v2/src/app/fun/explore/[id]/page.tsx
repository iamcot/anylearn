import { notFound, permanentRedirect } from 'next/navigation'
import { getPublicExplorePost } from '@/lib/api/explore'
import { keptQuery } from '@/lib/explore/publicPath'

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }

/** /fun/explore/{id} (and the old /fun/explore?p={id}, see next.config.ts) → the address with the post's slug. */
export default async function ExplorePostRedirect({ params, searchParams }: Props) {
  const id = Number((await params).id)
  if (!Number.isInteger(id) || id <= 0) notFound()
  const post = await getPublicExplorePost(id)
  if (!post || !post.id) notFound()
  permanentRedirect(`/fun/explore/${post.id}/${post.slug}${keptQuery(await searchParams)}`)
}
