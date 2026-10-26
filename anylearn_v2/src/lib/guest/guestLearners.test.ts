import { describe, expect, it } from 'vitest'
import {
  EMPTY_GUEST_STORE, ageFilterFor, ageFromBirthYear, birthYearOfDob, birthYearOptions, describeGuestLearner, dobFromBirthYear,
  duplicateNickname, guestPeople, matchGuestToChildren, normalizeName, selectedGuestPerson, parseGuestLearnerStore, shouldAskWhoFor, withAnswer, withDismissed, withSelected,
  withoutLearners, type GuestLearner, type GuestLearnerStore,
} from './guestLearners'

const NOW = new Date('2026-10-25T10:00:00Z')
const BIN: GuestLearner = { localId: 'a1', nickname: 'Bin', birthYear: 2015 }
const SU: GuestLearner = { localId: 'b2', nickname: 'Su', birthYear: 2017 }

function store(overrides: Partial<GuestLearnerStore> = {}): GuestLearnerStore {
  return { version: 1, learners: [], ...overrides }
}

describe('parseGuestLearnerStore', () => {
  it('reads nothing as an empty store', () => {
    expect(parseGuestLearnerStore(null, NOW)).toEqual(EMPTY_GUEST_STORE)
    expect(parseGuestLearnerStore('', NOW)).toEqual(EMPTY_GUEST_STORE)
  })

  it('ignores broken json, other versions and other shapes', () => {
    expect(parseGuestLearnerStore('{not json', NOW)).toEqual(EMPTY_GUEST_STORE)
    expect(parseGuestLearnerStore('{"version":2,"learners":[]}', NOW)).toEqual(EMPTY_GUEST_STORE)
    expect(parseGuestLearnerStore('[1,2]', NOW)).toEqual(EMPTY_GUEST_STORE)
    expect(parseGuestLearnerStore('"text"', NOW)).toEqual(EMPTY_GUEST_STORE)
  })

  it('keeps a valid store as it was saved', () => {
    const saved = store({ audience: 'child', learners: [BIN, SU], selectedLocalId: 'b2' })
    expect(parseGuestLearnerStore(JSON.stringify(saved), NOW)).toMatchObject(saved)
  })

  it('drops learners with a missing name or an impossible birth year', () => {
    const raw = JSON.stringify(store({
      learners: [BIN, { localId: 'x', nickname: '  ', birthYear: 2015 }, { localId: 'y', nickname: 'Mai', birthYear: 2031 },
        { localId: 'z', nickname: 'Lan', birthYear: 20.5 }, { nickname: 'No id', birthYear: 2015 } as GuestLearner],
    }))
    expect(parseGuestLearnerStore(raw, NOW).learners).toEqual([BIN])
  })

  it('caps the number of learners and the name length', () => {
    const many = Array.from({ length: 8 }, (_, index) => ({ localId: `id${index}`, nickname: 'n'.repeat(80), birthYear: 2015 }))
    const parsed = parseGuestLearnerStore(JSON.stringify(store({ learners: many })), NOW)
    expect(parsed.learners).toHaveLength(5)
    expect(parsed.learners[0]?.nickname).toHaveLength(40)
  })

  it('forgets a selected learner that no longer exists', () => {
    const raw = JSON.stringify(store({ learners: [BIN], selectedLocalId: 'gone' }))
    expect(parseGuestLearnerStore(raw, NOW).selectedLocalId).toBeUndefined()
  })
})

describe('ageFromBirthYear and ageFilterFor', () => {
  it('counts the age reached this year', () => {
    expect(ageFromBirthYear(2015, NOW)).toBe(11)
    expect(ageFromBirthYear(2030, NOW)).toBe(0)
  })

  it('maps an age to the search filter buckets', () => {
    expect(ageFilterFor(2)).toBe('3-5')
    expect(ageFilterFor(5)).toBe('3-5')
    expect(ageFilterFor(6)).toBe('6-10')
    expect(ageFilterFor(10)).toBe('6-10')
    expect(ageFilterFor(11)).toBe('11-15')
    expect(ageFilterFor(15)).toBe('11-15')
    expect(ageFilterFor(16)).toBe('16+')
    expect(ageFilterFor(35)).toBe('16+')
  })
})

describe('dob helpers', () => {
  it('turns a birth year into the placeholder date and back', () => {
    expect(dobFromBirthYear(2015)).toBe('2015-01-01')
    expect(birthYearOfDob('2015-03-02')).toBe(2015)
    expect(birthYearOfDob(null)).toBeNull()
    expect(birthYearOfDob('')).toBeNull()
  })
})

describe('normalizeName', () => {
  it('ignores accents, case and spacing', () => {
    expect(normalizeName('  Đức  Anh ')).toBe('duc anh')
    expect(normalizeName('Bé BIN')).toBe('be bin')
  })
})

describe('matchGuestToChildren', () => {
  it('matches by name without accents', () => {
    const result = matchGuestToChildren(
      [{ localId: 'a', nickname: 'duc', birthYear: 2015 }],
      [{ id: 7, name: 'Đức', dob: '2015-06-30' }],
    )
    expect(result.matched.map(item => item.child.id)).toEqual([7])
    expect(result.unmatched).toEqual([])
  })

  it('matches the same name even with another birth year (no second Bin is created)', () => {
    const result = matchGuestToChildren([BIN], [{ id: 1, name: 'Bin', dob: '2011-03-02' }])
    expect(result.matched.map(item => item.child.id)).toEqual([1])
    expect(result.unmatched).toEqual([])
  })

  it('does not match a different name', () => {
    const result = matchGuestToChildren([BIN, SU], [{ id: 2, name: 'Mai', dob: '2017-01-01' }])
    expect(result.matched).toEqual([])
    expect(result.unmatched).toEqual([BIN, SU])
  })

  it('uses each child once', () => {
    const again: GuestLearner = { localId: 'c3', nickname: 'Bin', birthYear: 2015 }
    const result = matchGuestToChildren([BIN, again], [{ id: 1, name: 'Bin', dob: '2015-01-01' }])
    expect(result.matched).toHaveLength(1)
    expect(result.unmatched).toEqual([again])
  })

  it('matches a child that has no date of birth', () => {
    expect(matchGuestToChildren([BIN], [{ id: 1, name: 'Bin' }]).matched).toHaveLength(1)
  })
})

