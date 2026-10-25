'use client'

import RadioOption from '@/components/RadioOption'

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
  return (
    <div className="flex flex-col gap-2.5">
      {getPaymentMethods(total).map(method => (
        <RadioOption key={method.value} name={name} checked={value === method.value} onChange={() => onChange(method.value)} label={method.label} />
      ))}
    </div>
  )
}
