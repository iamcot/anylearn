import { ORDER_TRANSFER_PREFIX, TRANSFER_NOTE_MAX_LENGTH } from '@/config/payment'

export interface VietQrInput {
  bankBin: string
  accountNo: string
  amount: number
  addInfo: string
}

const NAPAS_GUID = 'A000000727'
const SERVICE_TO_ACCOUNT = 'QRIBFTTA'
const COUNTRY_CODE = 'VN'
const CURRENCY_VND = '704'
const CRC_POLYNOMIAL = 0x1021
const CRC_INIT = 0xffff
const MAX_AMOUNT_DIGITS = 13

function tlv(id: string, value: string): string {
  return `${id}${String(value.length).padStart(2, '0')}${value}`
}

// CRC-16/CCITT-FALSE: polynomial 0x1021, start 0xFFFF; 4 upper-case hex characters
export function crc16(text: string): string {
  let crc = CRC_INIT
  for (const char of text) {
    crc ^= char.charCodeAt(0) << 8
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? ((crc << 1) ^ CRC_POLYNOMIAL) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

// Many banks cut or change accents and symbols, so only plain letters, digits and spaces are kept
export function sanitizeTransferNote(note: string): string {
  return note
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, TRANSFER_NOTE_MAX_LENGTH)
}

// Transfer note of an order, e.g. 'ALQR42'. The order API returns the same value as `transferNote`; this is the
// fallback while the backend is older than the frontend, so keep it identical to TransferNote.forOrder.
export function orderTransferNote(orderId: string | number): string {
  return `${ORDER_TRANSFER_PREFIX}${orderId}`
}

// VietQR string for a transfer to an account (Napas 247) with amount and note filled in
export function buildVietQrPayload({ bankBin, accountNo, amount, addInfo }: VietQrInput): string {
  if (!/^\d{6}$/.test(bankBin)) throw new Error('Bank BIN must be 6 digits')
  if (!/^[0-9A-Za-z]{4,19}$/.test(accountNo)) throw new Error('Invalid account number')
  if (!Number.isInteger(amount) || amount <= 0 || String(amount).length > MAX_AMOUNT_DIGITS) {
    throw new Error('Invalid amount')
  }
  const consumer = tlv('00', bankBin) + tlv('01', accountNo)
  const merchantInfo = tlv('00', NAPAS_GUID) + tlv('01', consumer) + tlv('02', SERVICE_TO_ACCOUNT)
  const note = sanitizeTransferNote(addInfo)
  const body =
    tlv('00', '01') +
    tlv('01', '12') +
    tlv('38', merchantInfo) +
    tlv('53', CURRENCY_VND) +
    tlv('54', String(amount)) +
    tlv('58', COUNTRY_CODE) +
    (note ? tlv('62', tlv('08', note)) : '') +
    '6304'
  return body + crc16(body)
}
