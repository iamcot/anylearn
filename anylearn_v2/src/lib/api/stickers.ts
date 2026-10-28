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
  qty: number
  tradable: number
}

export type StickerView = Omit<StickerItem, 'qty' | 'tradable'>

export interface StickerOffer {
  id: number
  otherName: string
  give: StickerView
  want: StickerView
  expiresAt: string
}

export interface Album {
  enabled: boolean
  items: StickerItem[]
  total: number
  owned: number
  eligible: boolean
  setReward: number
  setRewardClaimed: boolean
  setComplete: boolean
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

export const claimSetReward = (token: string) => authFetch<{ points: number }>('/stickers/set-reward', token, { method: 'POST' })

export const sendDevice = (token: string, deviceId: string) =>
  authFetch<{ ok: boolean }>('/fun/device', token, { method: 'POST', body: JSON.stringify({ deviceId }) })
