import type { Metadata } from 'next'
import Link from 'next/link'
import HowToEarn from '@/components/points/HowToEarn'

export const metadata: Metadata = {
  title: 'anyPoint là gì?',
  description: 'anyPoint là phần thưởng của anyLEARN: nhận lại khi mua khóa học, dùng để giảm tiền cho khóa tiếp theo.',
}

export default function AnyPointInfoPage() {
  return (
    <section className="py-10 lg:py-14">
      <div className="container max-w-[780px]">
        <h1 className="m-0 mb-2 text-[clamp(24px,4vw,36px)] font-extrabold text-ink">anyPoint là gì?</h1>
        <p className="m-0 mb-8 leading-relaxed text-text">
          anyPoint là phần thưởng của anyLEARN. Mỗi lần mua khóa học bạn nhận lại một phần giá trị dưới dạng anyPoint,
          và dùng anyPoint đó để giảm tiền cho khóa học tiếp theo của bé hoặc của chính bạn.
        </p>
        <HowToEarn />
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/search" className="btn btn--green no-underline">Tìm khóa học</Link>
          <Link href="/account/anypoint" className="btn btn--outline no-underline">Xem anyPoint của tôi</Link>
        </div>
      </div>
    </section>
  )
}
