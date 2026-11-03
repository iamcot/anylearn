import { describe, expect, it } from 'vitest'
import { addLearnerLineIds, firstFreeLearner, learnersInCart } from './learners'

const cart = [
  { cartItemId: 11, itemId: 5, studentId: 101 },
  { cartItemId: 12, itemId: 5, studentId: 102 },
  { cartItemId: 13, itemId: 7, studentId: null },
  { cartItemId: 14, itemId: 7, studentId: 101 },
]

describe('learnersInCart', () => {
  it('lists the learners of the course only', () => {
    expect([...learnersInCart(cart, 5)]).toEqual([101, 102])
    expect([...learnersInCart(cart, 7)]).toEqual([null, 101])
    expect(learnersInCart(cart, 9).size).toBe(0)
  })
})

describe('firstFreeLearner', () => {
  it('keeps the wanted learner when free', () => {
    expect(firstFreeLearner(null, [101, 102, 103], learnersInCart(cart, 5))).toBe(null)
    expect(firstFreeLearner(103, [101, 102, 103], learnersInCart(cart, 5))).toBe(103)
  })
  it('moves to the first free one, account first', () => {
    expect(firstFreeLearner(101, [101, 102, 103], learnersInCart(cart, 5))).toBe(null)
    expect(firstFreeLearner(null, [101, 102], learnersInCart(cart, 7))).toBe(102)
  })
  it('keeps the wanted one when everyone is taken', () => {
    expect(firstFreeLearner(null, [101], learnersInCart(cart, 7))).toBe(null)
  })
})

describe('addLearnerLineIds', () => {
  it('marks the first line of each course', () => {
    expect([...addLearnerLineIds(cart)]).toEqual([11, 13])
  })
})
