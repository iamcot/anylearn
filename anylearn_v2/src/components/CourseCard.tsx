import Link from 'next/link'
import { Item, getCourseUrl } from '@/lib/api'
import { formatPrice } from '@/lib/format/price'
import { SUBTYPE_LABELS } from '@/config/itemLabels'
import { BookIcon, HeartIcon, StarIcon, UserIcon } from './icons'
import CardPointsChip from '@/components/points/CardPointsChip'
import ChevronLabel from '@/components/ChevronLabel'
import CompareToggle from '@/components/compare/CompareToggle'

interface Props {
  item: Item
}

export default function CourseCard({ item }: Props) {
  const courseUrl = getCourseUrl(item)
  return (
    <article className="bg-white border border-line rounded-card overflow-hidden shadow-card flex flex-col relative">
      {/* Full-card clickable overlay */}
      <Link href={courseUrl} className="absolute inset-0 z-10" aria-label={item.title} />

      {/* Image area */}
      <div className="aspect-[16/10] bg-gradient-to-br from-green-soft to-blue-soft grid place-items-center relative overflow-hidden sm:aspect-square">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image} alt={item.title} className="w-full h-full object-cover absolute inset-0" />
        ) : (
          <BookIcon className="size-14 text-blue/40" />
        )}
        {item.isHot ? (
          <span className="absolute top-3 left-3 bg-yellow text-ink rounded-full px-2.5 py-1.5 font-extrabold text-xs z-10">HOT</span>
        ) : null}
      </div>

      {/* Body */}
      <div className="p-[18px] flex flex-col flex-1">
        <h3 className="m-0 mb-1.5 text-green-dark leading-[1.35] text-base font-extrabold line-clamp-3">
          {item.title}
        </h3>

        {item.authorName && item.authorId && (
          <Link href={`/partner/${item.authorId}`}
            className="relative z-10 flex items-center gap-1.5 mb-2.5 no-underline">
            {item.authorImage
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={item.authorImage} alt={item.authorName} className="w-[18px] h-[18px] rounded-full object-cover shrink-0" />
              : <span className="w-[18px] h-[18px] rounded-full bg-blue-soft grid place-items-center text-blue shrink-0"><UserIcon className="size-3" /></span>
            }
            <span className="text-xs text-muted font-bold overflow-hidden text-ellipsis whitespace-nowrap">
              {item.authorName}
            </span>
          </Link>
        )}

        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {item.subtype && (
            <span className="rounded-full px-2 py-1 bg-green-soft text-green-dark text-xs font-extrabold">
              {SUBTYPE_LABELS[item.subtype] ?? item.subtype}
            </span>
          )}
        </div>

        <div className="flex-1" />

        <div className="mt-auto">
          <div className="text-red font-extrabold text-lg mb-1.5">
            {formatPrice(item.price)}
          </div>
          <CardPointsChip points={item.points} className="mb-1.5" />
          <div className="mb-2"><CompareToggle itemId={item.id} title={item.title} image={item.image} /></div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-muted">
              {item.rating != null && item.rating > 0 && (
                <span className="inline-flex items-center gap-1"><StarIcon filled className="size-3.5 text-star" />{item.rating.toFixed(1)}</span>
              )}
              {item.num_favorite != null && item.num_favorite > 0 && (
                <span className="inline-flex items-center gap-1"><HeartIcon filled className="size-3.5 text-red" />{item.num_favorite}</span>
              )}
            </div>
            <ChevronLabel className="shrink-0 text-sm font-extrabold text-green-dark">Tìm hiểu thêm</ChevronLabel>
          </div>
        </div>
      </div>
    </article>
  )
}
