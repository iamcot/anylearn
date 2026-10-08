# AnyPoint Smoke Test Cases

## Cấu hình hiện tại (bảng `configurations`)

| Key | Value | Ý nghĩa |
|---|---|---|
| `bonus_rate` | 1000 | 1 anyPoint = 1.000 VND |
| `discount` | 0.1 | Người mua nhận 10% phần hệ thống |
| `commission` | 0.2 | Mỗi cấp referral nhận 20% phần hệ thống |
| `bonus_foundation` | 0.05 | Quỹ vận hành 5% phần hệ thống |
| `friend_tree` | 2 | Tối đa 2 cấp referral |
| `bonus_ref_seller` | *(không có)* | Mặc định 0 — không có thưởng ref-seller |

**Công thức** (với giá `P`, tỉ lệ đối tác `R`):
```
authorPoints       = floor(P × R / 1000)
buyerPoints        = round(P × (1-R) × 0.1 / 1000)
referralPoints     = round(P × (1-R) × 0.2 / 1000)   // mỗi cấp
foundationPoints   = round(P × (1-R) × 0.05 / 1000)  // anyPoints, accounting only
companyRevenueVnd  = P - (authorPoints + buyerPoints + Σreferral + foundation) × 1000  // VND
```
> `foundation` và `net_revenue` là accounting-only — duyệt cùng lúc với các loại khác nhưng **không credit wallet_c**.
> `commission_rate=-1`: không phân phối điểm nào, `companyRevenueVnd = P` (công ty giữ toàn bộ).

---

## Setup dữ liệu test

Trước khi test, chuẩn bị các user sau (tạo hoặc dùng user có sẵn):

| Role | Mô tả | Cần thiết cho |
|---|---|---|
| **Admin** | user có `role='admin'` | Duyệt đơn, xem transactions |
| **Partner A** | `role='school'`, `commission_rate=0.20` | Chủ khóa học TC-01..08 |
| **Partner B** | `role='school'`, `commission_rate=0.60` | TC-07 item override |
| **Buyer** | `role='student'`, `user_id = Referrer.id` | Người mua |
| **Referrer** | `role='student'`, `user_id = null` | Cấp 1 referral |
| **Item A** | Của Partner A, `price=186000`, `commission_rate=null` | TC-01..06 |
| **Item B** | Của Partner B, `commission_rate=-1` | TC-09 |
| **Item C** | Của Partner B, `commission_rate=0.40` (override) | TC-10 |

---

## TC-01 — Đặt hàng tạo pending commissions đúng

**Mục đích:** Verify công thức phân phối anyPoint khi checkout.

**Dữ liệu:** Item A (186.000đ), Partner A (R=0.20), Buyer có 1 cấp referral.

**Tính toán kỳ vọng:**
```
authorPoints      = floor(186000 × 0.20 / 1000) = floor(37.2)        = 37
buyerPoints       = round(186000 × 0.80 × 0.10 / 1000) = round(14.88) = 15
referralPoints    = round(186000 × 0.80 × 0.20 / 1000) = round(29.76) = 30
foundationPoints  = round(186000 × 0.80 × 0.05 / 1000) = round(7.44)  = 7
companyRevenueVnd = 186000 - (37 + 15 + 30 + 7) × 1000               = 97.000 VND
```

**Bước thực hiện:**
1. Login Buyer → `POST /v2/api/login`
2. Thêm Item A vào giỏ → `POST /v2/api/cart/add`
3. Checkout → `POST /v2/api/checkout` body `{ "paymentMethod": "bank_transfer" }`
4. Ghi lại `orderId` trả về

**Verify DB:**
```sql
-- Lấy order_detail ID
SELECT id FROM order_details WHERE order_id = {orderId};

-- Kiểm tra pending transactions tạo ra
SELECT type, amount, pay_method, status, user_id
FROM transactions
WHERE order_id = {detailId}
ORDER BY id;
```

**Kết quả kỳ vọng:**

| type | amount | pay_method | status | user_id |
|---|---|---|---|---|
| `partner` | 37 | wallet_c | 0 | Partner A |
| `commission` | 15 | wallet_c | 0 | Buyer |
| `commission` | 30 | wallet_c | 0 | Referrer |
| `foundation` | 7 | wallet_c | 0 | Buyer |
| `net_revenue` | 97000 | company | 0 | Buyer |

**Lưu ý:** Tất cả đều `status=0`. `foundation` và `net_revenue` approved cùng lúc nhưng **không cộng wallet_c** — chỉ là bút toán kiểm toán nội bộ.

