import { authFetch } from './client'
import type { Energy, QuizPack } from './quiz'
import type { StickerView } from './stickers'

export type ShopGame = 'quiz' | 'sticker'
export type ShopKind = 'item' | 'pack' | 'energy' | 'chest'

/** One thing the Leo Xu shop sells. `price` is null for a pack that depends on the level (see `levelPrices`). */
export interface ShopEntry {
  key: string
  game: ShopGame
  gameLabel: string
  kind: ShopKind
  label: string
  description: string
  price: number | null
  enabled: boolean
  dailyCap: number | null
  /** Purchases left today under the daily limit. */
  left: number | null
  link: string
  linkLabel: string
  /** Quiz items only: copies held and the stock cap. */
  qty?: number
  stockCap?: number
  needsDifficulty?: boolean
  levelPrices?: number[]
}

export interface SellSticker {
  id: number
  name: string
  emoji: string | null
  image: string | null
  rarity: 'common' | 'rare' | 'epic'
  rarityLabel: string
  qty: number
  /** Duplicates Leo can take now (the first copy and locked copies stay with the player). */
  sellable: number
  price: number
}

export interface SellItem { key: string; label: string; qty: number; price: number }

export interface ShopSell {
  stickers: SellSticker[]
  items: SellItem[]
  stickerEnabled: boolean
  itemEnabled: boolean
  stickerLeft: number
  itemLeft: number
  stickerCap: number
  itemCap: number
}

export interface Shop {
  enabled: boolean
  coinName: string
  coins: number
  items: ShopEntry[]
  levelLabels: Record<string, string>
  sell: ShopSell
  energy: Energy
}

export interface BuyResult {
  coins: number
  coinName: string
  message: string
  pack?: QuizPack
  sticker?: StickerView
  energy?: Energy
}

export interface SellResult {
  coins: number
  coinName: string
  message: string
  earned: number
  sell: ShopSell
}

export const getShop = (token: string) => authFetch<Shop>('/shop', token)

export const buyShopEntry = (token: string, key: string, difficulty?: number | null) =>
  authFetch<BuyResult>('/shop/buy', token, { method: 'POST', body: JSON.stringify({ key, difficulty: difficulty ?? undefined }) })

export const sellToLeo = (token: string, kind: 'sticker' | 'item', id: string | number) =>
  authFetch<SellResult>('/shop/sell', token, { method: 'POST', body: JSON.stringify({ kind, id: String(id) }) })
