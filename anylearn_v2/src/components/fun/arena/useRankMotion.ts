'use client'

import { useEffect, useState } from 'react'

const STORE = 'arena:ranks:v1'

interface Snapshot { sessionId: number; ranks: Record<string, number> }

function read(): Snapshot | null {
  try {
    const raw = sessionStorage.getItem(STORE)
    return raw ? (JSON.parse(raw) as Snapshot) : null
  } catch {
    return null
  }
}

function write(snapshot: Snapshot) {
  try { sessionStorage.setItem(STORE, JSON.stringify(snapshot)) } catch {}
}

/** The board has no user ids (names only), so a row is keyed by its name; two people with the same name get a counter. */
export function rowKeys(rows: { name: string }[]): string[] {
  const seen = new Map<string, number>()
  return rows.map(r => {
    const n = (seen.get(r.name) ?? 0) + 1
    seen.set(r.name, n)
    return n === 1 ? r.name : `${r.name}#${n}`
  })
}

/**
 * How far each row has to travel (in row heights) to show a change of rank since the last board this phone showed for the same trial:
 * +2 = was two places lower, so it slides up two rows; `null` = a new row. The comparison is made once per board (`version`, the
 * number of finished questions), so the 5-second polls do not replay it; the ranks are remembered for the next visit
 * (the question screen unmounts the lobby, so they live in sessionStorage).
 */
export function useRankMotion(sessionId: number | null, version: number, rows: { name: string; rank: number | null }[], enabled: boolean) {
  const [calc, setCalc] = useState<{ version: number; moves: Record<string, number | null> } | null>(null)
  const keys = rowKeys(rows)

  // compared once per board: setting state while rendering is the supported way to derive it from a changed prop
  if (enabled && sessionId != null && (!calc || calc.version !== version)) {
    const before = read()
    const moves: Record<string, number | null> = {}
    if (before && before.sessionId === sessionId) {
      rows.forEach((r, i) => {
        const was = before.ranks[keys[i]]
        if (r.rank == null) return
        if (was == null) moves[keys[i]] = null
        else if (was !== r.rank) moves[keys[i]] = was - r.rank
      })
    }
    setCalc({ version, moves })
  }

  useEffect(() => {
    if (!enabled || sessionId == null || rows.length === 0) return
    const ranks: Record<string, number> = {}
    rows.forEach((r, i) => { if (r.rank != null) ranks[keys[i]] = r.rank })
    write({ sessionId, ranks })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, sessionId, version, rows.length])

  return { keys, moves: calc?.moves ?? {} }
}
