import { describe, expect, it } from 'vitest'
import { buildVietQrPayload, crc16, orderTransferNote, sanitizeTransferNote } from '@/lib/vietqr/payload'

interface Field { id: string; value: string }

function readFields(text: string): Field[] {
  const fields: Field[] = []
  let index = 0
  while (index < text.length) {
    const length = Number(text.slice(index + 2, index + 4))
    fields.push({ id: text.slice(index, index + 2), value: text.slice(index + 4, index + 4 + length) })
    index += 4 + length
  }
  return fields
}

const SAMPLE = { bankBin: '970422', accountNo: '0123456789', amount: 100000, addInfo: 'ALQR1234' }

describe('crc16', () => {
  it('matches the CRC-16/CCITT-FALSE check value', () => {
    expect(crc16('123456789')).toBe('29B1')
  })
})

describe('buildVietQrPayload', () => {
  const payload = buildVietQrPayload(SAMPLE)
  const fields = readFields(payload)
  const byId = (id: string) => fields.find(field => field.id === id)?.value

  it('has every field of a VietQR transfer to an account', () => {
    expect(fields.map(field => field.id)).toEqual(['00', '01', '38', '53', '54', '58', '62', '63'])
    expect(byId('01')).toBe('12')
    expect(byId('53')).toBe('704')
    expect(byId('54')).toBe('100000')
    expect(byId('58')).toBe('VN')
    expect(byId('62')).toBe('0808ALQR1234')
  })

  it('keeps bank BIN and account number inside field 38', () => {
    const merchant = readFields(byId('38') ?? '')
    expect(merchant.find(field => field.id === '00')?.value).toBe('A000000727')
    expect(merchant.find(field => field.id === '02')?.value).toBe('QRIBFTTA')
    const consumer = readFields(merchant.find(field => field.id === '01')?.value ?? '')
    expect(consumer).toEqual([
      { id: '00', value: '970422' },
      { id: '01', value: '0123456789' },
    ])
  })

  it('ends with a CRC that matches everything before it', () => {
    expect(payload.slice(-8, -4)).toBe('6304')
    expect(payload.slice(-4)).toBe(crc16(payload.slice(0, -4)))
  })

  it('rejects bad input', () => {
    expect(() => buildVietQrPayload({ ...SAMPLE, bankBin: '97042' })).toThrow()
    expect(() => buildVietQrPayload({ ...SAMPLE, accountNo: '12 34' })).toThrow()
    expect(() => buildVietQrPayload({ ...SAMPLE, amount: 0 })).toThrow()
    expect(() => buildVietQrPayload({ ...SAMPLE, amount: 1.5 })).toThrow()
  })
})

describe('transfer note', () => {
  it('drops accents and symbols and cuts to the limit', () => {
    expect(sanitizeTransferNote('Nộp phạt – Đạt!')).toBe('Nop phat Dat')
    expect(sanitizeTransferNote('A'.repeat(40))).toHaveLength(25)
  })

  it('builds the note of an order without padding', () => {
    expect(orderTransferNote(1234)).toBe('ALQR1234')
    expect(orderTransferNote('7')).toBe('ALQR7')
  })

  it('keeps an order note unchanged', () => {
    expect(sanitizeTransferNote('ALQR42')).toBe('ALQR42')
  })
})
