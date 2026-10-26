import Link from 'next/link'
import type { UserResult } from '@/lib/api'
import { SchoolIcon, UserIcon } from '@/components/icons'

// Schools and experts people look at most: a round photo and a name, opens the courses of that partner.
export default function FeaturedPartners({ partners }: { partners: UserResult[] }) {
  if (partners.length === 0) return null
  return (
    <section className="pt-6 lg:pt-8">
      <div className="container">
        <h2 className="mb-3 mt-0 text-lg font-extrabold text-ink lg:text-2xl">Chuyên gia và đối tác nổi bật</h2>
        <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {partners.map(partner => (
            <Link key={partner.id} href={`/search?mode=class&authorId=${partner.id}`} className="flex w-24 shrink-0 flex-col items-center gap-1.5 text-center no-underline lg:w-32">
              <span className="relative grid size-16 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-green-soft to-blue-soft text-blue/50 lg:size-24">
                {partner.image
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={partner.image} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
                  : partner.role === 'school' ? <SchoolIcon className="size-8" /> : <UserIcon className="size-8" />}
              </span>
              <span className="line-clamp-2 text-xs font-medium leading-snug text-ink lg:text-sm">{partner.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
