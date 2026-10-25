import { TERMS_SECTIONS, TERMS_UPDATED_AT } from '@/config/terms'

export default function TermsPage() {
  return (
    <section className="py-10 lg:py-14">
      <div className="container max-w-[780px]">
        <h1 className="m-0 mb-2 text-[clamp(24px,4vw,36px)] font-extrabold text-ink">Điều khoản sử dụng</h1>
        <p className="m-0 mb-8 text-sm text-muted">Cập nhật lần cuối: {TERMS_UPDATED_AT}</p>

        {TERMS_SECTIONS.map(section => (
          <div key={section.title} className="mb-7">
            <h2 className="m-0 mb-2 text-xl font-semibold text-ink">{section.title}</h2>
            <p className="m-0 leading-relaxed text-text">{section.content}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
