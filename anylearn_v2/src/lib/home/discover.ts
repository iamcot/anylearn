import type { HomeContext } from './blocks'

// The query of GET /discover for the chosen child and the saved address ("Thử điều mới cho con").
export function discoverParams(ctx: HomeContext): [string, string][] {
  const params: [string, string][] = []
  const learner = ctx.learner
  if (learner?.ageFrom !== undefined) params.push(['ageFrom', String(learner.ageFrom)])
  if (learner?.ageTo !== undefined) params.push(['ageTo', String(learner.ageTo)])
  if (ctx.near) {
    params.push(['nearLat', String(ctx.near.lat)], ['nearLng', String(ctx.near.lng)])
  }
  // A different child gets a different list on the same day.
  if (learner?.chipKey) params.push(['seed', learner.chipKey])
  return params
}

export function discoverTitle(ctx: HomeContext): string {
  return ctx.learner ? `Thử điều mới cho ${ctx.learner.name}` : 'Thử điều mới cho con'
}
