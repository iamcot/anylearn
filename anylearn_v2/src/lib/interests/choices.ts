import { MAX_INTERESTS_PER_QUESTION } from '@/config/interests'

// Ticks or unticks a choice; a ninth choice is ignored (the backend keeps at most eight too).
export function toggleChoice(selected: string[], key: string): string[] {
  if (selected.includes(key)) return selected.filter(item => item !== key)
  return selected.length >= MAX_INTERESTS_PER_QUESTION ? selected : [...selected, key]
}

// The budget is a single choice; tapping the chosen one again clears it.
export function toggleBudget(current: string | null, key: string): string | null {
  return current === key ? null : key
}
