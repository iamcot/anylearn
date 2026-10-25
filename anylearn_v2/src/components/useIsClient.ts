import { useSyncExternalStore } from 'react'

const subscribeNever = () => () => {}

export function useIsClient(): boolean {
  return useSyncExternalStore(subscribeNever, () => true, () => false)
}
