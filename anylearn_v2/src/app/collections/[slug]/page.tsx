import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCollection } from '@/lib/api'
import BackLink from '@/components/BackLink'
import CourseCard from '@/components/CourseCard'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const collection = await getCollection(slug)
  if (!collection) return { title: 'Bộ sưu tập | anyLEARN' }
  return {
    title: `${collection.title} | anyLEARN`,
    description: collection.subtitle ?? `Các khóa học trong bộ sưu tập ${collection.title}.`,
  }
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params
  const collection = await getCollection(slug)
  if (!collection) notFound()

  return (
    <div className="container py-6 lg:py-10">
      <BackLink href="/">Trang chủ</BackLink>
      <header className="mb-6 mt-3 overflow-hidden rounded-card border border-line bg-gradient-to-br from-blue to-green text-white">
        <div
          className="bg-cover bg-center px-6 py-8 lg:px-10 lg:py-12"
          style={collection.cover ? { backgroundImage: `linear-gradient(rgba(0,0,0,.45), rgba(0,0,0,.45)), url(${collection.cover})` } : undefined}
        >
          <h1 className="m-0 mb-2 text-2xl font-extrabold lg:text-4xl">{collection.title}</h1>
          {collection.subtitle && <p className="m-0 max-w-2xl text-white/90 lg:text-lg">{collection.subtitle}</p>}
          <p className="m-0 mt-3 text-sm text-white/80">{collection.items.length} khóa học</p>
        </div>
      </header>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {collection.items.map(item => <CourseCard key={item.id} item={item} />)}
      </div>
    </div>
  )
}
