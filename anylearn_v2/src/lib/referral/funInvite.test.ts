import { describe, expect, it } from 'vitest'
import { funInviteLink } from './funInvite'
import { afterRegisterPath, parseReferral } from './store'

describe('fun invite link', () => {
  it('opens /fun with the code', () => {
    expect(funInviteLink('0901234567', 'https://anylearn.vn')).toBe('https://anylearn.vn/fun?ref=0901234567')
  })

  it('sends the friend back to /fun after registering', () => {
    const raw = JSON.stringify({ code: '0901234567', name: 'An', game: 'fun', ach: null, savedAt: 1 })
    expect(afterRegisterPath(parseReferral(raw, 2))).toBe('/fun')
  })
})
