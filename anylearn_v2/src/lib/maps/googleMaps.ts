// Google Maps JavaScript API, loaded once and only when a map is opened. The key is public by design (it ships to the
// browser), so it must be restricted in Google Cloud: HTTP referrers = our domains, API = Maps JavaScript API only.
export const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? ''

const LOAD_TIMEOUT_MS = 15000
let loading: Promise<void> | null = null

function ready(): boolean {
  return typeof window.google?.maps?.importLibrary === 'function'
}

// Resolves only when `importLibrary` really exists: the script's `load` event alone is not proof (a blocked or
// half-loaded script, or a rejected key, fires it without a usable API). A failed try removes its tag so a retry is clean.
export function loadGoogleMaps(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  if (ready()) return Promise.resolve()
  if (loading) return loading
  loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    let settled = false
    const fail = (message: string) => {
      if (settled) return
      settled = true
      clearInterval(poll)
      clearTimeout(timer)
      script.remove()
      loading = null
      reject(new Error(message))
    }
    const succeed = () => {
      if (settled) return
      settled = true
      clearInterval(poll)
      clearTimeout(timer)
      resolve()
    }
    // Google calls this when the key is rejected (referrer, API not enabled, billing).
    ;(window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => fail('Google Maps key rejected')
    const poll = setInterval(() => { if (ready()) succeed() }, 50)
    const timer = setTimeout(() => fail('Google Maps load timeout'), LOAD_TIMEOUT_MS)
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_KEY)}&loading=async&language=vi&region=VN&v=weekly`
    script.async = true
    script.onerror = () => fail('Google Maps script did not load')
    document.head.appendChild(script)
  })
  return loading
}
