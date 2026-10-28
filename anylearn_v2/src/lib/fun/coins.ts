/** Labels of the sources written in `fun_coin_ledger`; an unknown source shows as it is. */
export const COIN_SOURCE_LABEL: Record<string, string> = {
  checkin: 'Quà điểm danh',
  sticker_set: 'Thưởng đủ bộ sticker',
  admin: 'Điều chỉnh',
  quiz_rank: 'Thưởng lên hạng Leo rank',
  quiz_item: 'Mua vật phẩm Leo rank',
  shop_pack: 'Mua gói tập luyện',
  shop_energy: 'Nạp năng lượng',
  shop_chest: 'Mua rương sticker',
  shop_sell: 'Bán cho Leo',
  mission: 'Thưởng nhiệm vụ tuần',
  share: 'Thưởng chia sẻ thành tích',
  invite: 'Thưởng mời bạn',
}

export function coinSourceLabel(source: string): string {
  return COIN_SOURCE_LABEL[source] ?? source
}

export function pageCount(total: number, size: number): number {
  return Math.max(1, Math.ceil(total / Math.max(1, size)))
}
