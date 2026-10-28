import type { Energy, PackType, QuizPack } from '@/lib/api/quiz'
import type { ShopEntry, ShopGame } from '@/lib/api/shop'

export type ShopTab = 'buy' | 'sell' | 'history'

export const SHOP_TABS: { key: ShopTab; label: string }[] = [
  { key: 'buy', label: 'Mua' },
  { key: 'sell', label: 'Bán' },
  { key: 'history', label: 'Lịch sử' },
]

/** The tab named in `?tab=`; anything else opens "Mua". */
export function shopTabFromQuery(value: string | null | undefined): ShopTab {
  return value === 'sell' || value === 'history' ? value : 'buy'
}

/** `?game=` narrows the buy tab to one game (the shortcut inside a game); anything else shows every game. */
export function gameFromQuery(value: string | null | undefined): ShopGame | null {
  return value === 'quiz' || value === 'sticker' ? value : null
}

const GAME_ORDER: ShopGame[] = ['quiz', 'sticker']
const GAME_TITLE: Record<ShopGame, string> = { quiz: 'Leo rank', sticker: 'Sticker' }

export interface ShopGroup { game: ShopGame; title: string; entries: ShopEntry[] }

/** The catalog grouped by game in a fixed order; a game with nothing to sell is left out. `only` keeps one game. */
export function groupByGame(entries: ShopEntry[], only: ShopGame | null = null): ShopGroup[] {
  return GAME_ORDER
    .filter(game => !only || game === only)
    .map(game => ({ game, title: GAME_TITLE[game], entries: entries.filter(e => e.game === game) }))
    .filter(group => group.entries.length > 0)
}

/** Entries sold inside the Leo rank lobby: items and training packs (energy has its own "+" button). */
export function lobbyEntries(entries: ShopEntry[]): ShopEntry[] {
  return entries.filter(e => e.game === 'quiz' && (e.kind === 'item' || e.kind === 'pack'))
}

/** The price shown for an entry; a level based pack shows "từ X" until a level is chosen. */
export function priceOf(entry: ShopEntry, difficulty: number | null): number | null {
  if (entry.price !== null) return entry.price
  const prices = entry.levelPrices ?? []
  if (difficulty && prices[difficulty - 1] !== undefined) return prices[difficulty - 1]
  return prices.length > 0 ? Math.min(...prices) : null
}

/** Why an entry cannot be bought right now, or null when it can. */
export function buyProblem(entry: ShopEntry, coins: number, difficulty: number | null): string | null {
  if (!entry.enabled) return 'Tạm ngừng bán'
  if (entry.needsDifficulty && !difficulty) return 'Chọn cấp độ'
  if (entry.left !== null && entry.left <= 0) return 'Hết lượt hôm nay'
  if (entry.stockCap !== undefined && (entry.qty ?? 0) >= entry.stockCap) return 'Kho đầy'
  const price = priceOf(entry, difficulty)
  if (price !== null && coins < price) return 'Chưa đủ xu'
  return null
}

// ---------------------------------------------------------------- energy

/** mm:ss for a countdown in seconds. */
export function countdown(seconds: number): string {
  const s = Math.max(Math.floor(seconds), 0)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

/**
 * The bar `elapsedSeconds` after it was read from the server: the points that came back meanwhile and the seconds to the next one.
 * The server stays the judge (a ranked question asks it again), this only keeps the screen moving.
 */
export function tickEnergy(energy: Energy, elapsedSeconds: number): { value: number; nextInSeconds: number } {
  if (energy.value >= energy.max || energy.nextInSeconds <= 0) return { value: Math.min(energy.value, energy.max), nextInSeconds: 0 }
  const elapsed = Math.max(elapsedSeconds, 0)
  if (elapsed < energy.nextInSeconds) return { value: energy.value, nextInSeconds: energy.nextInSeconds - elapsed }
  const step = Math.max(energy.regenMinutes, 1) * 60
  const over = elapsed - energy.nextInSeconds
  const value = Math.min(energy.value + 1 + Math.floor(over / step), energy.max)
  return { value, nextInSeconds: value >= energy.max ? 0 : step - (over % step) }
}

/** "23/30 · +1 sau 03:12", or just "30/30" when full. */
export function energyLine(value: number, max: number, nextInSeconds: number): string {
  return nextInSeconds > 0 && value < max ? `${value}/${max} · +1 sau ${countdown(nextInSeconds)}` : `${value}/${max}`
}

/** Share of the bar that is full (0..100). */
export function energyPercent(value: number, max: number): number {
  return max <= 0 ? 0 : Math.min(Math.max((value / max) * 100, 0), 100)
}

// ---------------------------------------------------------------- training packs

/** "Gói cấp Khó", "Gói chủ đề Toán", "Gói Toán · Khó" for a pack card. */
export function packTitle(pack: QuizPack): string {
  const topic = pack.topicLabels.length === 1 ? pack.topicLabels[0] : null
  if (pack.type === 'level') return `Gói cấp ${pack.difficultyLabel ?? ''}`.trim()
  if (pack.type === 'topic') return topic ? `Gói chủ đề ${topic}` : 'Gói theo chủ đề'
  return topic ? `Gói ${topic} · ${pack.difficultyLabel ?? ''}`.trim() : `Gói chủ đề + cấp ${pack.difficultyLabel ?? ''}`.trim()
}

/** What the pack covers: the topics a level pack was set to, or a reminder to choose one. */
export function packScope(pack: QuizPack): string {
  if (pack.type === 'level') return pack.topicLabels.length === 0 ? 'Mọi chủ đề' : pack.topicLabels.join(', ')
  return pack.configured ? pack.topicLabels.join(', ') : 'Chưa chọn chủ đề'
}

export function remainingText(pack: Pick<QuizPack, 'remaining' | 'total'>): string {
  return `Còn ${pack.remaining}/${pack.total} câu`
}

/** A level pack may cover many topics; the other two cover exactly one. */
export function packIsMulti(type: PackType): boolean {
  return type === 'level'
}

/** The topics ticked when the option panel of a pack opens: what was saved, else every topic (level pack) or the first one. */
export function initialTopics(pack: QuizPack, allKeys: string[]): string[] {
  if (pack.topics && pack.topics.length > 0) return pack.topics
  return packIsMulti(pack.type) ? allKeys : allKeys.slice(0, 1)
}

/** Ticks or unticks a topic: many for a level pack, always exactly one for the others. A level pack keeps at least one. */
export function toggleTopic(type: PackType, selected: string[], key: string): string[] {
  if (!packIsMulti(type)) return [key]
  if (selected.includes(key)) return selected.length > 1 ? selected.filter(k => k !== key) : selected
  return [...selected, key]
}

/** What goes to the server for "Lưu": a level pack with every topic ticked sends none (= all). */
export function topicsToSave(type: PackType, selected: string[], allKeys: string[]): string[] {
  if (packIsMulti(type) && selected.length >= allKeys.length) return []
  return selected
}

export function canSavePack(type: PackType, selected: string[]): boolean {
  return packIsMulti(type) ? selected.length >= 1 : selected.length === 1
}
