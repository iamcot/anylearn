'use client'

import dynamic from 'next/dynamic'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getCategories, getSearchOptions, getUserProfile, type Category, type PublicUserProfile, type SearchOptions } from '@/lib/api'
import { FILTER_ALL, NEAREST_SORT, SORT_OPTIONS } from '@/config/searchFilters'
import {
  DEFAULT_ADVANCED, DEFAULT_FILTERS, SEARCH_PAGE_SIZE, buildSearchUrl, parseSearchParams, type SearchMode, type SearchState,
} from '@/lib/search/query'
import { fetchSearchResults, type SearchResults } from '@/lib/search/fetchResults'
import SearchModeTabs from '@/components/search/SearchModeTabs'
import SearchForm from '@/components/search/SearchForm'
import { FilterDrawer } from '@/components/search/SearchFilters'
import AuthorProfileCard from '@/components/search/AuthorProfileCard'
import { CourseResultCard, UserResultCard } from '@/components/search/ResultCards'
import Pagination from '@/components/search/Pagination'
import { NoResults, RequestHelpLine } from '@/components/search/SearchMessages'
import { currentSearchRef } from '@/components/search/searchTracking'
import { provinceFromFilter } from '@/lib/search/courseRequest'
import type { CourseRequestDefaults } from '@/components/search/CourseRequestModal'
import { useSearchHistory } from '@/components/search/useSearchHistory'
import { ResultRowsSkeleton } from '@/components/PageSkeleton'
import GuestLearnerChips from '@/components/guest/GuestLearnerChips'
import LearnerChips, { useLearnerChips } from '@/components/search/LearnerChips'
import FilterBar from '@/components/search/FilterBar'
import { useAuth } from '@/context/AuthContext'
import { MapIcon } from '@/components/icons'
import { GOOGLE_MAPS_KEY } from '@/lib/maps/googleMaps'
import { ALL_LEARNERS, readActiveLearner, writeActiveLearner, type LearnerChip } from '@/lib/search/learners'
import { createSearchTracking } from '@/components/search/searchTracking'
import { takeGuestAutoAge } from '@/components/guest/takeGuestAutoAge'

interface FetchedResults extends SearchResults {
  url: string
}

// The URL is the single source of truth: every control rewrites it and the effect below fetches for it.
// The map script touches `window`, so the popup is only loaded in the browser and only when it opens.
const NearbyMapModal = dynamic(() => import('@/components/search/NearbyMapModal'), { ssr: false })

