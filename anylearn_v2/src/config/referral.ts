// Where a person goes after registering through a friend's link (/ref/{phone}[?game=...]).
// A link with only the code lands on the page that introduces anyLEARN; a link with a game id lands on that game.
export const REFERRAL_TTL_DAYS = 30
export const AFTER_REGISTER_INTRO = '/info'
// Every game opens the Vui học page for now; point a game at its own page once it has one (plan 14).
// A game id that is not listed falls back to the intro page, so a link never leads to a missing page.
export const GAME_ROUTES: Record<string, string> = { quiz: '/fun', sticker: '/fun/sticker' }
