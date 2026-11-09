import { describe, expect, it } from 'vitest'
import { cellCenters, gridSize, sceneLayout } from './scene'

describe('farm scene layout', () => {
  it('makes a near square grid', () => {
    expect(gridSize(5)).toEqual({ cols: 3, rows: 2 })
    expect(gridSize(13)).toEqual({ cols: 4, rows: 4 })
  })
  it.each(['desktop', 'mobile'] as const)('keeps every tile inside the free lawn (%s)', kind => {
    const layout = sceneLayout(kind)
    for (const cells of [5, 7, 10, 13]) {
      const { tw, th, centers } = cellCenters(cells, layout)
      expect(centers).toHaveLength(cells)
      const { cx, cy, aw, ah } = layout.region
      for (const c of centers) {
        expect(c.x - tw / 2).toBeGreaterThanOrEqual(cx - aw / 2 - 0.01)
        expect(c.x + tw / 2).toBeLessThanOrEqual(cx + aw / 2 + 0.01)
        expect(c.y - th / 2).toBeGreaterThanOrEqual(cy - ah / 2 - 0.01)
        expect(c.y + th / 2).toBeLessThanOrEqual(cy + ah / 2 + 0.01)
      }
    }
  })
  it('draws the nearer tiles on top', () => {
    const { centers } = cellCenters(4, sceneLayout('mobile'))
    expect(centers[3].depth).toBeGreaterThan(centers[0].depth)
    expect(centers[3].y).toBeGreaterThan(centers[0].y)
  })
})
