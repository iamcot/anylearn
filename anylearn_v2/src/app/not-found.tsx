import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="section">
      <div className="container max-w-[520px] text-center">
        <h1 className="mb-3 text-2xl font-black text-ink">Không tìm thấy trang</h1>
        <p className="mb-6 text-muted">Đường dẫn này không tồn tại hoặc nội dung đã được chuyển đi.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn--green no-underline">Về trang chủ</Link>
          <Link href="/search" className="btn btn--outline no-underline">Tìm khoá học</Link>
        </div>
      </div>
    </section>
  )
}
