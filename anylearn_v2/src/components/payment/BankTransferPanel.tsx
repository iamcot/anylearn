'use client'

import CopyButton from '@/components/CopyButton'
import { buildVietQrPayload } from '@/lib/vietqr/payload'
import { formatExactPrice } from '@/lib/format/price'
import type { BankInfo } from '@/lib/api'
import { QR_IMAGE_SIZE_PX, saveQrImage, useQrImage } from './useQrImage'

interface Props {
  note: string
  amount: number
  bank: BankInfo
}

function InfoRow({ label, value, copyText }: { label: string; value: string; copyText?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <p className="m-0 text-xs text-muted">{label}</p>
        <p className="m-0 break-words font-semibold text-ink">{value}</p>
      </div>
      {copyText && <CopyButton text={copyText} />}
    </div>
  )
}

function buildPayload(bank: BankInfo, amount: number, note: string): string | null {
  if (!bank.bankBin || !bank.accountNumber || amount <= 0) return null
  try {
    return buildVietQrPayload({ bankBin: bank.bankBin, accountNo: bank.accountNumber, amount, addInfo: note })
  } catch {
    return null
  }
}

export default function BankTransferPanel({ note, amount, bank }: Props) {
  const qrImage = useQrImage(buildPayload(bank, amount, note))
  const hasAmount = amount > 0

  return (
    <section className="mb-6 rounded-card border border-blue-line bg-white p-5 text-left">
      <h3 className="m-0 mb-4 text-base font-extrabold text-blue">Chuyển khoản ngân hàng</h3>

      <div className="grid gap-5 md:grid-cols-[minmax(0,260px)_1fr] md:items-start">
        {qrImage && (
          <div className="text-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- QR generated in the browser as a data URL */}
            <img src={qrImage} alt="Mã VietQR thanh toán đơn hàng" width={QR_IMAGE_SIZE_PX} height={QR_IMAGE_SIZE_PX}
              className="mx-auto w-full max-w-64 rounded-xl border border-line" />
            <button type="button" onClick={() => void saveQrImage(qrImage, `anylearn-${note}.png`)}
              className="mt-3 min-h-11 cursor-pointer rounded-full border border-blue bg-white px-5 text-sm font-semibold text-blue">
              Lưu ảnh QR
            </button>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <InfoRow label={bank.bankName || 'Ngân hàng'} value={bank.accountNumber} copyText={bank.accountNumber} />
          <InfoRow label="Chủ tài khoản" value={bank.accountName} />
          {hasAmount && <InfoRow label="Số tiền" value={formatExactPrice(amount)} copyText={String(amount)} />}
          <InfoRow label="Nội dung chuyển khoản (giữ nguyên)" value={note} copyText={note} />
        </div>
      </div>

      <p className="m-0 mt-4 text-sm leading-relaxed text-text">
        Đơn hàng tự được xác nhận khi tiền về, trang này tự cập nhật không cần tải lại.
      </p>
      {bank.zaloPhone && (
        <>
          <p className="m-0 mt-3 text-sm leading-relaxed text-text">
            Nếu quý khách thanh toán trực tiếp tại quầy, vui lòng chụp biên lai và gửi qua Zalo anyLEARN để được xác nhận đơn.
          </p>
          <p className="m-0 mt-2 text-sm text-muted">
            Cần hỗ trợ thêm? Liên hệ anyLEARN qua Zalo: <strong>{bank.zaloPhone}</strong>
          </p>
        </>
      )}
    </section>
  )
}
