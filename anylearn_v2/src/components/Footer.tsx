import Link from 'next/link'

export default function Footer() {
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
            <Link href="/search">Tìm khóa học</Link>
            <Link href="/search">Tìm trường học</Link>
            <Link href="/search">Tìm chuyên gia</Link>
            <Link href="/info">Nhận tư vấn</Link>
          </div>

          <div>
            <h4>Dành cho đối tác</h4>
            <a href="#">Đăng ký trường học</a>
            <a href="#">Đăng ký chuyên gia</a>
            <a href="#">Liên hệ hợp tác</a>
          </div>

          <div>
            <h4>Hỗ trợ</h4>
            <a href="#">FAQ</a>
            <a href="#">Chính sách thanh toán</a>
            <a href="#">Chính sách đổi trả</a>
            <a href="#">Điều khoản sử dụng</a>
          </div>

          <div>
            <h4>Liên hệ anyLEARN</h4>
            <a href="tel:0374900344">📞 0374 900 344</a>
            <a href="mailto:info@anylearn.vn">✉️ info@anylearn.vn</a>
            <p className="mt-2.5">⏰ 8:30 - 18:00, Thứ 2 - Thứ 7</p>
            <div className="flex gap-2.5 mt-3.5">
              {[
                { href: '#', src: '/cdn/img/youtube.png', title: 'YouTube' },
                { href: '#', src: '/cdn/img/facebook.png', title: 'Facebook' },
                { href: '#', src: '/cdn/img/zalo.png', title: 'Zalo' },
              ].map(s => (
                <a key={s.title} href={s.href} title={s.title}
                  className="w-9 h-9 rounded-full border border-white/25 grid place-items-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.src} alt={s.title} className="w-5 h-5 object-contain" />
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
