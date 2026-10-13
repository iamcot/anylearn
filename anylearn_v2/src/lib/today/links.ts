export const BROWSE_HOME_URL = '/?browse=1'

const BROWSING_KEY = 'anylearn_browsing'

export function shouldRedirectToToday(state: { enrolled: boolean; browsing: boolean }): boolean {
  return state.enrolled && !state.browsing
}

export function isBrowsing(): boolean {
  try {
    return sessionStorage.getItem(BROWSING_KEY) === '1'
  } catch {
    return false
  }
}

export function markBrowsing(): void {
  try {
    sessionStorage.setItem(BROWSING_KEY, '1')
  } catch {
    // storage blocked: the ?browse=1 link still works for this page view
  }
}

export function clearBrowsing(): void {
  try {
    sessionStorage.removeItem(BROWSING_KEY)
  } catch {
    // nothing to clear
  }
}