**Wallet_c KHÔNG thay đổi ở bước này** (chưa duyệt):
```sql
SELECT wallet_c FROM users WHERE id IN ({partnerAId}, {buyerId}, {referrerId});
-- Tất cả giữ nguyên giá trị cũ
```

---

## TC-02 — Admin duyệt đơn → wallet_c được cộng

**Điều kiện:** Đã chạy TC-01, có `orderId`.

**Bước thực hiện:**
1. Login Admin → `POST /v2/admin/login`
2. Duyệt đơn → `POST /v2/admin/orders/{orderId}/approve` (hoặc qua trang Orders admin)

**Verify DB:**
```sql
-- Trạng thái đơn hàng
SELECT status FROM orders WHERE id = {orderId};
-- Kỳ vọng: 'delivered'

-- Transactions đã được approve
SELECT type, amount, status FROM transactions WHERE order_id = {detailId};
-- Kỳ vọng: partner + commission đều status=1

-- Wallet_c cộng đúng
SELECT id, name, wallet_c FROM users WHERE id IN ({partnerAId}, {buyerId}, {referrerId});
-- Partner A:  wallet_c tăng thêm 37
-- Buyer:      wallet_c tăng thêm 15
-- Referrer:   wallet_c tăng thêm 30
```

**Verify thông báo:**
```sql
SELECT type, title, content FROM notifications
WHERE user_id IN ({partnerAId}, {buyerId}, {referrerId})
ORDER BY id DESC LIMIT 3;
-- Kỳ vọng: mỗi người nhận 1 notif "Nhận anyPoint"

SELECT type, title FROM notifications
WHERE user_id = {adminId} ORDER BY id DESC LIMIT 1;
-- Kỳ vọng: notif "Đơn hàng thanh toán thành công"
```

---

## TC-03 — Thanh toán thất bại → hoàn anyPoint đã dùng

**Mục đích:** User dùng anyPoint lúc checkout, payment fail → phải hoàn lại.

**Điều kiện trước:** Buyer có `wallet_c >= 50` (thêm trực tiếp qua SQL nếu cần).

**Bước thực hiện:**
1. Checkout với `pointsUsed=50` → `POST /v2/api/checkout` body `{ "paymentMethod": "vnpay", "pointsUsed": 50 }`
2. Ghi lại `orderId`
3. Simulate payment fail: reset về NEW (gọi trực tiếp hoặc để timeout)

**Verify ngay sau checkout:**
```sql
-- Exchange tx tạo ra (pending)
SELECT type, amount, status FROM transactions WHERE order_id = {orderId} AND type='exchange';
-- Kỳ vọng: amount=-50, status=0

-- Wallet_c đã bị trừ ngay
SELECT wallet_c FROM users WHERE id = {buyerId};
-- Kỳ vọng: giảm 50 so với trước
```

**Verify sau khi reset/fail:**
```sql
-- Exchange tx bị cancel
SELECT status FROM transactions WHERE order_id = {orderId} AND type='exchange';
-- Kỳ vọng: status=99

-- Wallet_c được hoàn
SELECT wallet_c FROM users WHERE id = {buyerId};
-- Kỳ vọng: trở về giá trị trước checkout
```

---

## TC-04 — User xem lịch sử giao dịch

**Bước thực hiện:**
1. Login Buyer
2. `GET /v2/api/transaction/history?page=0&size=20`

**Kỳ vọng:**
```json
{
  "data": {
    "content": [
      { "type": "commission", "amount": 15, "status": 1 },
      ...
    ]
  }
}
```

**Verify:** Chỉ thấy transactions của chính Buyer, không thấy của Partner hay Referrer.

---

## TC-05 — Partner yêu cầu rút anyPoint

**Điều kiện:** Partner A có `wallet_c >= 100`.

**Bước thực hiện:**
1. Login Partner A
2. Yêu cầu rút → `POST /v2/api/transaction/withdraw`
   ```json
   { "amount": 100, "bankInfo": "Vietcombank 1234567890 Nguyen Van A" }
   ```

**Verify ngay sau request:**
```sql
-- Wallet_c bị trừ ngay (hold)
SELECT wallet_c FROM users WHERE id = {partnerAId};
-- Kỳ vọng: giảm 100

-- Transaction withdraw pending
SELECT type, amount, status, content FROM transactions
WHERE user_id = {partnerAId} AND type='withdraw' ORDER BY id DESC LIMIT 1;
-- Kỳ vọng: amount=-100, status=0
```

---

## TC-06 — Admin duyệt yêu cầu rút tiền

**Điều kiện:** Đã chạy TC-05, có `withdrawTxId`.

