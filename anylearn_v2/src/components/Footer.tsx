import Link from 'next/link'
import { API_BASE } from '@/lib/apiBase'
import { ChevronDownIcon, ClockIcon, MailIcon, PhoneIcon } from '@/components/icons'

const HEADING_CLASS = 'mb-3.5 mt-0 text-base font-extrabold text-white'
const LINK_CLASS = 'mb-2.5 block text-sm text-white/70 no-underline hover:text-white'
const TEXT_CLASS = 'mb-2.5 mt-0 text-sm text-white/70'

const SOCIAL_LINKS = [
  { href: 'https://www.youtube.com/channel/UCam71id1lM8tZuMfjy2DDRw', src: '/cdn/img/youtube.png', title: 'YouTube' },
  { href: 'https://www.facebook.com/anylearnhockhonggioihan', src: '/cdn/img/facebook.png', title: 'Facebook' },
  { href: 'https://zalo.me/0374900344', src: '/cdn/img/zalo.png', title: 'Zalo' },
]

interface KnowledgeItem { id: number; title: string; url: string }

async function fetchTopKnowledge(): Promise<KnowledgeItem[]> {
  try {
    const res = await fetch(`${API_BASE}/helpcenter/top?limit=4`, { next: { revalidate: 3600 } })
    const json = await res.json()
    if (json?.resultCode === 1 && Array.isArray(json?.data)) return json.data
  } catch {}
  return []
}

function ParentLinks({ topKnowledge }: { topKnowledge: KnowledgeItem[] }) {
  return (
    <>
      <Link href="/helpcenter" className={LINK_CLASS}>Trung Tâm Hỗ trợ</Link>
      {topKnowledge.map(k => (
        <Link key={k.id} href={`/helpcenter/${k.id}/${k.url}`} className={LINK_CLASS}>{k.title}</Link>
      ))}
    </>
  )
}

function PolicyLinks() {
  return (
    <>
      <Link href="/privacy" className={LINK_CLASS}>Chính sách bảo mật thông tin</Link>
      <Link href="/guide?p=guide_toc" className={LINK_CLASS}>Điều khoản sử dụng</Link>
      <Link href="/guide?p=guide_payment_term" className={LINK_CLASS}>Chính sách thanh toán</Link>
      <Link href="/guide?p=guide_return_term" className={LINK_CLASS}>Chính sách đổi - trả và hoàn tiền</Link>
    </>
  )
}

function ContactLinks() {
  return (
    <>
      <a href="tel:0374900344" className={`${LINK_CLASS} flex items-center gap-2`}><PhoneIcon className="size-4 shrink-0" />0374 900 344</a>
      <a href="mailto:info@anylearn.vn" className={`${LINK_CLASS} flex items-center gap-2`}><MailIcon className="size-4 shrink-0" />info@anylearn.vn</a>
      <p className={`${TEXT_CLASS} flex items-center gap-2`}><ClockIcon className="size-4 shrink-0" />8:30 - 18:00, Thứ 2 - Thứ 7</p>
      <div className="mt-3.5 flex gap-2.5">
        {SOCIAL_LINKS.map(link => (
          <a key={link.title} href={link.href} title={link.title} target="_blank" rel="noopener noreferrer"
            className="size-10 overflow-hidden rounded-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={link.src} alt={link.title} className="size-full object-cover" />
          </a>
        ))}
      </div>
    </>
  )
}

function Brand({ mobile = false }: { mobile?: boolean }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/cdn/anylearn/img/logo-white.svg" alt="anyLEARN" className="mb-4 h-10" />
      {mobile
        ? <Link href="/info" className={`${TEXT_CLASS} inline-block font-bold underline`}>Giới thiệu anyLEARN</Link>
        : <p className={TEXT_CLASS}>Nền tảng giúp phụ huynh tìm kiếm, so sánh và đăng ký trường học, khóa học, chuyên gia phù hợp cho con.</p>}
    </>
  )
}

// Below lg the link lists fold away (closed by default) so the footer does not take half of every phone page.
function MobileSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group border-b border-white/15">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between text-[15px] font-extrabold text-white [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDownIcon className="size-5 text-white/70 transition-transform group-open:rotate-180" />
      </summary>
      <div className="pb-2">{children}</div>
    </details>
  )
}

export default async function Footer() {
  const topKnowledge = await fetchTopKnowledge()

  return (
    <footer className="bg-navy pt-8 text-white lg:pt-14">
      <div className="container">
        <div className="mb-6 lg:hidden">
          <Brand mobile />
          <div className="mt-2 border-t border-white/15">
            <MobileSection title="Dành cho phụ huynh"><ParentLinks topKnowledge={topKnowledge} /></MobileSection>
            <MobileSection title="Điều khoản & Chính sách"><PolicyLinks /></MobileSection>
          </div>
          <div className="mt-5">
            <h4 className={HEADING_CLASS}>Liên hệ anyLEARN</h4>
            <ContactLinks />
          </div>
        </div>

        <div className="mb-11 hidden grid-cols-[1.2fr_1fr_1fr_1.2fr] gap-7 lg:grid">
          <div><Brand /></div>
          <div>
            <h4 className={HEADING_CLASS}>Dành cho phụ huynh</h4>
            <ParentLinks topKnowledge={topKnowledge} />
          </div>
          <div>
            <h4 className={HEADING_CLASS}>Điều khoản &amp; Chính sách</h4>
            <PolicyLinks />
          </div>
          <div>
            <h4 className={HEADING_CLASS}>Liên hệ anyLEARN</h4>
            <ContactLinks />
          </div>
        </div>
      </div>
      <div className="border-t border-white/15 py-5 text-center text-[13px] text-white/75">
        <p className="m-0 px-4">© 2024 Công ty Cổ phần Đầu tư và Giáo dục anyLEARN. All rights reserved.</p>
      </div>
    </footer>
  )
}
