/** One sentence for the family offer, shared by the rewards page and the suggestion card (plan 06.5 / 08.5). */
export function familyOfferLine(percent: number, windowDays: number): string {
  return `Bé thứ hai trở đi giảm ${percent}% khi đăng ký trong ${windowDays} ngày sau bé đầu tiên.`
}

/** Short chip on a suggestion card; empty when the child gets no family offer. */
export function familyChip(percent?: number | null): string {
  return percent && percent > 0 ? `Giảm ${percent}% ưu đãi gia đình` : ''
}
