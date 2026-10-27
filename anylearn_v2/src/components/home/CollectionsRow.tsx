import Link from 'next/link'
import type { CollectionCard } from '@/lib/api'

const FALLBACK_BACKGROUNDS = [
  'from-green-dark to-green',
  'from-blue to-green',
  'from-blue-dark to-blue',
]

// Editorial lists as wide cards: a photo (or a colour) with the title on it. Opens /collections/{slug}.
export default function CollectionsRow({ collections, title = 'Bộ sưu tập' }: { collections: CollectionCard[]; title?: string }) {
  if (collections.length === 0) return null
  return (
    <section className="pt-6 lg:pt-8">
      <div className="container">
        <h2 className="mb-3 mt-0 text-lg font-extrabold text-ink lg:text-2xl">{title}</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-3 lg:gap-5 lg:overflow-visible">
          {collections.map((collection, index) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.slug}`}
              className={`relative flex h-28 w-[240px] shrink-0 flex-col justify-end overflow-hidden rounded-card bg-gradient-to-br p-4 text-white no-underline lg:h-36 lg:w-auto ${FALLBACK_BACKGROUNDS[index % FALLBACK_BACKGROUNDS.length]}`}
            >
              {collection.cover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={collection.cover} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
              )}
              <span className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <span className="relative text-base font-extrabold leading-tight lg:text-lg">{collection.title}</span>
              <span className="relative text-xs text-white/85">{collection.itemCount} khóa học</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
