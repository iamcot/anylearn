from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import re

doc = Document()

# ── Page margins ──────────────────────────────────────────────────────────────
for section in doc.sections:
    section.top_margin    = Inches(1)
    section.bottom_margin = Inches(1)
    section.left_margin   = Inches(1.2)
    section.right_margin  = Inches(1.2)

# ── Default body font ─────────────────────────────────────────────────────────
style = doc.styles['Normal']
style.font.name = 'Calibri'
style.font.size = Pt(11)

# ── Heading styles ─────────────────────────────────────────────────────────────
def set_heading_style(doc, level, size, bold=True, color=None):
    s = doc.styles[f'Heading {level}']
    s.font.name = 'Calibri'
    s.font.size = Pt(size)
    s.font.bold = bold
    if color:
        s.font.color.rgb = RGBColor(*color)

set_heading_style(doc, 1, 18, color=(31, 73, 125))
set_heading_style(doc, 2, 14, color=(47, 84, 150))
set_heading_style(doc, 3, 12, color=(68, 114, 196))

# ── Helper: add table with header ────────────────────────────────────────────
def add_table(doc, headers, rows, col_widths=None):
    t = doc.add_table(rows=1 + len(rows), cols=len(headers))
    t.style = 'Table Grid'
    # Header row
    for i, h in enumerate(headers):
        cell = t.rows[0].cells[i]
        cell.text = h
        p = cell.paragraphs[0]
        p.runs[0].bold = True
        p.runs[0].font.size = Pt(10)
        tc = cell._tc
        tcPr = tc.get_or_add_tcPr()
        shd = OxmlElement('w:shd')
        shd.set(qn('w:val'), 'clear')
        shd.set(qn('w:color'), 'auto')
        shd.set(qn('w:fill'), '2E74B5')
        tcPr.append(shd)
        p.runs[0].font.color.rgb = RGBColor(255, 255, 255)
    # Data rows
    for ri, row in enumerate(rows):
        for ci, val in enumerate(row):
            cell = t.rows[ri + 1].cells[ci]
            cell.text = str(val)
            cell.paragraphs[0].runs[0].font.size = Pt(10)
    if col_widths:
        for ci, w in enumerate(col_widths):
            for row in t.rows:
                row.cells[ci].width = Inches(w)
    return t

# ── Helper: add code block ────────────────────────────────────────────────────
def add_code(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(0.3)
    run = p.add_run(text.strip())
    run.font.name = 'Courier New'
    run.font.size = Pt(9)
    run.font.color.rgb = RGBColor(30, 30, 30)
    # Light gray background via paragraph shading
    pPr = p._p.get_or_add_pPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), 'F2F2F2')
    pPr.append(shd)
    return p

def add_note(doc, text):
    p = doc.add_paragraph()
    run = p.add_run('📌 ' + text)
    run.italic = True
    run.font.size = Pt(10)
    run.font.color.rgb = RGBColor(120, 80, 0)

# ══════════════════════════════════════════════════════════════════════════════
# TITLE PAGE
# ══════════════════════════════════════════════════════════════════════════════
doc.add_heading('AnyPoint — Smoke Test Cases', 0)
p = doc.add_paragraph('Tài liệu kiểm thử chức năng anyPoint (wallet_c)')
p.runs[0].font.size = Pt(13)
p.runs[0].font.color.rgb = RGBColor(80, 80, 80)
doc.add_paragraph()
add_table(doc,
    ['Thuộc tính', 'Giá trị'],
    [
        ['Phiên bản', '1.0'],
        ['Ngày tạo', '2026-10-07'],
        ['Hệ thống', 'AnyLearn — anylearn_backend_v2 + anylearn_admin'],
        ['Phạm vi', 'anyPoint (wallet_c): cấp phát, duyệt, sử dụng, kiểm toán'],
    ],
    col_widths=[2, 4]
)
doc.add_page_break()

