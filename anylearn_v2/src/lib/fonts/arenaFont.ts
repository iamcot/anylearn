import { Roboto_Condensed } from 'next/font/google'

/**
 * Condensed font of the Đấu trường Leo ticket banners (the countdown and title fit a narrow ticket).
 * Declared once here: two modules declaring the same Google font made Turbopack fail with
 * "next/font/google queries have exactly one entry".
 */
export const arenaFont = Roboto_Condensed({ subsets: ['vietnamese', 'latin'], weight: ['400', '600', '700', '800'] })