describe('duplicateNickname', () => {
  it('finds a name typed twice, ignoring accents and case', () => {
    expect(duplicateNickname([BIN, SU, { localId: 'z', nickname: ' bin ', birthYear: 2020 }])).toBe('bin')
  })

  it('returns null when every name differs or is empty', () => {
    expect(duplicateNickname([BIN, SU])).toBeNull()
    expect(duplicateNickname([{ nickname: '' }, { nickname: ' ' }])).toBeNull()
  })
})

describe('shouldAskWhoFor', () => {
  it('asks on browse pages the first time', () => {
    expect(shouldAskWhoFor(store(), '/', NOW, 7)).toBe(true)
    expect(shouldAskWhoFor(store(), '/search', NOW, 7)).toBe(true)
    expect(shouldAskWhoFor(store(), '/class/12/bong-da', NOW, 7)).toBe(true)
  })

  it('stays quiet on other pages', () => {
    expect(shouldAskWhoFor(store(), '/checkout', NOW, 7)).toBe(false)
    expect(shouldAskWhoFor(store(), '/login', NOW, 7)).toBe(false)
    expect(shouldAskWhoFor(store(), '/classroom', NOW, 7)).toBe(false)
  })

  it('does not ask again once answered', () => {
    expect(shouldAskWhoFor(store({ audience: 'child', learners: [BIN] }), '/', NOW, 7)).toBe(false)
    expect(shouldAskWhoFor(store({ audience: 'self' }), '/', NOW, 7)).toBe(false)
  })

  it('waits after "Để sau" and asks again later', () => {
    const dismissed = withDismissed(store(), new Date('2026-10-22T10:00:00Z'))
    expect(shouldAskWhoFor(dismissed, '/', NOW, 7)).toBe(false)
    expect(shouldAskWhoFor(dismissed, '/', new Date('2026-11-05T10:00:00Z'), 7)).toBe(true)
  })
})

describe('store updates', () => {
  it('saves an answer for a child and selects the first one', () => {
    const next = withAnswer(store(), { audience: 'child', learners: [BIN, SU] })
    expect(next).toMatchObject({ audience: 'child', learners: [BIN, SU], selectedLocalId: 'a1' })
  })

  it('keeps the selected child while editing', () => {
    const before = store({ audience: 'child', learners: [BIN, SU], selectedLocalId: 'b2' })
    expect(withAnswer(before, { audience: 'child', learners: [BIN, SU] }).selectedLocalId).toBe('b2')
  })

  it('saves an answer for the visitor without any child', () => {
    const next = withAnswer(store({ learners: [BIN] }), { audience: 'self', learners: [BIN], selfBirthYear: 1990 })
    expect(next).toMatchObject({ audience: 'self', learners: [], selfBirthYear: 1990 })
  })

  it('selects only learners that exist', () => {
    const before = store({ learners: [BIN, SU], selectedLocalId: 'a1' })
    expect(withSelected(before, 'b2').selectedLocalId).toBe('b2')
    expect(withSelected(before, 'nope')).toBe(before)
  })

  it('removes learners and resets when none are left', () => {
    const before = store({ audience: 'child', learners: [BIN, SU], selectedLocalId: 'a1' })
    expect(withoutLearners(before, ['a1']).selectedLocalId).toBe('b2')
    expect(withoutLearners(before, ['a1', 'b2'])).toEqual(EMPTY_GUEST_STORE)
  })
})

describe('guestPeople', () => {
  it('lists each child with the search age bucket', () => {
    const people = guestPeople(store({ audience: 'child', learners: [BIN, SU] }), NOW)
    expect(people).toEqual([
      { key: 'a1', name: 'Bin', label: 'Bin · 11t', age: 11, ageFilter: '11-15', localId: 'a1' },
      { key: 'b2', name: 'Su', label: 'Su · 9t', age: 9, ageFilter: '6-10', localId: 'b2' },
    ])
  })

  it('lists the visitor when they gave a birth year', () => {
    expect(guestPeople(store({ audience: 'self', selfBirthYear: 1990 }), NOW))
      .toEqual([{ key: 'self', name: 'Tôi', label: 'Tôi · 36t', age: 36, ageFilter: '16+' }])
  })

  it('lists nobody without a birth year or an answer', () => {
    expect(guestPeople(store({ audience: 'self' }), NOW)).toEqual([])
    expect(guestPeople(store(), NOW)).toEqual([])
  })

  it('selects the chosen child, else the first', () => {
    const answered = store({ audience: 'child', learners: [BIN, SU], selectedLocalId: 'b2' })
    expect(selectedGuestPerson(answered, NOW)?.key).toBe('b2')
    expect(selectedGuestPerson({ ...answered, selectedLocalId: undefined }, NOW)?.key).toBe('a1')
    expect(selectedGuestPerson(store(), NOW)).toBeUndefined()
  })
})

describe('labels and options', () => {
  it('describes a learner with the age reached this year', () => {
    expect(describeGuestLearner(BIN, NOW)).toBe('Bin · 11t')
  })

  it('lists birth years newest first', () => {
    expect(birthYearOptions(NOW, 0, 3)).toEqual([2026, 2025, 2024, 2023])
  })
})
