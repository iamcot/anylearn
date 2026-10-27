import type { Metadata } from 'next'
import Link from 'next/link'
import { getPointExpiryPolicy } from '@/lib/api/pointsExpiry'
import { formatIsoDay, hasNotStarted } from '@/lib/points/expiry'

export const metadata: Metadata = {
  title: 'Hạn dùng anyPoint',
  description: 'anyPoint của thành viên có hạn dùng. Xem cách tính hạn, khi nào được nhắc và cách dùng hết điểm kịp thời.',
}

// The numbers come from the back office settings, so the page is rendered on every request.
export const dynamic = 'force-dynamic'

const FALLBACK = { enabled: true, months: 12, startDate: '2027-01-01', firstExpiryDay: '2028-01-01', firstLastUsableDay: '2027-12-31' }

export default async function AnyPointExpiryPage() {
  const policy = (await getPointExpiryPolicy()) ?? FALLBACK
  const notStarted = hasNotStarted(policy)

  return (
    <section className="py-10 lg:py-14">
      <div className="container max-w-[780px]">
        <h1 className="m-0 mb-2 text-[clamp(24px,4vw,36px)] font-extrabold text-ink">Hạn dùng anyPoint</h1>
        {!policy.enabled ? (
          <p className="m-0 mb-8 leading-relaxed text-text">
            Hiện tại anyPoint của bạn <strong>chưa có hạn dùng</strong>. Nếu anyLEARN áp dụng hạn dùng, bạn sẽ được báo trước.
          </p>
        ) : (
          <>
            <p className="m-0 mb-4 leading-relaxed text-text">
              anyPoint nhận được khi là thành viên mua khóa học có hạn dùng <strong>{policy.months} tháng</strong>. Điểm nào nhận trước thì hết hạn trước,
              và khi thanh toán hệ thống luôn dùng phần điểm sắp hết hạn trước nên bạn không cần tự chọn.
            </p>
            <div className="mb-8 rounded-card border border-line bg-green-soft p-4 text-sm leading-relaxed text-ink">
              {notStarted ? (
                <>Hạn dùng bắt đầu tính từ <strong>{formatIsoDay(policy.startDate)}</strong>. Trước ngày đó không có anyPoint nào bị mất.
                  Sớm nhất là hết ngày <strong>{formatIsoDay(policy.firstLastUsableDay)}</strong> anyPoint mới bắt đầu hết hạn.</>
              ) : (
                <>Hạn dùng được tính từ <strong>{formatIsoDay(policy.startDate)}</strong>.</>
              )}
            </div>

            <h2 className="m-0 mb-3 text-xl font-extrabold text-ink">Cách tính</h2>
            <ul className="m-0 mb-8 list-disc space-y-2 pl-5 leading-relaxed text-text">
              <li>Mỗi lần nhận anyPoint (từ đơn hàng, đánh giá, giới thiệu bạn bè…) là một phần riêng, mỗi phần có hạn {policy.months} tháng kể từ ngày nhận.</li>
              <li>
                anyPoint bạn đang có trước ngày {formatIsoDay(policy.startDate)} cũng được tính hạn từ ngày {formatIsoDay(policy.startDate)}, tức là dùng được đến hết ngày {formatIsoDay(policy.firstLastUsableDay)}.
              </li>
              <li>Ví dụ: nhận ngày 15/03/2027 thì dùng được đến hết ngày 14/03/2028; đến ngày 15/03/2028 phần điểm còn lại sẽ hết hạn.</li>
              <li>Điểm đã dùng cho đơn hàng rồi sau đó đơn bị hủy được hoàn lại thành một phần mới, có hạn {policy.months} tháng kể từ ngày hoàn.</li>
              <li>Chỉ anyPoint của thành viên mua khóa học có hạn dùng. anyPoint của đối tác không hết hạn.</li>
            </ul>

            <h2 className="m-0 mb-3 text-xl font-extrabold text-ink">Bạn được báo trước</h2>
            <p className="m-0 mb-8 leading-relaxed text-text">
              anyLEARN gửi thông báo (trong app, kèm push nếu bạn bật) trước <strong>30 ngày</strong> và <strong>7 ngày</strong> khi có anyPoint sắp hết hạn,
              ghi rõ số điểm và ngày cuối cùng dùng được. Bạn có thể tắt nhắc này ở Tài khoản &gt; Thông báo.
              Số anyPoint sắp hết hạn cũng hiện ngay dưới số dư ở trang anyPoint của bạn.
            </p>

            <h2 className="m-0 mb-3 text-xl font-extrabold text-ink">Dùng anyPoint thế nào?</h2>
            <p className="m-0 mb-8 leading-relaxed text-text">
              Bật &ldquo;Dùng anyPoint&rdquo; ở bước thanh toán, 1 anyPoint ~ 1.000đ giảm cho đơn. Điểm hết hạn sau khi đã bị xóa không khôi phục được,
              nên hãy dùng cho khóa học tiếp theo của bé trước hạn.
            </p>
          </>
        )}
        <div className="flex flex-wrap gap-3">
          <Link href="/search" className="btn btn--green no-underline">Tìm khóa học</Link>
          <Link href="/account/anypoint" className="btn btn--outline no-underline">Xem anyPoint của tôi</Link>
          <Link href="/info/anypoint" className="btn btn--outline no-underline">anyPoint là gì?</Link>
        </div>
      </div>
    </section>
  )
}
