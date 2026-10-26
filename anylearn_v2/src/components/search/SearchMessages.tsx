import { SearchIcon } from '@/components/icons'
import CourseRequestCta from './CourseRequestCta'
import type { CourseRequestDefaults } from './CourseRequestModal'

const ZALO_URL = 'https://zalo.me/0374900344'

function MessageBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[26px] border border-line bg-white p-8 text-center">
      <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-green/10 text-green"><SearchIcon className="size-7" /></div>
      {children}
    </div>
  )
}

export function NoResults({ requestDefaults }: { requestDefaults: CourseRequestDefaults }) {
  return (
    <MessageBox>
      <h2 className="mb-2.5 mt-0 text-xl font-medium text-ink">Chưa tìm thấy khóa học phù hợp</h2>
      <p className="mx-auto mb-5 mt-0 max-w-[520px] text-muted">
        Thử đổi keyword, mở rộng khu vực hoặc để anyLEARN tìm giúp: bạn cho biết cần gì, chúng tôi tìm đối tác và gọi lại
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <CourseRequestCta label="Nhờ anyLEARN tìm giúp" variant="primary" defaults={requestDefaults} />
        <a href={ZALO_URL} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-green-dark">Chat Zalo tư vấn</a>
      </div>
    </MessageBox>
  )
}

// One quiet line under the results of every search, for visitors who did not find what they meant.
export function RequestHelpLine({ requestDefaults }: { requestDefaults: CourseRequestDefaults }) {
  return (
    <p className="mb-0 mt-6 text-center text-sm text-muted">
      Chưa thấy khóa học bạn cần? <CourseRequestCta label="Để anyLEARN tìm giúp" defaults={requestDefaults} />
    </p>
  )
}
