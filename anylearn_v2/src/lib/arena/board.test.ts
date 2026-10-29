import { describe, expect, it } from 'vitest'
import { avatarColor, initial, ownApart, roomFirst, secondsText } from './board'

describe('arena board helpers', () => {
  it('puts people in the room first and keeps the order inside each group', () => {
    const rows = [{ n: 'a', inRoom: false }, { n: 'b', inRoom: true }, { n: 'c', inRoom: false }, { n: 'd', inRoom: true }]
    expect(roomFirst(rows).map(r => r.n)).toEqual(['b', 'd', 'a', 'c'])
  })

  it('pins the own line only when it is not in the list', () => {
    const me = { me: true }
    expect(ownApart([{ me: false }, { me: true }], me)).toBeNull()
    expect(ownApart([{ me: false }], me)).toBe(me)
    expect(ownApart([{ me: false }], null)).toBeNull()
  })

  it('writes seconds with a comma', () => {
    expect(secondsText(82_400)).toBe('82,4 giây')
    expect(secondsText(0)).toBe('')
  })

  it('takes the avatar letter from the last word and keeps the colour steady', () => {
    expect(initial('Minh Anh')).toBe('A')
    expect(avatarColor('Minh Anh')).toBe(avatarColor('Minh Anh'))
  })
})