# ══════════════════════════════════════════════════════════════════════════════
# 1. CẤU HÌNH
# ══════════════════════════════════════════════════════════════════════════════
doc.add_heading('1. Cấu hình hệ thống', 1)
doc.add_paragraph('Giá trị hiện tại trong bảng configurations (MySQL):')
add_table(doc,
    ['Key', 'Value', 'Ý nghĩa'],
    [
        ['bonus_rate',       '1000',  '1 anyPoint = 1.000 VND'],
        ['discount',         '0.1',   'Người mua nhận 10% phần hệ thống'],
        ['commission',       '0.2',   'Mỗi cấp referral nhận 20% phần hệ thống'],
        ['bonus_foundation', '0.05',  'Quỹ vận hành 5% phần hệ thống'],
        ['friend_tree',      '2',     'Tối đa 2 cấp referral'],
        ['bonus_ref_seller', '(N/A)', 'Mặc định 0 — không có thưởng ref-seller'],
    ],
    col_widths=[2, 1.2, 3.3]
)
doc.add_paragraph()
doc.add_heading('Công thức phân phối (với giá P và tỉ lệ đối tác R):', 3)
add_code(doc,
    'authorPoints       = floor(P × R / 1000)\n'
    'buyerPoints        = round(P × (1−R) × 0.1 / 1000)\n'
    'referralPoints     = round(P × (1−R) × 0.2 / 1000)   // mỗi cấp, tối đa 2 cấp\n'
    'foundationPoints   = round(P × (1−R) × 0.05 / 1000)  // anyPoints, accounting only\n'
    'companyRevenueVnd  = P − (author+buyer+Σref+foundation) × 1000  // VND'
)
add_note(doc, 'foundation và net_revenue: approved cùng lúc với order nhưng KHÔNG credit wallet_c. commission_rate=-1: công ty giữ toàn bộ, companyRevenueVnd = P.')
doc.add_page_break()

# ══════════════════════════════════════════════════════════════════════════════
# 2. SETUP DỮ LIỆU
# ══════════════════════════════════════════════════════════════════════════════
doc.add_heading('2. Setup dữ liệu test', 1)
add_table(doc,
    ['Role', 'Mô tả', 'Dùng cho TC'],
    [
        ['Admin',      'user có role=\'admin\'',                               'Tất cả TC admin'],
        ['Partner A',  'role=\'school\', commission_rate=0.20',                'TC-01..08'],
        ['Partner B',  'role=\'school\', commission_rate=0.60',                'TC-10'],
        ['Buyer',      'role=\'student\', user_id = Referrer.id',              'TC-01..08'],
        ['Referrer',   'role=\'student\', user_id = null',                     'TC-01, TC-02'],
        ['Item A',     'Của Partner A, price=186000, commission_rate=null',    'TC-01..06'],
        ['Item B',     'Của Partner B, commission_rate=-1',                    'TC-09'],
        ['Item C',     'Của Partner B, commission_rate=0.40 (override)',       'TC-10'],
    ],
    col_widths=[1.5, 3.2, 1.8]
)
doc.add_page_break()

# ══════════════════════════════════════════════════════════════════════════════
# 3. TEST CASES
# ══════════════════════════════════════════════════════════════════════════════
doc.add_heading('3. Test Cases', 1)

# ── TC-01 ─────────────────────────────────────────────────────────────────────
doc.add_heading('TC-01 — Đặt hàng tạo pending commissions đúng', 2)
doc.add_paragraph('Mục đích: Verify công thức phân phối anyPoint khi checkout (trước khi thanh toán).')
doc.add_paragraph()

doc.add_heading('Tính toán kỳ vọng (Item A — 186.000đ, R=0.20):', 3)
add_code(doc,
    'authorPoints       = floor(186000 × 0.20 / 1000) = floor(37.2)         = 37\n'
    'buyerPoints        = round(186000 × 0.80 × 0.10 / 1000) = round(14.88) = 15\n'
    'referralPoints     = round(186000 × 0.80 × 0.20 / 1000) = round(29.76) = 30\n'
    'foundationPoints   = round(186000 × 0.80 × 0.05 / 1000) = round(7.44)  = 7\n'
    'companyRevenueVnd  = 186000 − (37+15+30+7) × 1000                      = 97.000 VND'
)

doc.add_heading('Bước thực hiện:', 3)
steps = [
    'Login Buyer → POST /v2/api/login',
    'Thêm Item A vào giỏ → POST /v2/api/cart/add { itemId: {itemAId} }',
    'Checkout → POST /v2/api/checkout { "paymentMethod": "bank_transfer" }',
    'Ghi lại orderId trả về',
]
for i, s in enumerate(steps, 1):
    doc.add_paragraph(f'{i}. {s}', style='List Number')

