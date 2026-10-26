'use client'

import { useAuth } from '@/context/AuthContext'
import GuestLearnerStrip from '@/components/guest/GuestLearnerStrip'
import LearnerChips from '@/components/search/LearnerChips'
import { writeActiveLearner, ALL_LEARNERS } from '@/lib/search/learners'
import { useHomeContext } from './useHomeContext'

// Under the hero search box: an account picks which child the home page is for; a visitor sees their own answer.
export default function HomeLearnerRow() {
  const { token } = useAuth()
  const { chips, activeKey } = useHomeContext()
  if (!token) return <GuestLearnerStrip />
  return <LearnerChips bare chips={chips} activeKey={activeKey} onPick={chip => writeActiveLearner(chip?.key ?? ALL_LEARNERS)} />
}
