// Napas BIN codes of the common banks (same list as the BANKS in the CLR project and in CLAUDE.md)
export const BANKS = [
  { bin: '970416', name: 'ACB' },
  { bin: '970405', name: 'Agribank' },
  { bin: '970454', name: 'Bản Việt (VietCapital)' },
  { bin: '970418', name: 'BIDV' },
  { bin: '970431', name: 'Eximbank' },
  { bin: '970437', name: 'HDBank' },
  { bin: '970449', name: 'LPBank' },
  { bin: '970422', name: 'MB Bank' },
  { bin: '970426', name: 'MSB' },
  { bin: '970448', name: 'OCB' },
  { bin: '970403', name: 'Sacombank' },
  { bin: '970429', name: 'SCB' },
  { bin: '970440', name: 'SeABank' },
  { bin: '970443', name: 'SHB' },
  { bin: '970407', name: 'Techcombank' },
  { bin: '970423', name: 'TPBank' },
  { bin: '970441', name: 'VIB' },
  { bin: '970415', name: 'VietinBank' },
  { bin: '970436', name: 'Vietcombank' },
  { bin: '970432', name: 'VPBank' },
]

export function bankOptions(currentBin, currentName) {
  const options = BANKS.map(bank => ({ value: bank.bin, label: `${bank.name} (${bank.bin})` }))
  const known = !currentBin || BANKS.some(bank => bank.bin === currentBin)
  return known ? options : [{ value: currentBin, label: `${currentName || 'Ngân hàng khác'} (${currentBin})` }, ...options]
}

export function bankNameOf(bin, fallback = '') {
  return BANKS.find(bank => bank.bin === bin)?.name ?? fallback
}
