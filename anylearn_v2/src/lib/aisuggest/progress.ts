// The bar never waits for the real answer: it slows down towards 92% and jumps to 100% when the answer arrives.
const CEILING = 92
const HALF_LIFE_MS = 5000

export function loadingProgress(elapsedMs: number): number {
  if (elapsedMs <= 0) return 4
  return Math.min(CEILING, 4 + (CEILING - 4) * (1 - Math.pow(0.5, elapsedMs / HALF_LIFE_MS)))
}

// The line shown at `step`, cycling through the list, with {name} replaced.
export function messageAt(messages: string[], step: number, name: string): string {
  return messages[Math.max(step, 0) % messages.length].replaceAll('{name}', name)
}
