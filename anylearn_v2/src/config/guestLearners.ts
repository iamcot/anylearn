export const GUEST_LEARNERS_KEY = 'anylearn.guestLearners'
// Set when a guest's child is waiting to be picked on /add2cart (after register/login created or matched it).
export const PENDING_CHILD_KEY = 'anylearn.pendingChildId'

export const MAX_GUEST_LEARNERS = 5
export const MAX_NICKNAME_LENGTH = 40

// After "Để sau" the question is not asked again for this many days.
export const GUEST_PROMPT_DISMISS_DAYS = 7

// Pages where a guest is asked who the courses are for (the PDP is /class/...).
export const GUEST_PROMPT_PATHS = ['/', '/search', '/class/']

// Birth years offered in the pickers.
export const CHILD_MAX_AGE = 22
export const SELF_MIN_AGE = 14
export const SELF_MAX_AGE = 70
