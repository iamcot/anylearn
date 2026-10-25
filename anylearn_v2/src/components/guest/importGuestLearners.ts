import { saveChild, updateProfile } from '@/lib/api'
import {
  EMPTY_GUEST_STORE, dobFromBirthYear, selectedGuestLearner, withoutLearners, type GuestLearner,
} from '@/lib/guest/guestLearners'
import { getGuestStore, notifyChildrenChanged, saveGuestStore, setPendingChildId } from './guestLearnerStore'

export interface ImportResult {
  created: number
  failed: GuestLearner[]
}

// Creates the children a guest told us about under the account that just registered (or agreed to add them).
// Only the birth year is known, so the date is January 1st with dobYearOnly set; checkout asks for the full date.
// A child is removed from the store as soon as it is saved, so a retry never creates it twice.
export async function importGuestLearners(token: string, only?: GuestLearner[]): Promise<ImportResult> {
  const store = getGuestStore()
  const learners = only ?? store.learners
  const selected = selectedGuestLearner(store)
  const failed: GuestLearner[] = []
  let created = 0

  for (const learner of learners) {
    const { data, error } = await saveChild(
      { name: learner.nickname, dob: dobFromBirthYear(learner.birthYear), dobYearOnly: true },
      token,
    )
    if (error || !data) {
      failed.push(learner)
      continue
    }
    created++
    if (learner.localId === selected?.localId) setPendingChildId(data.id)
    saveGuestStore(withoutLearners(getGuestStore(), [learner.localId]))
  }

  if (!only && failed.length === 0) await finishSelfAnswer(token)
  if (created > 0) notifyChildrenChanged()
  return { created, failed }
}

async function finishSelfAnswer(token: string) {
  const store = getGuestStore()
  if (store.audience === 'self' && store.selfBirthYear) {
    await updateProfile({ dob: dobFromBirthYear(store.selfBirthYear), dobYearOnly: true }, token)
  }
  saveGuestStore(EMPTY_GUEST_STORE)
}
