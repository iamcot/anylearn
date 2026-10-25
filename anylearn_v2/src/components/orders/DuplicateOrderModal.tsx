'use client'

import Link from 'next/link'
import Modal from '@/components/Modal'
import { formatExactPrice } from '@/lib/format/price'
import type { PendingOrder } from '@/lib/api/orders'

export default function DuplicateOrderModal({ order, onCreateNew, onClose }: {
  order: PendingOrder
  onCreateNew: () => void
  onClose: () => void
}) {
  return (
    <Modal title="Bạn đã có đơn chờ thanh toán" onClose={onClose}>
      <p className="m-0 text-sm text-text">
        Bạn đã có đơn <strong>#{order.orderId}</strong> ({formatExactPrice(order.amount)}) cho khóa này và chưa thanh toán.
        Tiếp tục thanh toán đơn cũ để không bị giữ chỗ hai lần.
      </p>
      <div className="mt-5 flex flex-col gap-2.5">
        <Link href={`/order/${order.orderId}`} className="btn btn--green w-full no-underline">Tiếp tục thanh toán</Link>
        <button type="button" onClick={onCreateNew} className="btn btn--outline w-full">Tạo đơn mới</button>
      </div>
    </Modal>
  )
}
