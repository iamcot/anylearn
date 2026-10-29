/** Longest slug kept in a link (same as the server's SeoRules.MAX_SLUG). */
export const MAX_SLUG = 80

/** "Bé học Bơi: 5 tuổi!" → "be-hoc-boi-5-tuoi", the same result as the server's `SeoRules.slug`. Empty text = "bai-viet". */
export function slugify(text: string | null | undefined): string {
  const plain = (text ?? '').replace(/đ/g, 'd').replace(/Đ/g, 'D').normalize('NFD').replace(/\p{M}/gu, '')
  let slug = plain.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  if (slug.length > MAX_SLUG) slug = slug.slice(0, MAX_SLUG).replace(/-+$/, '')
  return slug || 'bai-viet'
}
