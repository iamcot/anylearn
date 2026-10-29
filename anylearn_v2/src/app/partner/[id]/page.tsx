import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPartnerReviews, getPartnerSummary, getUserProfile, searchItems } from '@/lib/api'
import { PARTNER_TYPE_LABELS } from '@/config/itemLabels'
import BackLink from '@/components/BackLink'
import PartnerCourses from '@/components/partner/PartnerCourses'
import FollowButton from '@/components/partner/FollowButton'
import ReviewItem from '@/components/reviews/ReviewItem'
import ReviewSummaryCard from '@/components/reviews/ReviewSummaryCard'
import { PinIcon, SchoolIcon, UserIcon } from '@/components/icons'
import { detailMeta } from '@/lib/seo/shareMeta'

interface Props {
  params: Promise<{ id: string }>
}

const COURSES_SHOWN = 12

function mapLink(place: { lat?: number | null; lng?: number | null; address?: string | null }): string | null {
  if (place.lat != null && place.lng != null) return `https://www.google.com/maps?q=${place.lat},${place.lng}`
  return place.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}` : null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await getUserProfile(Number((await params).id))
  if (!profile) return { title: 'Đối tác | anyLEARN' }
  return detailMeta({
    title: `${profile.name} | anyLEARN`,
    description: profile.introduce ?? `Các khóa học của ${profile.name} trên anyLEARN.`,
    image: profile.banner || profile.image,
  })
}

export default async function PartnerPage({ params }: Props) {
  const id = Number((await params).id)
  if (!Number.isInteger(id) || id <= 0) notFound()
  const [profile, summary, courses, reviews] = await Promise.all([
    getUserProfile(id),
    getPartnerSummary(id),
    searchItems('', 0, COURSES_SHOWN, { authorId: id, sort: 'popular' }),
    getPartnerReviews(id),
  ])
  if (!profile || !summary) notFound()

  const kind = PARTNER_TYPE_LABELS[summary.partnerType ?? ''] ?? (profile.role === 'teacher' ? 'Chuyên gia' : 'Đối tác')

  return (
    <div className="container py-6 lg:py-10">
      <BackLink href="/search">Tìm khóa học</BackLink>

      <header className="mb-8 mt-3 overflow-hidden rounded-card border border-line bg-white shadow-card">
        <div className="h-28 bg-gradient-to-br from-blue to-green bg-cover bg-center lg:h-44" style={profile.banner ? { backgroundImage: `url(${profile.banner})` } : undefined} />
        <div className="flex flex-col gap-4 px-5 pb-5 lg:flex-row lg:items-end lg:gap-6 lg:px-8 lg:pb-6">
          <span className="relative -mt-12 grid size-24 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-green-soft to-blue-soft text-blue/50 lg:-mt-16 lg:size-32">
            {profile.image
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={profile.image} alt="" className="absolute inset-0 size-full object-cover" />
              : profile.role === 'school' ? <SchoolIcon className="size-12" /> : <UserIcon className="size-12" />}
          </span>
          <div className="min-w-0 flex-1">
            <span className="inline-flex rounded-full bg-green-soft px-3 py-1 text-xs font-medium text-green-dark">{kind}</span>
            <h1 className="m-0 mt-1 text-2xl font-extrabold text-ink lg:text-3xl">{profile.name}</h1>
            {profile.title && <p className="m-0 mt-1 text-muted">{profile.title}</p>}
            <p className="m-0 mt-2 text-sm text-muted">{summary.courseCount} khóa đang mở</p>
          </div>
          <FollowButton partnerId={id} initialFollowers={summary.followerCount} />
        </div>
      </header>

      {(profile.introduce || profile.full_content) && (
        <section className="mb-8">
          <h2 className="mb-3 mt-0 text-lg font-extrabold text-ink lg:text-2xl">Giới thiệu</h2>
          {profile.introduce && <p className="m-0 mb-3 max-w-3xl leading-relaxed text-text">{profile.introduce}</p>}
          {profile.full_content && <div className="cms-content max-w-3xl" dangerouslySetInnerHTML={{ __html: profile.full_content }} />}
        </section>
      )}

      <section className="mb-8">
        <h2 className="mb-3 mt-0 text-lg font-extrabold text-ink lg:text-2xl">Khóa đang mở</h2>
        <PartnerCourses partnerId={id} initialItems={courses.items} total={courses.total} />
      </section>

      {reviews && reviews.count > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 mt-0 text-lg font-extrabold text-ink lg:text-2xl">Đánh giá từ phụ huynh</h2>
          <ReviewSummaryCard summary={reviews} />
          <div className="divide-y divide-line">
            {reviews.latest.map(review => (
              <ReviewItem key={review.id} review={review} itemId={review.item_id ?? 0} partnerName={profile.name} showCourse />
            ))}
          </div>
        </section>
      )}

      {summary.locations.length > 0 && (
        <section>
          <h2 className="mb-3 mt-0 text-lg font-extrabold text-ink lg:text-2xl">Cơ sở</h2>
          <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
            {summary.locations.map(place => {
              const link = mapLink(place)
              return (
                <li key={place.id} className="flex items-start gap-3 rounded-2xl border border-line bg-white p-4">
                  <PinIcon className="mt-0.5 size-5 shrink-0 text-green" />
                  <div className="min-w-0">
                    <div className="font-medium text-ink">{place.title || 'Cơ sở'}{place.isHead ? ' · Hội sở' : ''}</div>
                    <div className="text-sm text-muted">{[place.address, place.districtName, place.provinceName].filter(Boolean).join(', ')}</div>
                    {link && <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-green-dark">Xem bản đồ</a>}
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
