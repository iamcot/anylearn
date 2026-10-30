// Landing pages "{môn} cho trẻ {tuổi} tuổi tại {quận}, TP.HCM" (plan 19.A7). The server decides which pages exist;
// these helpers only build links.

export interface LandingLink {
  path: string
  title: string
  courseCount: number
}

/** "boi/5-tuoi/quan-7" → "/hoc/boi/5-tuoi/quan-7". */
export function landingHref(path: string): string {
  return `/hoc/${path.replace(/^\/+|\/+$/g, '')}`
}

/** The three route segments back to the server's path, or null when the shape is wrong (the page answers 404). */
export function landingPath(tag: string, age: string, district: string): string | null {
  const ok = /^[a-z0-9-]{1,80}$/
  if (!ok.test(tag) || !ok.test(district) || !/^\d{1,2}-tuoi$/.test(age)) return null
  return `${tag}/${age}/${district}`
}

/** The search page with the same filters, for "Xem tất cả" (location 79 = TP.HCM, see config/searchFilters.ts). */
export function landingSearchUrl(p: { tagId: number; age: number; provinceCode: string; districtCode: string }): string {
  const params = new URLSearchParams()
  params.set('location', p.provinceCode)
  params.set('district', p.districtCode)
  params.set('ageFrom', String(p.age))
  params.set('ageTo', String(p.age))
  params.append('tag', String(p.tagId))
  return `/search?${params.toString()}`
}
