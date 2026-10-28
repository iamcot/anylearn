import Link from 'next/link'
import type { MyVideoCourse } from '@/lib/api/learn'
import { learnHref, resumeLabel } from '@/lib/learn/rules'
import { PlayIcon } from '@/components/icons'

/** One video course of one learner: progress bar, the lesson to resume and the study plan line. */
export default function VideoCourseCard({ course, showLearner }: { course: MyVideoCourse; showLearner: boolean }) {
  return (
    <div className="flex gap-3 rounded-card border border-line bg-white p-3">
      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-green-soft to-blue-soft">
        {course.image
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={course.image} alt="" className="absolute inset-0 size-full object-cover" />
          : <PlayIcon className="m-auto size-8 text-blue/40" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="line-clamp-2 text-sm font-extrabold leading-snug text-ink">{course.title}</div>
        {showLearner && <div className="text-xs text-muted">{course.self ? 'Bạn' : course.learnerName} học</div>}
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full bg-green" style={{ width: `${course.percent}%` }} /></div>
          <span className="text-xs font-bold text-green-dark">{course.percent}%</span>
        </div>
        {course.plan?.enabled && <div className="mt-1 text-xs text-muted">Lịch tự học: {course.plan.text}</div>}
        <Link href={learnHref(course.itemId, course.resumeLessonId, course.learnerId)}
          className="btn btn--green mt-2 inline-flex max-w-full px-3 py-1.5 text-xs">
          <span className="truncate">{resumeLabel(course)}</span>
        </Link>
      </div>
    </div>
  )
}