doc.add_heading('Verify DB:', 3)
add_code(doc,
    '-- Lấy order_detail ID\n'
    'SELECT id FROM order_details WHERE order_id = {orderId};\n\n'
    '-- Kiểm tra pending transactions\n'
    'SELECT type, amount, pay_method, status, user_id\n'
    'FROM transactions WHERE order_id = {detailId} ORDER BY id;'
)

doc.add_heading('Kết quả kỳ vọng:', 3)
add_table(doc,
    ['type', 'amount', 'pay_method', 'status', 'user_id'],
    [
        ['partner',    '37',   'wallet_c', '0 (pending)', 'Partner A'],
        ['commission', '15',   'wallet_c', '0 (pending)', 'Buyer'],
        ['commission', '30',   'wallet_c', '0 (pending)', 'Referrer'],
        ['foundation',  '7',     'wallet_c', '0 (pending)', 'Buyer'],
        ['net_revenue', '97000', 'company',  '0 (pending)', 'Buyer'],
    ],
    col_widths=[1.2, 1, 1.2, 1.3, 1.8]
)
add_note(doc, 'Tất cả status=0. foundation + net_revenue: approved cùng lúc với đơn hàng nhưng KHÔNG cộng wallet_c — bút toán kiểm toán nội bộ.')
doc.add_paragraph()

# ── TC-02 ─────────────────────────────────────────────────────────────────────
doc.add_heading('TC-02 — Admin duyệt đơn → wallet_c được cộng', 2)
doc.add_paragraph('Điều kiện: Đã chạy TC-01.')

doc.add_heading('Bước thực hiện:', 3)
for i, s in enumerate([
    'Login Admin → POST /v2/admin/login',
    'Vào trang Orders admin → tìm orderId vừa tạo',
    'Nhấn Duyệt (hoặc gọi POST /v2/admin/orders/{orderId}/approve)',
], 1):
    doc.add_paragraph(f'{i}. {s}', style='List Number')

doc.add_heading('Verify DB:', 3)
add_code(doc,
    '-- Trạng thái đơn hàng\n'
    'SELECT status FROM orders WHERE id = {orderId};\n'
    '-- Kỳ vọng: \'delivered\'\n\n'
    '-- Transactions đã approved\n'
    'SELECT type, amount, status FROM transactions WHERE order_id = {detailId};\n'
    '-- Kỳ vọng: partner + commission đều status=1\n\n'
    '-- Wallet_c cộng đúng\n'
    'SELECT id, name, wallet_c FROM users\n'
    'WHERE id IN ({partnerAId}, {buyerId}, {referrerId});\n'
    '-- Partner A: +37  |  Buyer: +15  |  Referrer: +30\n\n'
    '-- Notifications\n'
    'SELECT type, title, content FROM notifications\n'
    'WHERE user_id IN ({partnerAId}, {buyerId}, {referrerId})\n'
    'ORDER BY id DESC LIMIT 3;\n'
    '-- Kỳ vọng: mỗi người nhận 1 notif "Nhận anyPoint"'
)
doc.add_paragraph()

# ── TC-03 ─────────────────────────────────────────────────────────────────────
doc.add_heading('TC-03 — Thanh toán thất bại → hoàn anyPoint đã dùng', 2)
doc.add_paragraph('Điều kiện: Buyer có wallet_c ≥ 50 (cộng thủ công qua SQL nếu cần).')

doc.add_heading('Bước thực hiện:', 3)
for i, s in enumerate([
    'Checkout với pointsUsed=50: POST /v2/api/checkout { "paymentMethod": "vnpay", "pointsUsed": 50 }',
    'Ghi lại orderId',
    'Simulate payment fail (để timeout hoặc gọi reset API)',
], 1):
    doc.add_paragraph(f'{i}. {s}', style='List Number')

doc.add_heading('Verify DB:', 3)
add_code(doc,
    '-- Ngay sau checkout: exchange tx pending\n'
    'SELECT type, amount, status FROM transactions\n'
    'WHERE order_id = {orderId} AND type=\'exchange\';\n'
    '-- Kỳ vọng: amount=-50, status=0\n\n'
    '-- Sau khi fail: exchange bị cancel + điểm hoàn\n'
    'SELECT status FROM transactions WHERE order_id = {orderId} AND type=\'exchange\';\n'
    '-- Kỳ vọng: status=99\n\n'
    'SELECT wallet_c FROM users WHERE id = {buyerId};\n'
    '-- Kỳ vọng: trở về giá trị trước checkout'
)
doc.add_paragraph()

