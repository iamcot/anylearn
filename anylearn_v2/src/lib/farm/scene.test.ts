import { describe, expect, it } from 'vitest'
import { cellCenters, compostSpot, fieldRegion, gridSize, kindOf } from './scene'

const SIZES = [{ w: 390, h: 844 }, { w: 1280, h: 800 }, { w: 1920, h: 1080 }, { w: 820, h: 1180 }]

describe('farm screen layout', () => {
  it('makes a near square grid', () => {
    expect(gridSize(5)).toEqual({ cols: 3, rows: 2 })
    expect(gridSize(13)).toEqual({ cols: 4, rows: 4 })
  })
  it('tells a phone from a desktop', () => {
    expect(kindOf(390)).toBe('mobile')
    expect(kindOf(1280)).toBe('desktop')
  })
  it.each(SIZES)('keeps every tile inside the free region (%o)', size => {
    const region = fieldRegion(size)
    for (const cells of [5, 7, 10, 13]) {
      const { tw, th, centers } = cellCenters(cells, region)
      expect(centers).toHaveLength(cells)
      for (const c of centers) {
        expect(c.x - tw / 2).toBeGreaterThanOrEqual(region.x0 - 0.01)
        expect(c.x + tw / 2).toBeLessThanOrEqual(region.x1 + 0.01)
        expect(c.y - th / 2).toBeGreaterThanOrEqual(region.y0 - 0.01)
        expect(c.y + th / 2).toBeLessThanOrEqual(region.y1 + 0.01)
      }
    }
  })
  it('draws the nearer tiles on top', () => {
    const { centers } = cellCenters(4, fieldRegion({ w: 390, h: 844 }))
    expect(centers[3].depth).toBeGreaterThan(centers[0].depth)
    expect(centers[3].y).toBeGreaterThan(centers[0].y)
  })
  it('puts the compost bin inside the screen', () => {
    const size = { w: 390, h: 844 }
    const spot = compostSpot(size, fieldRegion(size))
    expect(spot.x + spot.w / 2).toBeLessThanOrEqual(size.w)
  })
})

import { worldSize, worldOffset, MIN_TILE, fieldRegion as fr, cellCenters as cc } from './scene'
describe('pannable world', () => {
  it('equals the screen while tiles are big enough', () => {
    expect(worldSize({ w: 390, h: 800 }, 6)).toEqual({ w: 390, h: 800 })
    expect(worldOffset({ w: 390, h: 800 }, { w: 390, h: 800 })).toEqual({ x: 0, y: 0 })
  })
  it('grows (at most 3x) when many plots would shrink the tiles', () => {
    const size = { w: 360, h: 640 }
    const w = worldSize(size, 60)
    expect(w.w).toBeGreaterThan(size.w)
    expect(w.w).toBeLessThanOrEqual(size.w * 3)
    expect(cc(60, fr(w)).tw).toBeGreaterThanOrEqual(Math.min(MIN_TILE, cc(60, fr({ w: size.w * 3, h: size.h * 3 })).tw) - 1)
    const o = worldOffset(size, w)
    expect(o.x).toBeLessThanOrEqual(0)
    expect(o.x).toBeGreaterThanOrEqual(size.w - w.w)
  })
})