function SearchPageInner() {
  const searchParams = useSearchParams()
  const paramsKey = searchParams.toString()
  const state = useMemo(() => parseSearchParams(new URLSearchParams(paramsKey)), [paramsKey])
  const url = buildSearchUrl(state)

  const [fetched, setFetched] = useState<FetchedResults | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [profile, setProfile] = useState<PublicUserProfile | null>(null)
  const [options, setOptions] = useState<SearchOptions>({ districts: [], tags: [] })
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const { token } = useAuth()
  const learnerChips = useLearnerChips()
  const { history, remember, clear: clearHistory } = useSearchHistory()
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    // A visitor who said who the courses are for gets their age filter first: apply it and wait for the next render
    // instead of fetching an unfiltered search that would be replaced at once.
    const guestAge = takeGuestAutoAge(state.filters.age)
    if (guestAge) {
      window.history.replaceState(null, '', buildSearchUrl({ ...state, page: 0, filters: { ...state.filters, age: guestAge } }))
      return
    }
    let cancelled = false
    fetchSearchResults(state, createSearchTracking()).then(data => { if (!cancelled) setFetched({ ...data, url }) })
    return () => { cancelled = true }
  }, [state, url])

  useEffect(() => { getCategories().then(setCategories) }, [])

  const province = state.filters.location === FILTER_ALL ? undefined : state.filters.location
  useEffect(() => {
    let cancelled = false
    getSearchOptions(province).then(data => { if (!cancelled) setOptions(data) })
    return () => { cancelled = true }
  }, [province])


  useEffect(() => {
    if (!state.authorId) return
    let cancelled = false
    getUserProfile(state.authorId).then(data => { if (!cancelled) setProfile(data) })
    return () => { cancelled = true }
  }, [state.authorId])

  const apply = (patch: Partial<SearchState>) => {
    window.history.replaceState(null, '', buildSearchUrl({ ...state, page: 0, ...patch }))
  }

  const pickLearner = (chip: LearnerChip | null) => {
    writeActiveLearner(chip?.key ?? ALL_LEARNERS)
    const adv = chip
      ? { ...state.adv, learner: chip.key, ageFrom: chip.ageFrom, ageTo: chip.ageTo }
      : { ...state.adv, learner: undefined, ageFrom: undefined, ageTo: undefined }
    apply({ adv, filters: { ...state.filters, age: FILTER_ALL } })
  }
  // A person with an account who picked a child last time opens the search for that child (once the chips are loaded).
  const learnerApplied = useRef(false)
  useEffect(() => {
    if (!token || learnerChips.length === 0 || learnerApplied.current) return
    learnerApplied.current = true
    const remembered = readActiveLearner()
    const chip = learnerChips.find(item => item.key === remembered)
    const untouched = state.adv.ageFrom === undefined && !state.adv.learner && state.filters.age === FILTER_ALL
    if (chip && untouched) pickLearner(chip)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, learnerChips])

  const pickAge = (ageFilter: string | null) => apply({ filters: { ...state.filters, age: ageFilter ?? FILTER_ALL } })
  const changeMode = (mode: SearchMode) => apply({ mode, q: '', category: undefined, authorId: undefined, filters: DEFAULT_FILTERS, adv: DEFAULT_ADVANCED })
  const submitQuery = (q: string) => { if (q) remember(q); apply({ q, authorId: undefined }) }
  const pickHistory = (term: string) => { remember(term); apply({ q: term, authorId: undefined }) }
  const changePage = (page: number) => {
    apply({ page })
    headingRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loading = fetched?.url !== url
  const results = fetched?.url === url ? fetched : null
  const total = results?.total ?? 0
  const hasResults = !!results && (results.items.length > 0 || results.users.length > 0)
  const authorProfile = profile && profile.id === state.authorId && state.mode === 'class' ? profile : null
  // The form opens with what the visitor just searched for.
  const requestDefaults: CourseRequestDefaults = {
    subject: state.q,
    provinceCode: provinceFromFilter(state.filters.location),
    sourceRef: currentSearchRef(),
  }
  const filterProps = {
    state,
    categories,
    onCategoryChange: (category: string | undefined) => apply({ category }),
    onFilterChange: (filters: SearchState['filters']) => apply({ filters }),
    onAdvancedChange: (adv: SearchState['adv']) => apply({ adv }),
    options,
    onClear: () => apply({ category: undefined, sort: 'popular', filters: DEFAULT_FILTERS, adv: { ...DEFAULT_ADVANCED, learner: state.adv.learner, ageFrom: state.adv.ageFrom, ageTo: state.adv.ageTo } }),
  }

  return (
    <>
      <SearchModeTabs mode={state.mode} onChange={changeMode} />
      <SearchForm
        key={`${state.mode}|${state.q}`}
        mode={state.mode}
        initialQuery={state.q}
        history={history}
        onSubmit={submitQuery}
        onPickHistory={pickHistory}
        onClearHistory={clearHistory}
      />

      {state.mode === 'class' && (token
        ? <LearnerChips chips={learnerChips} activeKey={state.adv.learner} onPick={pickLearner} />
        : <GuestLearnerChips activeAge={state.filters.age} onPickAge={pickAge} />)}
      {state.mode === 'class' && (
        <FilterBar
          state={state} apply={apply} options={options} total={total} loading={loading}
          autoLocate={searchParams.get('locate') === '1'}
          onOpenFilters={() => setFiltersOpen(true)} onNeedDistrict={() => setFiltersOpen(true)}
        />
      )}

      {mapOpen && state.adv.near && (
        <NearbyMapModal center={state.adv.near} radiusKm={state.adv.radiusKm} onClose={() => setMapOpen(false)} />
      )}

      <section className="section py-6 lg:py-10">
        <div className="container">
          {state.mode === 'class' && <FilterDrawer {...filterProps} open={filtersOpen} onOpenChange={setFiltersOpen} total={total} loading={loading} />}

          <div className="min-w-0">
            {authorProfile && <AuthorProfileCard profile={authorProfile} />}

            <div className="mb-[18px] flex items-end justify-between gap-4">
              <div>
                <h2 ref={headingRef} className="m-0 scroll-mt-24 whitespace-nowrap text-lg font-extrabold text-ink md:text-3xl">Kết quả phù hợp {state.mode === 'class' && state.adv.near && GOOGLE_MAPS_KEY && (
                    <button type="button" onClick={() => setMapOpen(true)} className="inline-flex min-h-11 cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-sm font-bold text-green-dark">
                      <MapIcon className="size-4" />Xem bản đồ
                    </button>
                  )}</h2>
                <p className="mb-0 mt-1 flex flex-wrap items-center gap-x-3 text-muted">
                  <span>{loading ? 'Đang tìm kiếm...' : `${total} kết quả`}</span>
                  
                </p>
              </div>
              {state.mode === 'class' && (
                <select
                  aria-label="Sắp xếp"
                  value={state.sort}
                  onChange={event => apply({ sort: event.target.value })}
                  className="min-h-11 rounded-full border border-line bg-white px-3.5 font-medium text-text outline-none"
                >
                  {(state.adv.near ? [...SORT_OPTIONS, NEAREST_SORT] : SORT_OPTIONS).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              )}
            </div>

            {loading && <ResultRowsSkeleton />}

            {results && state.mode === 'class' && results.items.length > 0 && (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-2 xl:grid-cols-3">
                {results.items.map(item => <CourseResultCard key={item.id} item={item} />)}
              </div>
            )}

            {results && state.mode !== 'class' && results.users.length > 0 && (
              <div className="grid gap-3 xl:grid-cols-2">
                {results.users.map(user => <UserResultCard key={user.id} user={user} mode={state.mode as 'school' | 'teacher'} />)}
              </div>
            )}

            {!loading && total > SEARCH_PAGE_SIZE && (
              <Pagination currentPage={state.page} totalPages={Math.ceil(total / SEARCH_PAGE_SIZE)} onChange={changePage} />
            )}

            {!loading && results && !hasResults && <NoResults requestDefaults={requestDefaults} />}
            {!loading && hasResults && state.mode === 'class' && <RequestHelpLine requestDefaults={requestDefaults} />}
          </div>
        </div>
      </section>
    </>
  )
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageInner />
    </Suspense>
  )
}
