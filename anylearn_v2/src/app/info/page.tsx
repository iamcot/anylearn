import SearchCard from '@/components/SearchCard'
import Link from 'next/link'
import {
  BookIcon, CalendarIcon, ChevronRightIcon, ClockIcon, LightbulbIcon, ListIcon, PhoneIcon, SchoolIcon, UsersIcon,
} from '@/components/icons'

const PROBLEMS = [
  { Icon: ClockIcon, title: 'Mất thời gian tìm kiếm', desc: 'Thông tin trường học, khóa học và chuyên gia thường nằm rải rác trên nhiều kênh khác nhau' },
  { Icon: ListIcon, title: 'Khó so sánh lựa chọn', desc: 'Không có công cụ so sánh rõ ràng về chương trình, học phí, đánh giá và phù hợp với con' },
  { Icon: LightbulbIcon, title: 'Thiếu tư vấn chuyên sâu', desc: 'Phụ huynh thường không biết bắt đầu từ đâu khi tìm chương trình phù hợp với độ tuổi và mục tiêu' },
]

const COMMITS = [
  { num: 1, title: 'Trường học uy tín', desc: 'Kiểm tra thông tin pháp lý, chương trình, đội ngũ và phản hồi từ phụ huynh/học viên trước khi hiển thị' },
  { num: 2, title: 'Chuyên gia chất lượng', desc: 'Xác minh chứng chỉ, kinh nghiệm và năng lực giảng dạy của từng chuyên gia, gia sư và huấn luyện viên' },
  { num: 3, title: 'Hỗ trợ tư vấn', desc: 'Đội ngũ tư vấn viên sẵn sàng hỗ trợ phụ huynh trong toàn bộ hành trình chọn khóa học cho con' },
]

const ECOSYSTEM = [
  { Icon: SchoolIcon, name: 'anySCHOOL', desc: 'Tìm trường học, hệ quốc tế và chương trình chính quy phù hợp' },
  { Icon: BookIcon, name: 'anyCOURSE', desc: 'Khóa học ngoại khóa, kỹ năng, thể thao và nghệ thuật online & offline' },
  { Icon: UsersIcon, name: 'anyPROFESSOR', desc: 'Kết nối với gia sư, huấn luyện viên và chuyên gia 1-1' },
  { Icon: PhoneIcon, name: 'anyAPP', desc: 'Ứng dụng di động quản lý lịch học, bài tập và tiến độ của con' },
  { Icon: CalendarIcon, name: 'anyEVENT', desc: 'Sự kiện, hội thảo và chương trình trải nghiệm giáo dục cho trẻ' },
]

const STATS = [
  { img: '/cdn/anylearn/img/landing_number1.png', num: '500+', label: 'Đối tác' },
  { img: '/cdn/anylearn/img/landing_number2.png', num: '2500+', label: 'Khoá học' },
  { img: '/cdn/anylearn/img/landing_number3.png', num: '200+', label: 'Chuyên gia' },
  { img: '/cdn/anylearn/img/landing_number4.png', num: '15000+', label: 'Học viên' },
]

const TESTIMONIALS = [
  {
    img: '/cdn/onepage/images/feedbacks/kimchi.jpg',
    quote: 'Tôi thấy ứng dụng anyLEARN rất hữu ích. Nhờ ứng dụng, khi đăng ký khóa học cho con, tôi có thể dễ dàng so sánh và chọn được chương trình phù hợp nhất.',
    name: 'Chị Kim Chi', title: 'Phụ huynh',
  },
  {
    img: '/cdn/onepage/images/feedbacks/kimpham.jpg',
    quote: 'Sau khi con hoàn thành khóa học Tư duy MMS đăng ký trên anyLEARN, con có nhiều thay đổi tích cực rõ rệt. Rất hài lòng với dịch vụ tư vấn và hỗ trợ của anyLEARN.',
    name: 'Chị Kim Phạm', title: 'Phụ huynh',
  },
  {
    img: '/cdn/onepage/images/feedbacks/xuanhoa.jpg',
    quote: 'Các trường và trung tâm đào tạo trên anyLEARN được sàng lọc kỹ lưỡng nên tôi rất yên tâm khi đăng ký cho con. Giao diện dễ dùng, tìm kiếm nhanh.',
    name: 'Anh Xuân Hòa', title: 'Phụ huynh',
  },
]

