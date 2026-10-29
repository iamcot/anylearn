import { siteOrigin } from '@/lib/achievements/share'

/** Game id a /fun?ref= link stores with the referral: after registering the friend lands on /fun (GAME_ROUTES). */
export const FUN_INVITE_GAME = 'fun'

export const FUN_INVITE_TEXT = 'Vào anyLEARN chơi cùng Leo nè: quà điểm danh mỗi ngày, đố vui leo rank, sưu tầm sticker!'

/**
 * The "Mời bạn" link of the Vui học page: /fun itself (so the chat preview is the Leo card of config/shareCards.ts) with the
 * person's referral code, which `RefParamCapture` keeps for the friend's registration.
 */
export function funInviteLink(code: string, origin = siteOrigin()): string {
  return `${origin}/fun?ref=${encodeURIComponent(code)}`
}
