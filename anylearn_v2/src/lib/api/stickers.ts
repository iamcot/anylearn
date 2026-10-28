import { authFetch } from './client'

export type Rarity = 'common' | 'rare' | 'epic'

export interface StickerItem {
  id: number
  name: string
  description: string | null
  emoji: string | null
  image: string | null
  rarity: Rarity
  rarityLabel: string
  collectionId: number
  qty: number
  /** Copies that may be traded now (beyond the first, not locked, not listed on the market). */
  tradable: number
  /** Copies promised in open market listings ("Đang rao"). */
  listed: number
}

export type StickerView = Omit<StickerItem, 'qty' | 'tradable' | 'listed' | 'collectionId'> & { collectionId?: number }

export type ListingStatus = 'open' | 'done' | 'cancelled' | 'expired'
export type MarketTab = 'match' | 'all' | 'mine'

export interface MarketOffer extends StickerView {
  /** The viewer does not own this sticker yet. */
  lacking: boolean
}

/** One market post: "Mình có a, b, c, cần x". */
export interface MarketListing {
  id: number
  mine: boolean
  status: ListingStatus
  userName: string
  want: StickerView
  offers: MarketOffer[]
  /** The viewer holds a spare copy of the wanted sticker. */
  canGive: boolean
  /** The viewer lacks an offered sticker and can give the wanted one. */
  canTake: boolean
  expiresAt: string
  createdAt: string
}

export interface MarketPage {
  tab: MarketTab
  items: MarketListing[]
  total: number
  pageSize: number
  openCount: number
  maxListings: number
  listingDays: number
}

/** A collection ("bộ sưu tập") of stickers with the player's progress and the state of its full-set reward. */
export interface StickerCollection {
  id: number
  name: string
  description: string | null
  emoji: string | null
  image: string | null
  /** Leo Xu given once when the player holds every sticker of the collection. */
  rewardPoints: number
  active: boolean
  total: number
  owned: number
  rewardClaimed: boolean
  complete: boolean
}

export interface StickerOffer {
  id: number
  otherName: string
  give: StickerView
  want: StickerView
  expiresAt: string
}

export interface Album {
  enabled: boolean
  collections: StickerCollection[]
  items: StickerItem[]
  total: number
  owned: number
  eligible: boolean
  coinName: string
  pack?: { status: string; part1: boolean; part2: boolean }
  invited: number
  invitedDone: number
  monthCap: number
  incoming: StickerOffer[]
  outgoing: StickerOffer[]
}

export const getAlbum = (token: string) => authFetch<Album>('/stickers', token)

export const sendOffer = (token: string, body: { toPhone: string; giveId: number; wantId: number }) =>
  authFetch<{ id: number; toName: string }>('/stickers/offers', token, { method: 'POST', body: JSON.stringify(body) })

export const acceptOffer = (token: string, id: number) =>
  authFetch<{ tradeId: number; received: StickerView }>(`/stickers/offers/${id}/accept`, token, { method: 'POST' })

export const declineOffer = (token: string, id: number) => authFetch<{ ok: boolean }>(`/stickers/offers/${id}/decline`, token, { method: 'POST' })

export const cancelOffer = (token: string, id: number) => authFetch<{ ok: boolean }>(`/stickers/offers/${id}/cancel`, token, { method: 'POST' })

export const claimSetReward = (token: string, collectionId: number) =>
  authFetch<{ points: number; collection: string }>('/stickers/set-reward', token, { method: 'POST', body: JSON.stringify({ collectionId }) })

export const getMarket = (token: string, tab: MarketTab, page = 1) => authFetch<MarketPage>(`/stickers/market?tab=${tab}&page=${page}`, token)

export const createListing = (token: string, body: { give: number[]; want: number }) =>
  authFetch<{ id: number; expiresAt: string }>('/stickers/market', token, { method: 'POST', body: JSON.stringify(body) })

export const takeListing = (token: string, id: number, stickerId: number) =>
  authFetch<{ tradeId: number; received: StickerView }>(`/stickers/market/${id}/take`, token, { method: 'POST', body: JSON.stringify({ stickerId }) })

export const removeListing = (token: string, id: number) => authFetch<{ ok: boolean }>(`/stickers/market/${id}`, token, { method: 'DELETE' })

export const sendDevice =(token: string, deviceId: string) =>
  authFetch<{ ok: boolean }>('/fun/device', token, { method: 'POST', body: JSON.stringify({ deviceId }) })