# ── TC-04 ─────────────────────────────────────────────────────────────────────
doc.add_heading('TC-04 — User xem lịch sử giao dịch', 2)
for i, s in enumerate([
    'Login Buyer',
    'GET /v2/api/transaction/history?page=0&size=20',
    'Verify: chỉ thấy transactions của chính Buyer, không thấy của Partner hay Referrer',
], 1):
    doc.add_paragraph(f'{i}. {s}', style='List Number')
doc.add_paragraph()

# ── TC-05 ─────────────────────────────────────────────────────────────────────
doc.add_heading('TC-05 — Partner yêu cầu rút anyPoint', 2)
doc.add_paragraph('Điều kiện: Partner A có wallet_c ≥ 100.')

doc.add_heading('Bước thực hiện:', 3)
for i, s in enumerate([
    'Login Partner A',
    'POST /v2/api/transaction/withdraw  body: { "amount": 100, "bankInfo": "Vietcombank 1234567890 Nguyen Van A" }',
], 1):
    doc.add_paragraph(f'{i}. {s}', style='List Number')

doc.add_heading('Verify DB:', 3)
add_code(doc,
    'SELECT wallet_c FROM users WHERE id = {partnerAId};\n'
    '-- Kỳ vọng: giảm 100 ngay (hold)\n\n'
    'SELECT type, amount, status, content FROM transactions\n'
    'WHERE user_id = {partnerAId} AND type=\'withdraw\' ORDER BY id DESC LIMIT 1;\n'
    '-- Kỳ vọng: amount=-100, status=0'
)
doc.add_paragraph()

# ── TC-06 ─────────────────────────────────────────────────────────────────────
doc.add_heading('TC-06 — Admin duyệt yêu cầu rút tiền', 2)
doc.add_paragraph('Điều kiện: Đã chạy TC-05.')
for i, s in enumerate([
    'Admin → trang Transactions, filter type=withdraw, status=0',
    'Approve → PUT /v2/admin/transactions/{withdrawTxId}/approve',
], 1):
    doc.add_paragraph(f'{i}. {s}', style='List Number')
add_code(doc,
    'SELECT status FROM transactions WHERE id = {withdrawTxId};\n'
    '-- Kỳ vọng: 1\n\n'
    'SELECT wallet_c FROM users WHERE id = {partnerAId};\n'
    '-- Kỳ vọng: KHÔNG tăng thêm (đã trừ ở TC-05, admin chỉ xác nhận)'
)
doc.add_paragraph()

# ── TC-07 ─────────────────────────────────────────────────────────────────────
doc.add_heading('TC-07 — Admin từ chối rút tiền → hoàn điểm', 2)
doc.add_paragraph('Tạo thêm 1 withdraw request (50 anyPoint), sau đó reject.')
for i, s in enumerate([
    'Partner A: POST /v2/api/transaction/withdraw { "amount": 50 }',
    'Admin: PUT /v2/admin/transactions/{txId}/reject',
], 1):
    doc.add_paragraph(f'{i}. {s}', style='List Number')
add_code(doc,
    'SELECT status FROM transactions WHERE id = {txId};\n'
    '-- Kỳ vọng: 99\n\n'
    'SELECT wallet_c FROM users WHERE id = {partnerAId};\n'
    '-- Kỳ vọng: tăng +50 (hoàn lại)'
)
doc.add_paragraph()

# ── TC-08 ─────────────────────────────────────────────────────────────────────
doc.add_heading('TC-08 — Admin approve commission thủ công', 2)
doc.add_paragraph('Mục đích: Duyệt bằng tay commission pending (đơn bank_transfer chưa confirm).')
for i, s in enumerate([
    'Admin tìm commission tx của Partner A (type=partner, status=0)',
    'PUT /v2/admin/transactions/{txId}/approve',
], 1):
    doc.add_paragraph(f'{i}. {s}', style='List Number')
add_code(doc,
    'SELECT status FROM transactions WHERE id = {txId};\n'
    '-- Kỳ vọng: 1\n\n'
    'SELECT wallet_c FROM users WHERE id = {partnerAId};\n'
    '-- Kỳ vọng: tăng đúng amount của tx (37)'
)
doc.add_paragraph()

