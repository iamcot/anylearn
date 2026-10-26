// One look for every "who is this for" control (home, search, course page): the light green of a chosen option,
// white with a thin border when it is not chosen, and a solid green round button with a white icon to change the answer.
const BASE = 'inline-flex min-h-11 shrink-0 cursor-pointer items-center whitespace-nowrap rounded-full border px-4 text-sm font-medium no-underline transition-colors'

export const GUEST_CHIP_ON = `${BASE} border-green bg-green-soft text-green-dark`
export const GUEST_CHIP_OFF = `${BASE} border-line bg-white text-text hover:bg-green-soft`

export const GUEST_CHANGE_BUTTON = 'grid size-11 shrink-0 cursor-pointer place-items-center rounded-full border border-white/70 bg-green text-white transition-colors hover:bg-green-dark'
