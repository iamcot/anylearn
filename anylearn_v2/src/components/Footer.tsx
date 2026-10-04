import Link from 'next/link'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/v2/api'

interface KnowledgeItem { id: number; title: string; url: string }

async function fetchTopKnowledge(): Promise<KnowledgeItem[]> {
  try {
    const res = await fetch(`${BASE}/helpcenter/top?limit=4`, { next: { revalidate: 3600 } })
    const json = await res.json()
    if (json?.resultCode === 1 && Array.isArray(json?.data)) return json.data
  } catch {}
  return []
}

export default async function Footer() {
  const topKnowledge = await fetchTopKnowledge()

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/cdn/anylearn/img/logo-white.svg" alt="anyLEARN" className="h-10 mb-4" />
            <p>Nền tảng giúp phụ huynh tìm kiếm, so sánh và đăng ký trường học, khóa học, chuyên gia phù hợp cho con.</p>
          </div>

          <div>
            <h4>Dành cho phụ huynh</h4>
            <Link href="/helpcenter">Trung Tâm Hỗ trợ</Link>
            {topKnowledge.map(k => (
              <Link key={k.id} href={`/helpcenter/${k.id}/${k.url}`}>{k.title}</Link>
            ))}
          </div>

          <div>
            <h4>Điều khoản &amp; Chính sách</h4>
            <Link href="/privacy">Chính sách bảo mật thông tin</Link>
            <Link href="/guide?p=guide_toc">Điều khoản sử dụng</Link>
            <Link href="/guide?p=guide_payment_term">Chính sách thanh toán</Link>
            <Link href="/guide?p=guide_return_term">Chính sách đổi - trả và hoàn tiền</Link>
          </div>

          <div>
            <h4>Liên hệ anyLEARN</h4>
            <a href="tel:0374900344">📞 0374 900 344</a>
            <a href="mailto:info@anylearn.vn">✉️ info@anylearn.vn</a>
            <p className="mt-2.5">⏰ 8:30 - 18:00, Thứ 2 - Thứ 7</p>
            <div className="flex gap-2.5 mt-3.5">
              {[
                { href: 'https://www.youtube.com/channel/UCam71id1lM8tZuMfjy2DDRw', src: '/cdn/img/youtube.png', title: 'YouTube' },
                { href: 'https://www.facebook.com/anylearnhockhonggioihan', src: '/cdn/img/facebook.png', title: 'Facebook' },
                { href: 'https://zalo.me/0374900344', src: '/cdn/img/zalo.png', title: 'Zalo' },
              ].map(s => (
                <a key={s.title} href={s.href} title={s.title} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.src} alt={s.title} className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2024 Công ty Cổ phần Đầu tư và Giáo dục anyLEARN. All rights reserved.</p>
      </div>
    </footer>
  )
}
