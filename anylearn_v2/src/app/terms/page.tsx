export default function TermsPage() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 780 }}>
        <h1 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, color: '#17212f', marginBottom: 8 }}>Điều khoản sử dụng</h1>
        <p style={{ color: '#6d7a8a', marginBottom: 40 }}>Cập nhật lần cuối: 01/07/2026</p>

        {[
          { title: '1. Giới thiệu', content: 'anyLEARN là nền tảng giúp phụ huynh tìm kiếm, so sánh và đăng ký các chương trình học cho con. Bằng việc sử dụng dịch vụ, bạn đồng ý tuân theo các điều khoản này.' },
          { title: '2. Tài khoản người dùng', content: 'Bạn có trách nhiệm bảo mật tài khoản và mật khẩu. Thông tin đăng ký phải chính xác và đầy đủ. anyLEARN có quyền tạm ngưng tài khoản vi phạm điều khoản.' },
          { title: '3. Đặt lịch và thanh toán', content: 'Các giao dịch được xử lý qua hệ thống thanh toán an toàn. Sau khi thanh toán thành công, bạn sẽ nhận được xác nhận qua email/SMS. Chính sách hoàn tiền áp dụng theo từng đối tác.' },
          { title: '4. Quyền riêng tư', content: 'anyLEARN thu thập thông tin cá nhân để cung cấp dịch vụ và cải thiện trải nghiệm người dùng. Chúng tôi cam kết không chia sẻ thông tin với bên thứ ba khi chưa có sự đồng ý của bạn.' },
          { title: '5. Trách nhiệm hạn chế', content: 'anyLEARN là nền tảng kết nối, không chịu trách nhiệm trực tiếp về chất lượng dịch vụ của các đối tác. Chúng tôi cam kết kiểm duyệt và hỗ trợ giải quyết khiếu nại.' },
          { title: '6. Liên hệ', content: 'Mọi thắc mắc về điều khoản sử dụng, vui lòng liên hệ: support@anylearn.vn hoặc hotline 1900-xxxx.' },
        ].map(s => (
          <div key={s.title} style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#17212f', marginBottom: 12 }}>{s.title}</h2>
            <p style={{ color: '#2f3b4a', lineHeight: 1.8, margin: 0 }}>{s.content}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
