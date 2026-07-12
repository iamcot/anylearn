import SearchCard from '@/components/SearchCard'
import Link from 'next/link'

const BASE = ''

const PROBLEMS = [
  { emoji: '⏳', title: 'Mất thời gian tìm kiếm', desc: 'Thông tin trường học, khóa học và chuyên gia thường nằm rải rác trên nhiều kênh khác nhau' },
  { emoji: '⚖️', title: 'Khó so sánh lựa chọn', desc: 'Không có công cụ so sánh rõ ràng về chương trình, học phí, đánh giá và phù hợp với con' },
  { emoji: '🧭', title: 'Thiếu tư vấn chuyên sâu', desc: 'Phụ huynh thường không biết bắt đầu từ đâu khi tìm chương trình phù hợp với độ tuổi và mục tiêu' },
]

const COMMITS = [
  { num: 1, title: 'Trường học uy tín', desc: 'Kiểm tra thông tin pháp lý, chương trình, đội ngũ và phản hồi từ phụ huynh/học viên trước khi hiển thị' },
  { num: 2, title: 'Chuyên gia chất lượng', desc: 'Xác minh chứng chỉ, kinh nghiệm và năng lực giảng dạy của từng chuyên gia, gia sư và huấn luyện viên' },
  { num: 3, title: 'Hỗ trợ tư vấn', desc: 'Đội ngũ tư vấn viên sẵn sàng hỗ trợ phụ huynh trong toàn bộ hành trình chọn khóa học cho con' },
]

const ECOSYSTEM = [
  { emoji: '🏫', name: 'anySCHOOL', desc: 'Tìm trường học, hệ quốc tế và chương trình chính quy phù hợp' },
  { emoji: '📚', name: 'anyCOURSE', desc: 'Khóa học ngoại khóa, kỹ năng, thể thao và nghệ thuật online & offline' },
  { emoji: '👨‍🏫', name: 'anyPROFESSOR', desc: 'Kết nối với gia sư, huấn luyện viên và chuyên gia 1-1' },
  { emoji: '📱', name: 'anyAPP', desc: 'Ứng dụng di động quản lý lịch học, bài tập và tiến độ của con' },
  { emoji: '🎉', name: 'anyEVENT', desc: 'Sự kiện, hội thảo và chương trình trải nghiệm giáo dục cho trẻ' },
]

const STATS = [
  { img: `${BASE}/cdn/anylearn/img/landing_number1.png`, num: '500+', label: 'Đối tác' },
  { img: `${BASE}/cdn/anylearn/img/landing_number2.png`, num: '2500+', label: 'Khoá học' },
  { img: `${BASE}/cdn/anylearn/img/landing_number3.png`, num: '200+', label: 'Chuyên gia' },
  { img: `${BASE}/cdn/anylearn/img/landing_number4.png`, num: '15000+', label: 'Học viên' },
]

const TESTIMONIALS = [
  {
    img: `${BASE}/cdn/onepage/images/feedbacks/kimchi.jpg`,
    quote: 'Tôi thấy ứng dụng anyLEARN rất hữu ích. Nhờ ứng dụng, khi đăng ký khóa học cho con, tôi có thể dễ dàng so sánh và chọn được chương trình phù hợp nhất.',
    name: 'Chị Kim Chi', title: 'Phụ huynh',
  },
  {
    img: `${BASE}/cdn/onepage/images/feedbacks/kimpham.jpg`,
    quote: 'Sau khi con hoàn thành khóa học Tư duy MMS đăng ký trên anyLEARN, con có nhiều thay đổi tích cực rõ rệt. Rất hài lòng với dịch vụ tư vấn và hỗ trợ của anyLEARN.',
    name: 'Chị Kim Phạm', title: 'Phụ huynh',
  },
  {
    img: `${BASE}/cdn/onepage/images/feedbacks/xuanhoa.jpg`,
    quote: 'Các trường và trung tâm đào tạo trên anyLEARN được sàng lọc kỹ lưỡng nên tôi rất yên tâm khi đăng ký cho con. Giao diện dễ dùng, tìm kiếm nhanh.',
    name: 'Anh Xuân Hòa', title: 'Phụ huynh',
  },
]