# ── TC-09 ─────────────────────────────────────────────────────────────────────
doc.add_heading('TC-09 — commission_rate = -1 → không tạo point txs, vẫn có net_revenue', 2)
doc.add_paragraph('Item B có commission_rate = -1. Buyer mua Item B → checkout.')
add_code(doc,
    '-- Không có point transactions\n'
    'SELECT COUNT(*) FROM transactions\n'
    'WHERE order_id = {detailIdOfItemB}\n'
    'AND type IN (\'partner\', \'commission\', \'foundation\');\n'
    '-- Kỳ vọng: 0\n\n'
    '-- Nhưng vẫn có net_revenue (công ty giữ toàn bộ)\n'
    'SELECT type, amount FROM transactions\n'
    'WHERE order_id = {detailIdOfItemB} AND type = \'net_revenue\';\n'
    '-- Kỳ vọng: amount = price của Item B'
)
doc.add_paragraph()

# ── TC-10 ─────────────────────────────────────────────────────────────────────
doc.add_heading('TC-10 — commission_rate override từ item > author', 2)
doc.add_paragraph('Item C có commission_rate=0.40, thuộc Partner B (commission_rate=0.60). Phải dùng 0.40.')
add_code(doc,
    '-- Tính kỳ vọng với R=0.40, giá 186.000đ:\n'
    '-- authorPoints = floor(186000 × 0.40 / 1000) = 74  (không phải 111 nếu dùng 0.60)\n'
    '-- buyerPoints  = round(186000 × 0.60 × 0.10 / 1000) = 11\n\n'
    'SELECT type, amount FROM transactions WHERE order_id = {detailIdOfItemC}\n'
    'AND type IN (\'partner\', \'commission\') ORDER BY id;'
)
doc.add_paragraph()

# ── TC-11 ─────────────────────────────────────────────────────────────────────
doc.add_heading('TC-11 — company_commission JSON override rates', 2)
doc.add_paragraph('Mục đích: Override discount=0.20 qua JSON trên item (mặc định 0.10).')
doc.add_heading('Setup:', 3)
add_code(doc, "UPDATE items SET company_commission = '{\"discount\": 0.20}' WHERE id = {itemAId};")
doc.add_paragraph()
add_code(doc,
    '-- Tính kỳ vọng với discount=0.20 (override):\n'
    '-- buyerPoints = round(186000 × 0.80 × 0.20 / 1000) = 30  (gấp đôi so với TC-01)\n\n'
    '-- Verify sau checkout\n'
    'SELECT type, amount FROM transactions WHERE order_id = {detailId} AND type=\'commission\';'
)
doc.add_heading('Cleanup:', 3)
add_code(doc, 'UPDATE items SET company_commission = NULL WHERE id = {itemAId};')
doc.add_paragraph()

# ── TC-12 ─────────────────────────────────────────────────────────────────────
doc.add_heading('TC-12 — Kiểm toán: không có sai lệch', 2)
doc.add_paragraph('Điều kiện: Sau TC-02 (tất cả transactions đã approved đúng).')
for i, s in enumerate([
    'Admin → Cài đặt → Kiểm toán anyPoint',
    'Nhấn "Chạy kiểm toán ngay"',
    'Kỳ vọng: banner xanh lá "Không có sai lệch"',
], 1):
    doc.add_paragraph(f'{i}. {s}', style='List Number')
add_code(doc,
    '-- Verify thủ công\n'
    'SELECT u.id, u.wallet_c, COALESCE(SUM(t.amount),0) AS tx_sum,\n'
    '       u.wallet_c - COALESCE(SUM(t.amount),0) AS delta\n'
    'FROM users u\n'
    'LEFT JOIN transactions t ON t.user_id = u.id AND t.status = 1\n'
    'GROUP BY u.id, u.wallet_c\n'
    'HAVING u.wallet_c != COALESCE(SUM(t.amount),0);\n'
    '-- Kỳ vọng: 0 rows'
)
doc.add_paragraph()

# ── TC-13 ─────────────────────────────────────────────────────────────────────
doc.add_heading('TC-13 — Kiểm toán: phát hiện sai lệch', 2)
doc.add_paragraph('Simulate lỗi bằng cách sửa thẳng DB.')
doc.add_heading('Setup (tạo sai lệch):', 3)
add_code(doc, 'UPDATE users SET wallet_c = wallet_c + 999 WHERE id = {partnerAId};')
for i, s in enumerate([
    'Nhấn "Chạy kiểm toán ngay"',
    'Kỳ vọng: banner cam + bảng hiện Partner A với Δ=999',
], 1):
    doc.add_paragraph(f'{i}. {s}', style='List Number')
