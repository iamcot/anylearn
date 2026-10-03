'use client'

export interface PaymentMethod {
  value: string
  label: string
}

const BASE: PaymentMethod[] = [
  { value: 'bank_transfer', label: 'Chuyển khoản ngân hàng hoặc thanh toán tại trường' },
  { value: 'card', label: 'Thanh toán trực tuyến bằng thẻ' },
  { value: 'vnpay', label: 'Quét mã QR qua VNPay (giảm 1%) (trên 100 triệu)' },
]

export function getPaymentMethods(total: number): PaymentMethod[] {
  const methods = [...BASE]
  if (total >= 1_000 && total <= 50_000_000)
    methods.push({ value: 'momo', label: 'Thanh toán bằng ví MoMo' })
  if (total >= 3_000_000)
    methods.push({ value: 'installment', label: 'Trả góp qua thẻ tín dụng (trên 3 triệu) (kỳ hạn 3 tháng) (0% lãi suất)' })
  return methods
}

interface Props {
  total: number
  value: string
  onChange: (method: string) => void
  name?: string
}

export default function PaymentMethodSelector({ total, value, onChange, name = 'payment' }: Props) {
  const methods = getPaymentMethods(total)
  return (
    <>
      {methods.map(m => (
        <label key={m.value} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, cursor: 'pointer' }}>
          <input type="radio" name={name} value={m.value} checked={value === m.value}
            onChange={() => onChange(m.value)} style={{ accentColor: '#00a651' }} />
          <span style={{ fontSize: 15, color: '#17212f', lineHeight: 1.4 }}>{m.label}</span>
        </label>
      ))}
    </>
  )
}
