import type { LearnersData } from './types'

export function pickLearnerId(learners: LearnersData, wantedId: number | null): number {
  const isKnown = wantedId != null && learners.learners.some(learner => learner.id === wantedId)
  return isKnown ? wantedId : learners.defaultLearnerId
}

export function hasAnyEnrollment(learners: LearnersData): boolean {
  return learners.learners.some(learner => learner.hasEnrollment)
}

export function titleFor(isSelf: boolean): string {
  return isSelf ? 'Hôm nay của bạn' : 'Hôm nay của con'
}