const TEAM = [
  { img: '/cdn/anylearn/img/Trinh.png',   name: 'Đặng Thị Hoài Trinh',   title: 'Founder & CEO' },
  { img: '/cdn/anylearn/img/Thang.png',   name: 'Trương Công Thắng',     title: 'Co-Founder & CTO' },
  { img: '/cdn/anylearn/img/msNhu.png',   name: 'Tôn Thị Quỳnh Như',    title: 'Co-Founder' },
  { img: '/cdn/anylearn/img/mrHuyen.jpg', name: 'Lê Thế Huyên',         title: 'Legal Team Leader' },
  { img: '/cdn/anylearn/img/msDung.jpg',  name: 'Nguyễn Thị Viên Dung', title: 'Head of Partner Relationship' },
  { img: '/cdn/anylearn/img/msNgoc.jpg',  name: 'Nguyễn Thị Vui',       title: 'HR Development Manager' },
]

const PRESS = [
  { img: '/cdn/anylearn/img/GDTD.png', name: 'Giáo dục & Thời đại' },
  { img: '/cdn/anylearn/img/VTV1.png',  name: 'VTV1' },
  { img: '/cdn/anylearn/img/htv9.png',  name: 'HTV9' },
]

const PARTNER_LOGOS = [
  'W-01.jpg','W-02.jpg','W-03.jpg','W-04.jpg','W-05.jpg',
  'W-06.jpg','W-07.jpg','W-08.jpg','W-09.jpg','W-10.jpg',
  'W-11.jpg','W-12.jpg','W-13.jpg','W-14.jpg','W-15.jpg',
  'W-16.jpg','W-17.jpg','W-18.jpg','W-19.jpg','W-20.jpg',
  'W-21.jpg','W-22.jpg','W-23.png','W-24.jpg','W-25.png',
  'W-26.png','W-27.jpg','W-28.jpg','W-29.png','W-30.jpg',
  'W-31.png','W-32.png','W-33.png','W-34.png','W-35.jpg',
  'W-38.jpg','W-39.png','W-40.jpg','W-41.png','W-42.png',
  'W-43.png','W-44.png','W-45.png','W-46.jpg','W-47.png',
  'W-48.png','W-49.jpg','W-50.png','W-51.jpg','W-52.jpg',
  'W-53.png','W-54.png','W-55.jpg','W-56.jpg','W-57.png',
  'W-58.jpg','W-59.png','W-60.png','W-61.png','W-62.png',
  'W-63.png','W-64.png','W-65.png','W-66.jpg',
].map(f => `/cdn/onepage/images/schools/${f}`)

const CARD = 'rounded-card border border-line bg-white p-6 shadow-card'