**Bước thực hiện:**
1. Login Admin
2. Vào trang Transactions admin, filter `type=withdraw, status=0`
3. Approve → `PUT /v2/admin/transactions/{withdrawTxId}/approve`

**Verify:**
```sql
SELECT status FROM transactions WHERE id = {withdrawTxId};
-- Kỳ vọng: status=1

-- Wallet_c KHÔNG thay đổi thêm (đã trừ ở bước request)
SELECT wallet_c FROM users WHERE id = {partnerAId};
-- Giữ nguyên giá trị sau TC-05
```

---

## TC-07 — Admin từ chối yêu cầu rút tiền → hoàn điểm

**Điều kiện:** Tạo thêm 1 withdraw request (chạy lại TC-05 với amount=50).

**Bước thực hiện:**
1. Login Admin
2. Reject → `PUT /v2/admin/transactions/{withdrawTxId}/reject`

**Verify:**
```sql
SELECT status FROM transactions WHERE id = {withdrawTxId};
-- Kỳ vọng: status=99

-- Wallet_c được hoàn lại
SELECT wallet_c FROM users WHERE id = {partnerAId};
-- Kỳ vọng: tăng thêm 50 so với sau khi request
```

---

## TC-08 — Admin approve transaction commission thủ công

**Mục đích:** Duyệt bằng tay commission đang pending (đơn bank_transfer chưa confirm).

**Điều kiện:** Có commission tx `status=0` từ TC-01.

**Bước thực hiện:**
1. Admin tìm commission tx của Partner A (filter `userId={partnerAId}, type=partner, status=0`)
2. `PUT /v2/admin/transactions/{txId}/approve`

**Verify:**
```sql
SELECT status FROM transactions WHERE id = {txId};
-- Kỳ vọng: 1

SELECT wallet_c FROM users WHERE id = {partnerAId};
-- Kỳ vọng: tăng đúng amount của tx (37)
```

---

## TC-09 — commission_rate = -1 → không tạo point transactions, vẫn có net_revenue

**Điều kiện:** Item B có `commission_rate = -1`.

**Bước thực hiện:**
1. Buyer mua Item B → checkout

**Verify:**
```sql
-- Không có point transactions
SELECT COUNT(*) FROM transactions
WHERE order_id = {detailIdOfItemB}
AND type IN ('partner', 'commission', 'foundation');
-- Kỳ vọng: 0

-- Nhưng vẫn có net_revenue (công ty giữ toàn bộ)
SELECT type, amount FROM transactions
WHERE order_id = {detailIdOfItemB} AND type = 'net_revenue';
-- Kỳ vọng: amount = price của Item B (toàn bộ giá bán)
```

---

## TC-10 — commission_rate override từ item > author

**Điều kiện:** Item C có `commission_rate = 0.40`, thuộc Partner B (`commission_rate=0.60`).

**Tính toán kỳ vọng** với giá 186.000đ, R=0.40 (dùng item override, không phải 0.60):
```
authorPoints = floor(186000 × 0.40 / 1000) = floor(74.4) = 74
buyerPoints  = round(186000 × 0.60 × 0.10 / 1000) = round(11.16) = 11
```

**Bước thực hiện:** Buyer mua Item C → checkout → verify DB như TC-01.

```sql
SELECT type, amount FROM transactions WHERE order_id = {detailIdOfItemC}
AND type IN ('partner', 'commission');
-- partner: 74  (không phải 111 nếu dùng 0.60)
-- commission(buyer): 11
```

---

## TC-11 — company_commission JSON override rates

**Mục đích:** Override `discount` từ JSON trên item thay vì global config.

**Setup:** Cập nhật item A:
```sql
UPDATE items SET company_commission = '{"discount": 0.20, "commission": null}' WHERE id = {itemAId};
```

**Tính toán kỳ vọng** với R=0.20, discount=0.20 (override), commission=0.2 (global):
```
buyerPoints = round(186000 × 0.80 × 0.20 / 1000) = round(29.76) = 30
-- (tăng gấp đôi so với TC-01)
```

**Sau khi test, reset:**
```sql
UPDATE items SET company_commission = NULL WHERE id = {itemAId};
```

---

## TC-12 — Kiểm toán: không có sai lệch

**Điều kiện:** Sau TC-02 (dữ liệu đã approved và wallet_c cập nhật đúng).

**Bước thực hiện:**
1. Admin → Cài đặt → Kiểm toán anyPoint
2. Nhấn "Chạy kiểm toán ngay"

**Kỳ vọng:** Banner xanh lá "Không có sai lệch".

