import Link from 'next/link'
import { Item, getCourseUrl } from '@/lib/api'

interface Props {
  item: Item
}

function formatPrice(price: number) {
  if (!price) return 'Liên hệ'
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1).replace('.0', '')} triệu`
  return price.toLocaleString('vi-VN') + ' đ'
}

const SUBTYPE_LABELS: Record<string, string> = {
  extra:      'Ngoại khóa',
  offline:    'Học trực tiếp',
  online:     'Học online',
  digital:    'Kỹ thuật số',
  video:      'Video',
  preschool:  'Mầm non',
}

export default function CourseCard({ item }: Props) {
  return (
    <article className="bg-white border border-line rounded-card overflow-hidden shadow-[0_8px_24px_rgba(15,23,42,0.06)] flex flex-col">
      {/* Image area */}
      <div className="aspect-square bg-gradient-to-br from-green-soft to-blue-soft grid place-items-center relative overflow-hidden">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image} alt={item.title} className="w-full h-full object-cover absolute inset-0" />
        ) : (
          <span className="text-5xl">📚</span>
        )}
        {item.isHot ? (
          <span className="absolute top-3 left-3 bg-yellow text-ink rounded-full px-2.5 py-1.5 font-black text-xs">HOT</span>
        ) : null}
      </div>

      {/* Body */}
      <div className="p-[18px] flex flex-col flex-1">
        <h3 className="m-0 mb-1.5 text-green-dark leading-[1.35] text-lg font-black">
          {item.title}
        </h3>

        {item.authorName && item.authorId && (
          <Link href={`/search?mode=class&authorId=${item.authorId}`}
            className="flex items-center gap-1.5 mb-2.5 no-underline">
            {item.authorImage
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={item.authorImage} alt={item.authorName} className="w-[18px] h-[18px] rounded-full object-cover shrink-0" />
              : <span className="w-[18px] h-[18px] rounded-full bg-blue-soft grid place-items-center text-[9px] shrink-0">👤</span>
            }
            <span className="text-xs text-muted font-bold overflow-hidden text-ellipsis whitespace-nowrap">
              {item.authorName}
            </span>
          </Link>
        )}

        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {item.subtype && (
            <span className="rounded-full px-2 py-1 bg-green-soft text-green-dark text-xs font-black">
              {SUBTYPE_LABELS[item.subtype] ?? item.subtype}
            </span>
          )}
        </div>

        {item.shortContent && (
          <p className="text-muted text-sm m-0 mb-3.5 flex-1 line-clamp-2">
            {item.shortContent}
          </p>
        )}

        <div className="mt-auto">
          <div className="text-red font-black text-lg mb-3.5">
            {formatPrice(item.price)}
          </div>
          <Link href={getCourseUrl(item)} className="btn btn--green text-center w-full">
            Xem chi tiết
          </Link>
        </div>
      </div>
    </article>
  )
}
