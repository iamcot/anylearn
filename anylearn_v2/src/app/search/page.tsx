'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getCategories, getUserProfile, type Category, type PublicUserProfile } from '@/lib/api'
import { FILTER_ALL, SORT_OPTIONS } from '@/config/searchFilters'
import {
  DEFAULT_FILTERS, SEARCH_PAGE_SIZE, buildSearchUrl, parseSearchParams, type SearchMode, type SearchState,
} from '@/lib/search/query'
import { fetchSearchResults, type SearchResults } from '@/lib/search/fetchResults'
import SearchModeTabs from '@/components/search/SearchModeTabs'
import SearchForm from '@/components/search/SearchForm'
import { MobileFilters, SearchFiltersPanel } from '@/components/search/SearchFilters'
import AuthorProfileCard from '@/components/search/AuthorProfileCard'
import { CourseResultCard, UserResultCard } from '@/components/search/ResultCards'
import Pagination from '@/components/search/Pagination'
import { NoResults } from '@/components/search/SearchMessages'
import { useSearchHistory } from '@/components/search/useSearchHistory'
import { ResultRowsSkeleton } from '@/components/PageSkeleton'
import GuestLearnerChips from '@/components/guest/GuestLearnerChips'

interface FetchedResults extends SearchResults {
  url: string
}

// The URL is the single source of truth: every control rewrites it and the effect below fetches for it.
function SearchPageInner() {
  const searchParams = useSearchParams()
  const paramsKey = searchParams.toString()
  const state = useMemo(() => parseSearchParams(new URLSearchParams(paramsKey)), [paramsKey])
  const url = buildSearchUrl(state)

  const [fetched, setFetched] = useState<FetchedResults | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [profile, setProfile] = useState<PublicUserProfile | null>(null)
  const { history, remember, clear: clearHistory } = useSearchHistory()
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    let cancelled = false
    fetchSearchResults(state).then(data => { if (!cancelled) setFetched({ ...data, url }) })
    return () => { cancelled = true }
  }, [state, url])

  useEffect(() => { getCategories().then(setCategories) }, [])

  useEffect(() => {
    if (!state.authorId) return
    let cancelled = false
    getUserProfile(state.authorId).then(data => { if (!cancelled) setProfile(data) })
    return () => { cancelled = true }
  }, [state.authorId])

  const apply = (patch: Partial<SearchState>) => {
    window.history.replaceState(null, '', buildSearchUrl({ ...state, page: 0, ...patch }))
  }

  const pickAge = (ageFilter: string | null) => apply({ filters: { ...state.filters, age: ageFilter ?? FILTER_ALL } })
  const changeMode = (mode: SearchMode) => apply({ mode, q: '', category: undefined, authorId: undefined, filters: DEFAULT_FILTERS })
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
  const filterProps = {
    state,
    categories,
    onCategoryChange: (category: string | undefined) => apply({ category }),
    onFilterChange: (filters: SearchState['filters']) => apply({ filters }),
    onClear: () => apply({ category: undefined, sort: 'popular', filters: DEFAULT_FILTERS }),
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

      {state.mode === 'class' && <GuestLearnerChips activeAge={state.filters.age} onPickAge={pickAge} />}

      <section className="section py-6 lg:py-10">
        <div className={`container grid items-start gap-7 ${state.mode === 'class' ? 'lg:grid-cols-[300px_1fr]' : ''}`}>
          {state.mode === 'class' && (
            <>
              <MobileFilters {...filterProps} />
              <aside className="hidden rounded-[26px] border border-line bg-white p-[22px] shadow-card lg:block">
                <SearchFiltersPanel {...filterProps} />
              </aside>
            </>
          )}

          <div className="min-w-0">
            {authorProfile && <AuthorProfileCard profile={authorProfile} />}

            <div className="mb-[18px] flex items-end justify-between gap-4">
              <div>
                <h2 ref={headingRef} className="m-0 scroll-mt-24 text-xl font-extrabold text-ink md:text-3xl">Kết quả phù hợp</h2>
                <p className="mb-0 mt-1 text-muted">{loading ? 'Đang tìm kiếm...' : `${total} kết quả`}</p>
              </div>
              {state.mode === 'class' && (
                <select
                  aria-label="Sắp xếp"
                  value={state.sort}
                  onChange={event => apply({ sort: event.target.value })}
                  className="min-h-11 rounded-full border border-line bg-white px-3.5 font-medium text-text outline-none"
                >
                  {SORT_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              )}
            </div>

            {loading && <ResultRowsSkeleton />}

            {results && state.mode === 'class' && results.items.length > 0 && (
              <div className="grid gap-3 xl:grid-cols-2">
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

            {!loading && results && !hasResults && <NoResults />}
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
