// A link that opens the place in Google Maps: exact point when we have coordinates, else the address text.
export function mapLink({ lat, lng, address, placeId }) {
  const base = 'https://www.google.com/maps/search/?api=1&query='
  if (lat != null && lng != null) return `${base}${lat},${lng}`
  const link = `${base}${encodeURIComponent(address ?? '')}`
  return placeId ? `${link}&query_place_id=${encodeURIComponent(placeId)}` : link
}