export default function InfoPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="hero-section flex items-center bg-gradient-to-br from-blue to-green text-white">
        <div className="container">
          <span className="mb-5 inline-flex rounded-full border border-white/25 bg-white/15 px-3.5 py-2 text-sm font-semibold">
            Giới thiệu anyLEARN
          </span>
          <h1 className="mb-5 max-w-3xl text-[clamp(32px,5vw,62px)] font-extrabold leading-tight tracking-[-1.4px]">
            Tìm trường học, khóa học và chuyên gia phù hợp cho con
          </h1>
          <p className="mb-8 max-w-2xl text-lg text-white/90">
            anyLEARN giúp phụ huynh tìm kiếm, so sánh và đăng ký chương trình học chính quy, ngoại khóa, online và offline trong một hành trình rõ ràng hơn
          </p>
          <SearchCard variant="about" />
        </div>
      </section>

      {/* ── Intro ── */}
      <section className="section">
        <div className="container grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-center">
          <div className="text-[clamp(64px,12vw,130px)] font-extrabold leading-[0.88] tracking-[-4px] select-none">
            <div className="text-blue">any</div>
            <div className="text-green">LEARN</div>
          </div>
          <div>
            <span className="section-kicker">anyLEARN là gì?</span>
            <h2 className="section-title">Nền tảng booking giáo dục cho phụ huynh hiện đại</h2>
            <p className="mb-6 mt-4 text-[17px] text-muted">
              anyLEARN giúp cha mẹ tìm và đăng ký các chương trình học tập chính quy và ngoại khóa, offline hoặc online tại các trường quốc tế, học viện và trung tâm đào tạo chất lượng cao.
            </p>
            <div className="quick-tags">
              {['Tìm kiếm', 'So sánh', 'Tư vấn', 'Đăng ký', 'Thanh toán'].map(t => (
                <span key={t} className="tag">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="section section--soft">
        <div className="container grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {STATS.map(s => (
            <div key={s.label} className={CARD}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.img} alt={s.label} className="w-14 h-14 object-contain mx-auto mb-3" />
              <div className="mb-1.5 text-[38px] font-extrabold text-blue">{s.num}</div>
              <div className="font-semibold text-muted">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Problems ── */}
      <section className="section">
        <div className="container section-head">
          <div>
            <span className="section-kicker">Vấn đề thị trường</span>
            <h2 className="section-title">Phụ huynh cần một hành trình chọn khóa học rõ ràng hơn</h2>
          </div>
        </div>
        <div className="container grid grid-cols-1 sm:grid-cols-3 gap-5">
          {PROBLEMS.map(p => (
            <article key={p.title} className={CARD}>
              <div className="mb-3 flex items-center gap-3">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-green/10 text-green"><p.Icon className="size-6" /></div>
                <h3 className="m-0 min-w-0 text-xl font-semibold text-ink">{p.title}</h3>
              </div>
              <p className="m-0 text-muted">{p.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Commits ── */}
      <section className="section section--soft">
        <div className="container section-head">
          <div>
            <span className="section-kicker">Cam kết</span>
            <h2 className="section-title">Cam kết chất lượng từ anyLEARN</h2>
          </div>
        </div>
        <div className="container grid grid-cols-1 sm:grid-cols-3 gap-5">
          {COMMITS.map(c => (
            <article key={c.num} className={CARD}>
              <div className="mb-3 flex items-center gap-3">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-green text-xl font-extrabold text-white">{c.num}</div>
                <h3 className="m-0 min-w-0 text-xl font-semibold text-ink">{c.title}</h3>
              </div>
              <p className="m-0 text-muted">{c.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Ecosystem ── */}
      <section className="section">
        <div className="container section-head">
          <div>
            <span className="section-kicker">Hệ sinh thái</span>
            <h2 className="section-title">anyLEARN có gì?</h2>
          </div>
        </div>
        <div className="container grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {ECOSYSTEM.map(e => (
            <article key={e.name} className={`${CARD} flex flex-col justify-between`}>
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-green to-blue text-white"><e.Icon className="size-6" /></div>
                  <h3 className="m-0 min-w-0 text-lg font-semibold text-blue">{e.name}</h3>
                </div>
                <p className="m-0 text-muted text-sm">{e.desc}</p>
              </div>
              <Link href="/search" className="mt-4 inline-flex min-h-11 items-center gap-0.5 text-sm font-semibold text-green-dark no-underline hover:underline">
                Xem {e.name} <ChevronRightIcon className="size-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* ── Partners ── */}
      <section className="section section--soft">
        <div className="container section-head">
          <div>
            <span className="section-kicker">Đối tác</span>
            <h2 className="section-title">Đối tác của anyLEARN</h2>
          </div>
        </div>
        <div className="container grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {PARTNER_LOGOS.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt={`Đối tác ${i + 1}`} loading="lazy"
              className="aspect-square w-full rounded-xl border border-line bg-white object-contain p-2" />
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="section">
        <div className="container section-head">
          <div>
            <span className="section-kicker">Phụ huynh nói gì</span>
            <h2 className="section-title">Phụ huynh nói gì về anyLEARN?</h2>
          </div>
        </div>
        <div className="container grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <article key={i} className={CARD}>
              <div className="flex items-center gap-3.5 mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.img} alt={t.name} loading="lazy" className="w-14 h-14 rounded-full object-cover border-2 border-line shrink-0" />
                <div>
                  <div className="font-semibold text-ink">{t.name}</div>
                  <div className="text-[13px] text-muted">{t.title}</div>
                </div>
              </div>
              <p className="m-0 italic leading-relaxed text-text">{t.quote}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Press ── */}
      <section className="section section--soft">
        <div className="container section-head">
          <div>
            <span className="section-kicker">Truyền thông</span>
            <h2 className="section-title">Báo chí nói gì về chúng tôi</h2>
          </div>
        </div>
        <div className="container flex gap-6 justify-center flex-wrap">
          {PRESS.map(p => (
            <div key={p.name} className="flex items-center rounded-2xl border border-line bg-white px-10 py-5 shadow-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.img} alt={p.name} loading="lazy" className="h-12 object-contain" />
            </div>
          ))}
        </div>
      </section>

      {/* ── Team ── */}
      <section className="section">
        <div className="container section-head">
          <div>
            <span className="section-kicker">Đội ngũ</span>
            <h2 className="section-title">Đội ngũ anyLEARN</h2>
          </div>
        </div>
        <div className="container grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {TEAM.map(m => (
            <article key={m.name} className="overflow-hidden rounded-card border border-line bg-white shadow-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.img} alt={m.name} loading="lazy" className="w-full aspect-[4/3] object-cover block" />
              <div className="px-5 py-4">
                <div className="text-lg font-semibold text-ink">{m.name}</div>
                <div className="mt-1.5 text-sm font-semibold text-blue">{m.title}</div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