const TEAM = [
  { img: `${BASE}/cdn/anylearn/img/Trinh.png`, name: 'Đặng Thị Hoài Trinh', title: 'Founder & CEO' },
  { img: `${BASE}/cdn/anylearn/img/Thang.png`, name: 'Trương Công Thắng', title: 'Co-Founder & CTO' },
  { img: `${BASE}/cdn/anylearn/img/msNhu.png`, name: 'Tôn Thị Quỳnh Như', title: 'Co-Founder' },
  { img: `${BASE}/cdn/anylearn/img/mrHuyen.jpg`, name: 'Lê Thế Huyên', title: 'Legal Team Leader' },
  { img: `${BASE}/cdn/anylearn/img/msDung.jpg`, name: 'Nguyễn Thị Viên Dung', title: 'Head of Partner Relationship' },
  { img: `${BASE}/cdn/anylearn/img/msNgoc.jpg`, name: 'Nguyễn Thị Vui', title: 'HR Development Manager' },
]

const PRESS = [
  { img: `${BASE}/cdn/anylearn/img/GDTD.png`, name: 'Giáo dục & Thời đại' },
  { img: `${BASE}/cdn/anylearn/img/VTV1.png`, name: 'VTV1' },
  { img: `${BASE}/cdn/anylearn/img/htv9.png`, name: 'HTV9' },
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

export default function InfoPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section style={{
        minHeight: 580,
        background: 'linear-gradient(135deg, #00539b, #00a651)',
        color: 'white', display: 'flex', alignItems: 'center',
        padding: '80px 0 120px',
      }}>
        <div className="container">
          <span style={{
            display: 'inline-flex', borderRadius: 999, padding: '8px 14px',
            background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.24)',
            fontSize: 14, fontWeight: 900, marginBottom: 18,
          }}>Giới thiệu anyLEARN</span>
          <h1 style={{ fontSize: 'clamp(36px,5vw,62px)', fontWeight: 900, lineHeight: 1.04, letterSpacing: -1.4, margin: '0 0 18px', maxWidth: 780 }}>
            Tìm trường học, khóa học và chuyên gia phù hợp cho con
          </h1>
          <p style={{ fontSize: 18, margin: '0 0 32px', color: 'rgba(255,255,255,0.9)', maxWidth: 620 }}>
            anyLEARN giúp phụ huynh tìm kiếm, so sánh và đăng ký chương trình học chính quy, ngoại khóa, online và offline trong một hành trình rõ ràng hơn
          </p>
          <SearchCard variant="about" />
        </div>
      </section>

      {/* ── Intro ── */}
      <section className="section">
        <div className="container grid-intro" style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 56, alignItems: 'center' }}>
          <div style={{ fontSize: 'clamp(72px,12vw,150px)', fontWeight: 900, lineHeight: 0.9, letterSpacing: -6, userSelect: 'none' }}>
            <div style={{ color: '#00539b' }}>any</div>
            <div style={{ color: '#00a651' }}>LEARN</div>
          </div>
          <div>
            <span className="section-kicker">anyLEARN là gì?</span>
            <h2 className="section-title">Nền tảng booking giáo dục cho phụ huynh hiện đại</h2>
            <p style={{ fontSize: 18, color: '#6d7a8a', margin: '16px 0 24px' }}>
              anyLEARN giúp cha mẹ tìm và đăng ký các chương trình học tập chính quy và ngoại khóa, offline hoặc online tại các trường quốc tế, học viện và trung tâm đào tạo chất lượng cao.
            </p>
            <div className="quick-tags" style={{ marginTop: 0 }}>
              {['Tìm kiếm', 'So sánh', 'Tư vấn', 'Đăng ký', 'Thanh toán'].map(t => (
                <span key={t} className="tag">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{ background: '#f7fafc', padding: '56px 0' }}>
        <div className="container grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, textAlign: 'center' }}>
          {STATS.map(s => (
            <div key={s.label} style={{ background: 'white', border: '1px solid #e6edf4', borderRadius: 22, padding: '28px 20px', boxShadow: '0 8px 24px rgba(15,23,42,0.05)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.img} alt={s.label} style={{ width: 56, height: 56, objectFit: 'contain', marginBottom: 12 }} />
              <div style={{ fontSize: 40, fontWeight: 900, color: '#00539b', marginBottom: 6 }}>{s.num}</div>
              <div style={{ color: '#6d7a8a', fontWeight: 700 }}>{s.label}</div>
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
        <div className="container grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
          {PROBLEMS.map(p => (
            <article key={p.title} style={{ background: 'white', border: '1px solid #e6edf4', borderRadius: 22, padding: 24, boxShadow: '0 8px 24px rgba(15,23,42,0.05)' }}>
              <div className="feature-icon">{p.emoji}</div>
              <h3 style={{ margin: '0 0 10px', color: '#17212f', fontSize: 21, fontWeight: 900 }}>{p.title}</h3>
              <p style={{ margin: 0, color: '#6d7a8a' }}>{p.desc}</p>
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
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
          {COMMITS.map(c => (
            <article key={c.num} style={{ background: 'white', border: '1px solid #e6edf4', borderRadius: 22, padding: 24, boxShadow: '0 8px 24px rgba(15,23,42,0.05)' }}>
              <div style={{ width: 46, height: 46, borderRadius: 16, background: '#00a651', color: 'white', fontWeight: 900, fontSize: 20, marginBottom: 16, display: 'grid', placeItems: 'center' }}>{c.num}</div>
              <h3 style={{ margin: '0 0 10px', color: '#17212f', fontSize: 21, fontWeight: 900 }}>{c.title}</h3>
              <p style={{ margin: 0, color: '#6d7a8a' }}>{c.desc}</p>
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
        <div className="container grid-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 16 }}>
          {ECOSYSTEM.map(e => (
            <article key={e.name} style={{ background: 'white', border: '1px solid #e6edf4', borderRadius: 22, padding: 24, minHeight: 200, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 8px 24px rgba(15,23,42,0.05)' }}>
              <div>
                <div className="icon-square">{e.emoji}</div>
                <h3 style={{ margin: '0 0 8px', color: '#00539b', fontSize: 20, fontWeight: 900 }}>{e.name}</h3>
                <p style={{ margin: 0, color: '#6d7a8a', fontSize: 14 }}>{e.desc}</p>
              </div>
              <Link href="/search" style={{ color: '#008244', fontWeight: 900, marginTop: 16, textDecoration: 'none' }}>Xem {e.name} →</Link>
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
        <div className="container grid-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: 12 }}>
          {PARTNER_LOGOS.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt={`Đối tác ${i + 1}`}
              style={{ width: '100%', aspectRatio: '1/1', objectFit: 'contain', borderRadius: 12, background: 'white', padding: 8, border: '1px solid #e6edf4' }} />
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
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
          {TESTIMONIALS.map((t, i) => (
            <article key={i} style={{ background: 'white', border: '1px solid #e6edf4', borderRadius: 22, padding: 28, boxShadow: '0 8px 24px rgba(15,23,42,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.img} alt={t.name} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e6edf4' }} />
                <div>
                  <div style={{ fontWeight: 900, color: '#17212f' }}>{t.name}</div>
                  <div style={{ fontSize: 13, color: '#6d7a8a' }}>{t.title}</div>
                </div>
              </div>
              <div style={{ fontSize: 28, color: '#00a651', lineHeight: 1, marginBottom: 10 }}>"</div>
              <p style={{ margin: 0, color: '#2f3b4a', lineHeight: 1.6, fontStyle: 'italic' }}>{t.quote}</p>
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
        <div className="container" style={{ display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
          {PRESS.map(p => (
            <div key={p.name} style={{ background: 'white', border: '1px solid #e6edf4', borderRadius: 18, padding: '20px 40px', display: 'flex', alignItems: 'center', boxShadow: '0 8px 24px rgba(15,23,42,0.05)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.img} alt={p.name} style={{ height: 52, objectFit: 'contain' }} />
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
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
          {TEAM.map(m => (
            <article key={m.name} style={{ background: 'white', border: '1px solid #e6edf4', borderRadius: 22, overflow: 'hidden', boxShadow: '0 8px 24px rgba(15,23,42,0.05)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.img} alt={m.name} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} />
              <div style={{ padding: '18px 20px' }}>
                <div style={{ fontWeight: 900, color: '#17212f', fontSize: 18 }}>{m.name}</div>
                <div style={{ fontSize: 14, color: '#00539b', fontWeight: 700, marginTop: 6 }}>{m.title}</div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
