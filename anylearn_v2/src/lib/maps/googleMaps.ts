// Google Maps JavaScript API, loaded once and only when a map is opened. The key is public by design (it ships to the
// browser), so it must be restricted in Google Cloud: HTTP referrers = our domains, API = Maps JavaScript API only.
export const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? ''

let loading: Promise<void> | null = null

export function loadGoogleMaps(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  if (typeof window.google?.maps?.importLibrary === 'function') return Promise.resolve()
  if (loading) return loading
  loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_KEY)}&loading=async&language=vi&region=VN&v=weekly`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => { loading = null; reject(new Error('Google Maps did not load')) }
    document.head.appendChild(script)
  })
  return loading
}
