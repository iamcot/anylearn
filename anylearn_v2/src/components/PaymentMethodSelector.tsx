'use client'

import { useEffect, useState } from 'react'
import RadioOption from '@/components/RadioOption'
import { useAuth } from '@/context/AuthContext'
import { getPaymentMethods as fetchPaymentMethods } from '@/lib/api/orders'

export interface PaymentMethod {
  value: string
  label: string
}

// Used until the list from the back office arrives, and when it cannot be loaded.
const BASE: PaymentMethod[] = [
  { value: 'bank_transfer', label: 'Chuyển khoản ngân hàng hoặc thanh toán tại trường' },
  { value: 'card', label: 'Thanh toán trực tuyến bằng thẻ' },
  { value: 'vnpay', label: 'Quét mã QR qua VNPay' },
]

export function getPaymentMethods(total: number): PaymentMethod[] {
  const methods = [...BASE]
  if (total >= 1_000 && total <= 50_000_000)
    methods.push({ value: 'momo', label: 'Thanh toán bằng ví MoMo' })
  if (total >= 3_000_000)
    methods.push({ value: 'installment', label: 'Trả góp 0% lãi suất qua thẻ tín dụng, kỳ hạn 3 tháng' })
  return methods
}

interface Props {
  total: number
  value: string
  onChange: (method: string) => void
  name?: string
}

/** The methods the team switched on in the back office (installment only from its minimum total); the pick moves to the first one if the current one is not offered. */
export default function PaymentMethodSelector({ total, value, onChange, name = 'payment' }: Props) {
  const { token } = useAuth()
  const [fromServer, setFromServer] = useState<PaymentMethod[] | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    fetchPaymentMethods(total, token).then(list => { if (!cancelled) setFromServer(list) })
    return () => { cancelled = true }
  }, [total, token])

  const methods = fromServer ?? getPaymentMethods(total)

  useEffect(() => {
    if (fromServer && !fromServer.some(method => method.value === value)) onChange(fromServer[0].value)
  }, [fromServer, value, onChange])

  return (
    <div className="flex flex-col gap-2.5">
      {methods.map(method => (
        <RadioOption key={method.value} name={name} checked={value === method.value} onChange={() => onChange(method.value)} label={method.label} />
      ))}
    </div>
  )
}
