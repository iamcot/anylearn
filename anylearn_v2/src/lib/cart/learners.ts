import type { CartItem } from '@/lib/api/cart'

// A learner on the add-to-cart page: a child id, or null for the account itself (the cart line's studentId is null then).
export type LearnerChoice = number | null

type CartLine = Pick<CartItem, 'itemId' | 'studentId' | 'cartItemId'>

/** Learners who already have this course in the cart (the server refuses the same course twice for one learner). */
export function learnersInCart(cart: CartLine[], itemId: number): Set<LearnerChoice> {
  const taken = new Set<LearnerChoice>()
  for (const line of cart) {
    if (line.itemId === itemId) taken.add(line.studentId ?? null)
  }
  return taken
}

/** The learner to preselect: the wanted one if still free, else the first free one (account first), else the wanted one. */
export function firstFreeLearner(wanted: LearnerChoice, childIds: number[], taken: Set<LearnerChoice>): LearnerChoice {
  if (!taken.has(wanted)) return wanted
  const free = [null, ...childIds].find(id => !taken.has(id))
  return free === undefined ? wanted : free
}

/** Cart line ids that carry the "+ Thêm người học" link: the first line of each course, in cart order. */
export function addLearnerLineIds(cart: CartLine[]): Set<number> {
  const seen = new Set<number>()
  const ids = new Set<number>()
  for (const line of cart) {
    if (seen.has(line.itemId)) continue
    seen.add(line.itemId)
    ids.add(line.cartItemId)
  }
  return ids
}

/** Link back to the add-to-cart page of a course, from the checkout. */
export function addLearnerHref(itemId: number): string {
  return `/add2cart/${itemId}`
}
