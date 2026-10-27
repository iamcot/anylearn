import { saveChildInterests, saveMyInterests } from '@/lib/api'
import { withoutInterests } from '@/lib/guest/guestLearners'
import { getGuestStore, saveGuestStore } from './guestLearnerStore'

// Sends the survey answers a visitor gave in this browser to the account (the account itself or a child) and forgets
// them here once saved. The answers are read before the first await, so clearing the store right after is safe.
export async function pushGuestInterests(token: string, key: string, target: { self: true } | { childId: number }): Promise<void> {
  const answers = getGuestStore().interests?.[key]
  if (!answers) return
  const { error } = 'self' in target
    ? await saveMyInterests(answers, token)
    : await saveChildInterests(target.childId, answers, token)
  if (!error) saveGuestStore(withoutInterests(getGuestStore(), key))
}
