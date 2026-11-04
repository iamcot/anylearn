import Link from 'next/link'
import type { CollectionCard } from '@/lib/api'

const FALLBACK_BACKGROUNDS = [
  'from-green-dark to-green',
  'from-blue to-green',
  'from-blue-dark to-blue',
]

// Editorial lists as wide cards: a photo (or a colour) with the title on it. Opens /collections/{slug}.
// `embedded`: inside a page column (course page), no section padding or container, two cards a row on a desktop.
export default function CollectionsRow({ collections, title = 'Bộ sưu tập', embedded = false }: { collections: CollectionCard[]; title?: string; embedded?: boolean }) {
  if (collections.length === 0) return null
  const body = (
    <>
        <h2 className={embedded ? 'section-kicker mb-5' : 'mb-3 mt-0 text-lg font-extrabold text-ink lg:text-2xl'}>{title}</h2>
        <div className={`flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:gap-5 lg:overflow-visible ${embedded ? 'lg:grid-cols-2' : 'lg:grid-cols-3'}`}>
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
    </>
  )
  if (embedded) return <div>{body}</div>
  return (
    <section className="pt-6 lg:pt-8">
      <div className="container">{body}</div>
    </section>
  )
}
