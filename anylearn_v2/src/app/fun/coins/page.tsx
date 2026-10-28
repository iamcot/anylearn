import { redirect } from 'next/navigation'

/** The ledger moved into the shop: /fun/shop > tab "Lịch sử" (old links and bookmarks still work). */
export default function CoinHistoryRedirect(): never {
  redirect('/fun/shop?tab=history')
}
