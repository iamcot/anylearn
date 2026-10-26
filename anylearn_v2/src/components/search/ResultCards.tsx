import Link from 'next/link'
import { getCourseUrl, type Item, type UserResult } from '@/lib/api'
import { formatPrice } from '@/lib/format/price'
import { SUBTYPE_LABELS } from '@/config/itemLabels'
import ChevronLabel from '@/components/ChevronLabel'
import { trackSearchClick } from '@/components/search/searchTracking'
import { BookIcon, HeartIcon, SchoolIcon, StarIcon, UserIcon } from '@/components/icons'

const CARD_CLASS = 'relative grid grid-cols-[112px_1fr] overflow-hidden rounded-2xl border border-line bg-white shadow-card md:grid-cols-[160px_1fr]'
const IMAGE_CLASS = 'relative grid min-h-[132px] place-items-center overflow-hidden bg-gradient-to-br from-green-soft to-blue-soft text-blue/40'
const CHIP_CLASS = 'rounded-full px-2 py-0.5 text-[11px] font-extrabold md:text-xs'

const SLOT_LABELS: Record<string, string> = {
  weekday_morning: 'Sáng T2-T6', weekday_afternoon: 'Chiều T2-T6', weekday_evening: 'Tối T2-T6',
  weekend_morning: 'Sáng T7-CN', weekend_afternoon: 'Chiều T7-CN', weekend_evening: 'Tối T7-CN',
}

// Short facts a parent compares at a glance: how far, when, free trial, on sale.
function CourseFacts({ item }: { item: Item }) {
  const slots = (item.timeSlots ?? []).map(slot => SLOT_LABELS[slot]).filter(Boolean).slice(0, 2)
  const facts = [
    item.distanceKm !== undefined ? `${item.distanceKm} km` : null,
    ...slots,
  ].filter((fact): fact is string => fact !== null)
  if (facts.length === 0 && !item.hasFreeTrial && !item.onSale) return null
  return (
    <div className="flex flex-wrap items-center gap-1 text-xs text-muted">
      {item.hasFreeTrial && <span className={`${CHIP_CLASS} bg-green-soft text-green-dark`}>Học thử</span>}
      {item.onSale && <span className={`${CHIP_CLASS} bg-red-soft text-red`}>Giảm giá</span>}
      {facts.map(fact => <span key={fact} className="rounded-full border border-line px-2 py-0.5">{fact}</span>)}
    </div>
  )
}

export function CourseResultCard({ item }: { item: Item }) {
  const categories = item.categoryTitles ? item.categoryTitles.split('|') : []

  return (
    <article className={CARD_CLASS}>
      <Link href={getCourseUrl(item)} onClick={() => trackSearchClick(item.id)} className="absolute inset-0 z-10" aria-label={item.title} />
      <div className={IMAGE_CLASS}>
        {item.image
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={item.image} alt={item.title} loading="lazy" className="absolute inset-0 size-full object-cover" />
          : <BookIcon className="size-10" />
        }
      </div>
      <div className="flex flex-col gap-1.5 p-3 md:p-4">
        <h3 className="m-0 line-clamp-2 text-sm font-extrabold leading-snug text-green-dark md:text-base">{item.title}</h3>
        {item.authorName && (
          <div className="flex items-center gap-1.5">
            {item.authorImage
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={item.authorImage} alt="" loading="lazy" className="size-4 shrink-0 rounded-full object-cover" />
              : <span className="grid size-4 shrink-0 place-items-center rounded-full bg-blue-soft text-blue"><UserIcon className="size-2.5" /></span>
            }
            <Link
              href={`/search?mode=class&authorId=${item.authorId}`}
              className="relative z-20 truncate text-xs font-bold text-muted no-underline"
            >
              {item.authorName}
            </Link>
          </div>
        )}
        <div className="flex flex-wrap gap-1">
          {item.subtype && (
            <span className={`${CHIP_CLASS} bg-green-soft text-green-dark`}>{SUBTYPE_LABELS[item.subtype] ?? item.subtype}</span>
          )}
          {categories.map(category => (
            <span key={category} className={`${CHIP_CLASS} bg-blue-soft text-blue`}>{category}</span>
          ))}
        </div>
        <CourseFacts item={item} />
        {item.shortContent && <p className="m-0 line-clamp-2 flex-1 text-xs text-muted md:text-sm">{item.shortContent}</p>}
        <div className="mt-auto pt-1">
          <div className="mb-1 text-base font-extrabold text-red">{formatPrice(item.price)}</div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-subtle">
              {item.rating != null && item.rating > 0 && (
                <span className="inline-flex items-center gap-1"><StarIcon filled className="size-3.5 text-star" />{item.rating.toFixed(1)}</span>
              )}
              {item.num_favorite != null && item.num_favorite > 0 && (
                <span className="inline-flex items-center gap-1"><HeartIcon filled className="size-3.5 text-red" />{item.num_favorite}</span>
              )}
            </div>
            <ChevronLabel className="shrink-0 text-xs font-extrabold text-green-dark md:text-sm">Tìm hiểu thêm</ChevronLabel>
          </div>
        </div>
      </div>
    </article>
  )
}

export function UserResultCard({ user, mode }: { user: UserResult; mode: 'school' | 'teacher' }) {
  return (
    <article className={CARD_CLASS}>
      <Link href={`/search?mode=class&authorId=${user.id}`} className="absolute inset-0 z-10" aria-label={user.name} />
      <div className={IMAGE_CLASS}>
        {user.image
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={user.image} alt={user.name} loading="lazy" className="absolute inset-0 size-full object-cover" />
          : mode === 'school' ? <SchoolIcon className="size-10" /> : <UserIcon className="size-10" />
        }
      </div>
      <div className="flex flex-col gap-1.5 p-3 md:p-4">
        <h3 className="m-0 text-sm font-extrabold leading-snug text-ink md:text-base">{user.name}</h3>
        {user.title && <div className="text-xs font-bold text-blue">{user.title}</div>}
        {user.rating != null && user.rating > 0 && (
          <div className="inline-flex items-center gap-1 text-xs text-muted"><StarIcon filled className="size-3.5 text-star" />{user.rating.toFixed(1)}</div>
        )}
        {user.introduce && <p className="m-0 line-clamp-2 flex-1 text-xs text-muted md:text-sm">{user.introduce}</p>}
        <div className="mt-auto flex justify-end pt-1">
          <ChevronLabel className="text-xs font-extrabold text-green-dark md:text-sm">Xem khóa học</ChevronLabel>
        </div>
      </div>
    </article>
  )
}
