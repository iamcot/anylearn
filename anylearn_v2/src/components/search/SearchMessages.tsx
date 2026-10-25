import { SearchIcon } from '@/components/icons'

const ZALO_URL = 'https://zalo.me/0374900344'

function MessageBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[26px] border border-line bg-white p-8 text-center">
      <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-green/10 text-green"><SearchIcon className="size-7" /></div>
      {children}
    </div>
  )
}

export function NoResults() {
  return (
    <MessageBox>
      <h2 className="mb-2.5 mt-0 text-xl font-medium text-ink">Chưa tìm thấy khóa học phù hợp</h2>
      <p className="mx-auto mb-5 mt-0 max-w-[520px] text-muted">
        Thử đổi keyword, mở rộng khu vực hoặc để anyLEARN tư vấn miễn phí chương trình phù hợp cho con
      </p>
      <a href={ZALO_URL} target="_blank" rel="noopener noreferrer" className="btn btn--green no-underline">Nhận tư vấn miễn phí</a>
    </MessageBox>
  )
}
