import type { Metadata } from 'next'
import Link from 'next/link'
import ReportPriceButton from '@/components/promise/ReportPriceButton'
import { CheckIcon } from '@/components/icons'
import { PROMISES, RETURN_POLICY_HREF, WHY_FAQ, ZALO_SUPPORT_URL } from '@/config/promise'
import { shareMeta } from '@/lib/seo/shareMeta'

export const metadata: Metadata = shareMeta('why')

export default function WhyAnyLearnPage() {
  return (
    <section className="py-10 lg:py-14">
      <div className="container max-w-[780px]">
        <h1 className="m-0 mb-2 text-[clamp(24px,4vw,36px)] font-extrabold text-ink">Vì sao đặt qua anyLEARN?</h1>
        <p className="m-0 mb-8 leading-relaxed text-text">
          Bạn không phải chọn giữa giá và sự tiện lợi. Đây là những điều anyLEARN cam kết với mỗi phụ huynh.
        </p>

        <ul className="m-0 mb-8 flex list-none flex-col gap-3 p-0">
          {PROMISES.map(promise => (
            <li key={promise.key} className="flex items-start gap-3 rounded-card border border-line bg-white p-4">
              <CheckIcon className="mt-0.5 size-5 shrink-0 text-green" />
              <div>
                <h2 className="m-0 text-base font-medium text-ink">{promise.short}</h2>
                <p className="m-0 mt-1 text-sm leading-relaxed text-muted">{promise.detail}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mb-10 flex flex-wrap items-center gap-3">
          <ReportPriceButton variant="button" />
          <a href={ZALO_SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="btn btn--green min-h-11 text-sm no-underline">Nhắn Zalo anyLEARN</a>
        </div>

        <h2 className="m-0 mb-3 text-xl font-semibold text-ink">Câu hỏi thường gặp</h2>
        <div className="flex flex-col gap-2">
          {WHY_FAQ.map(item => (
            <details key={item.question} className="rounded-card border border-line bg-white px-4 py-3">
              <summary className="cursor-pointer text-sm font-medium text-ink">{item.question}</summary>
              <p className="m-0 mt-2 text-sm leading-relaxed text-muted">{item.answer}</p>
            </details>
          ))}
        </div>

        <p className="mt-6 text-sm text-muted">
          Xem thêm <Link href={RETURN_POLICY_HREF} className="font-medium text-green-dark">Chính sách đổi - trả và hoàn tiền</Link>{' '}
          và <Link href="/info/anypoint" className="font-medium text-green-dark">anyPoint là gì?</Link>
        </p>
      </div>
    </section>
  )
}