add_code(doc,
    '-- Verify notification admin\n'
    'SELECT content FROM notifications WHERE user_id = {adminId} ORDER BY id DESC LIMIT 1;\n'
    '-- Kỳ vọng: nội dung chứa userId và delta của Partner A'
)
doc.add_heading('Cleanup:', 3)
add_code(doc, 'UPDATE users SET wallet_c = wallet_c - 999 WHERE id = {partnerAId};')
doc.add_paragraph()

# ── TC-14 ─────────────────────────────────────────────────────────────────────
doc.add_heading('TC-14 — Audit cron job đăng ký khi app khởi động', 2)
add_code(doc,
    '# Xem log khi start app, kỳ vọng thấy scheduling được đăng ký\n'
    'grep -i "scheduledAudit\\|AuditService" anylearn_backend.log'
)
add_note(doc, 'Cron chạy lúc 8h sáng mỗi ngày. Không cần chờ — chỉ verify log đăng ký là đủ.')
doc.add_paragraph()

# ── TC-15 ─────────────────────────────────────────────────────────────────────
doc.add_heading('TC-15 — Trang Tài chính: số liệu đúng với DB', 2)
doc.add_paragraph('Điều kiện: Sau TC-02 (có ít nhất 1 đơn hàng delivered).')
for i, s in enumerate([
    'Admin → menu "Tài chính" (/finance)',
    'Xem 6 KPI cards: Nợ đối tác / Ví người dùng / Chờ duyệt / Doanh thu ròng / Quỹ vận hành / Tổng lưu thông',
    'Đối chiếu từng card với DB query tương ứng',
], 1):
    doc.add_paragraph(f'{i}. {s}', style='List Number')
add_code(doc,
    '-- Nợ đối tác\n'
    'SELECT COALESCE(SUM(wallet_c),0) FROM users WHERE role IN (\'school\',\'partner\',\'teacher\');\n\n'
    '-- Doanh thu ròng công ty (VND)\n'
    'SELECT COALESCE(SUM(amount),0) FROM transactions WHERE type=\'net_revenue\' AND status=1;\n\n'
    '-- Quỹ vận hành (anyPoints)\n'
    'SELECT COALESCE(SUM(amount),0) FROM transactions WHERE type=\'foundation\' AND status=1;'
)
doc.add_paragraph()

# ══════════════════════════════════════════════════════════════════════════════
# CHECKLIST
# ══════════════════════════════════════════════════════════════════════════════
doc.add_page_break()
doc.add_heading('4. Checklist cuối', 1)
add_table(doc,
    ['TC', 'Mô tả', 'Kết quả', 'Ghi chú'],
    [
        ['TC-01', 'Pending txs đúng: partner/commission×2/foundation/net_revenue', '☐', ''],
        ['TC-02', 'wallet_c cộng đúng, notifications đầy đủ', '☐', ''],
        ['TC-03', 'wallet_c hoàn đúng khi payment fail', '☐', ''],
        ['TC-04', 'History chỉ hiện transactions của chính user', '☐', ''],
        ['TC-05', 'wallet_c bị trừ ngay khi request withdraw', '☐', ''],
        ['TC-06', 'Approve withdraw: chỉ đổi status, không cộng thêm', '☐', ''],
        ['TC-07', 'Reject withdraw: hoàn wallet_c', '☐', ''],
        ['TC-08', 'Admin approve commission thủ công đúng', '☐', ''],
        ['TC-09', 'commission_rate=-1: không có point txs, vẫn có net_revenue', '☐', ''],
        ['TC-10', 'Item override commission_rate được ưu tiên', '☐', ''],
        ['TC-11', 'company_commission JSON override từng rate', '☐', ''],
        ['TC-12', 'Audit SQL chỉ đếm wallet-affecting types', '☐', ''],
        ['TC-13', 'Audit phát hiện sai lệch và notify admin', '☐', ''],
        ['TC-14', 'Cron job đăng ký khi app khởi động', '☐', ''],
        ['TC-15', 'Trang Tài chính: 6 KPI khớp với DB', '☐', ''],
    ],
    col_widths=[0.8, 3.5, 1, 1.2]
)

# Save
out = '/Users/I762313/projects/personal/anylearn/scripts/anypoint_test_cases.docx'
doc.save(out)
print(f'Saved: {out}')