**Verify DB:**
```sql
-- Chỉ cộng types thực sự ảnh hưởng wallet_c (loại trừ foundation + net_revenue)
SELECT u.id, u.wallet_c,
       COALESCE(SUM(CASE WHEN t.type IN ('partner','commission','commission_add','exchange','withdraw')
                         THEN t.amount ELSE 0 END), 0) AS tx_sum,
       u.wallet_c - COALESCE(SUM(CASE WHEN t.type IN ('partner','commission','commission_add','exchange','withdraw')
                                      THEN t.amount ELSE 0 END), 0) AS delta
FROM users u
LEFT JOIN transactions t ON t.user_id = u.id AND t.status = 1
GROUP BY u.id, u.wallet_c
HAVING delta != 0;
-- Kỳ vọng: 0 rows
```

---

## TC-13 — Kiểm toán: phát hiện sai lệch

**Mục đích:** Simulate lỗi bằng cách sửa thẳng DB.

**Setup (tạo sai lệch):**
```sql
UPDATE users SET wallet_c = wallet_c + 999 WHERE id = {partnerAId};
```

**Bước thực hiện:**
1. Nhấn "Chạy kiểm toán ngay"

**Kỳ vọng:** Banner cam, bảng hiện Partner A với Δ=999.

**Verify thông báo admin:**
```sql
SELECT content FROM notifications WHERE user_id = {adminId} ORDER BY id DESC LIMIT 1;
-- Kỳ vọng: content chứa userId và delta của Partner A
```

**Cleanup:**
```sql
UPDATE users SET wallet_c = wallet_c - 999 WHERE id = {partnerAId};
```

---

## TC-14 — Audit tự chạy hàng ngày (smoke)

**Không cần chờ 8h sáng.** Verify cron được register:
```bash
# Xem log khi start app
# Kỳ vọng thấy: "Scheduling: next execution time of 'scheduledAudit'"
grep -i "scheduledAudit\|AuditService" anylearn_backend.log
```

---

## Checklist cuối

- [ ] TC-01: Pending transactions đúng type/amount/status
- [ ] TC-02: wallet_c cộng đúng, notifications đến đủ 3 người + admin
---

## TC-15 — Trang Tài chính: số liệu đúng

**Điều kiện:** Sau TC-02 (có ít nhất 1 đơn hàng delivered).

**Bước thực hiện:**
1. Admin → menu "Tài chính" (`/finance`)
2. Xem 6 KPI cards

**Verify DB:**
```sql
-- Nợ đối tác
SELECT COALESCE(SUM(wallet_c),0) FROM users WHERE role IN ('school','partner','teacher');

-- Ví người dùng
SELECT COALESCE(SUM(wallet_c),0) FROM users WHERE role NOT IN ('school','partner','teacher','admin');

-- Quỹ vận hành (anyPoints)
SELECT COALESCE(SUM(amount),0) FROM transactions WHERE type='foundation' AND status=1;

-- Doanh thu ròng công ty (VND)
SELECT COALESCE(SUM(amount),0) FROM transactions WHERE type='net_revenue' AND status=1;

-- Chờ phê duyệt
SELECT COALESCE(SUM(amount),0) FROM transactions WHERE type IN ('partner','commission') AND status=0;
```

Kỳ vọng: từng số trên UI khớp với query DB tương ứng.

---

## Checklist cuối

- [ ] TC-01: Pending transactions đúng type/amount/status (5 loại: partner/commission×2/foundation/net_revenue)
- [ ] TC-02: wallet_c cộng đúng, notifications đầy đủ
- [ ] TC-03: wallet_c hoàn đúng khi payment fail
- [ ] TC-04: History chỉ hiện transactions của chính user
- [ ] TC-05: wallet_c bị trừ ngay khi request withdraw
- [ ] TC-06: Approve withdraw → chỉ đổi status, không cộng thêm
- [ ] TC-07: Reject withdraw → hoàn wallet_c
- [ ] TC-08: Admin approve commission thủ công → wallet_c đúng
- [ ] TC-09: commission_rate=-1 → không có point txs nhưng có net_revenue = full price
- [ ] TC-10: Item override commission_rate được ưu tiên
- [ ] TC-11: company_commission JSON override từng rate
- [ ] TC-12: Audit sạch (SQL chỉ đếm wallet-affecting types)
- [ ] TC-13: Audit phát hiện sai lệch và notify admin
- [ ] TC-14: Cron job được đăng ký khi app khởi động
- [ ] TC-15: Trang Tài chính hiện 6 KPI đúng với DB
