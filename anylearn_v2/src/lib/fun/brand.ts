export const MASCOT_NAME = 'Leo'

export interface BrandPart { text: string; brand: boolean }

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Cuts a text into plain parts and brand parts: the mascot name and the game currency ("Leo", "Leo Xu" and the name the back
 * office set) are always shown bold in the brand green, so every screen finds them the same way.
 */
export function splitBrand(text: string, coinName?: string): BrandPart[] {
  const names = [...new Set([coinName, `${MASCOT_NAME} Xu`, MASCOT_NAME].filter((n): n is string => !!n))].sort((a, b) => b.length - a.length)
  const pattern = new RegExp(`(?<![\\p{L}])(${names.map(escape).join('|')})(?![\\p{L}])`, 'gu')
  return text.split(pattern).filter(part => part !== '').map(part => ({ text: part, brand: names.includes(part) }))
}
