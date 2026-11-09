/** Layout of the farm screen (pure, tested). The game fills the whole viewport; every length is in pixels. */
export type SceneKind = 'desktop' | 'mobile'

export interface Size { w: number; h: number }
export interface Region { cx: number; cy: number; aw: number; ah: number; x0: number; x1: number; y0: number; y1: number }

/** Width : height of the soil tile picture is 512 : 341 and its diamond fills almost all of it. */
export const TILE_RATIO = 512 / 341
/** Distance between neighbour centres as a part of the tile size: a little more than touching so the grass edges show. */
export const TILE_STEP = 0.43
/** The biggest a tile may get, so a big monitor does not blow the field up. */
export const MAX_TILE = 250

export const kindOf = (w: number): SceneKind => (w >= 1024 ? 'desktop' : 'mobile')

/** The free part of the screen: what is left once the signboard, the coin chest, the tab column and the action row are taken out. */
export function fieldRegion(size: Size): Region {
  const kind = kindOf(size.w)
  const left = kind === 'desktop' ? Math.max(24, size.w * 0.2) : 8
  const right = kind === 'desktop' ? Math.max(120, size.w * 0.1) : 76
  const top = kind === 'desktop' ? Math.max(104, size.h * 0.26) : 96
  const bottom = kind === 'desktop' ? 112 : 108
  const x0 = left
  const x1 = Math.max(size.w - right, x0 + 50)
  const y0 = top
  const y1 = Math.max(size.h - bottom, y0 + 50)
  return { x0, x1, y0, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, aw: x1 - x0, ah: y1 - y0 }
}

/** Columns and rows for a number of cells: as square as possible, wider than tall. */
export function gridSize(cells: number): { cols: number; rows: number } {
  const n = Math.max(cells, 1)
  const cols = Math.ceil(Math.sqrt(n))
  return { cols, rows: Math.ceil(n / cols) }
}

export interface Center { x: number; y: number; depth: number }

/** Tile size and the centre of every cell so the whole diamond field fits the free region. */
export function cellCenters(cells: number, region: Region, maxTile = MAX_TILE): { tw: number; th: number; centers: Center[] } {
  const { cols, rows } = gridSize(cells)
  const n = cols + rows - 2
  const fitW = region.aw / (1 + TILE_STEP * n)
  const fitH = region.ah / (1 / TILE_RATIO + (TILE_STEP / TILE_RATIO) * n)
  const tw = Math.min(fitW, fitH, maxTile)
  const th = tw / TILE_RATIO
  const dx = TILE_STEP * tw
  const dy = TILE_STEP * th
  const x0 = ((cols - 1) - (rows - 1)) * dx / 2
  const y0 = ((cols - 1) + (rows - 1)) * dy / 2
  const centers: Center[] = []
  for (let i = 0; i < Math.max(cells, 0); i++) {
    const c = i % cols
    const r = Math.floor(i / cols)
    centers.push({ x: region.cx + (c - r) * dx - x0, y: region.cy + (c + r) * dy - y0, depth: c + r })
  }
  return { tw, th, centers }
}

export interface Spot { x: number; y: number; w: number }

/** Where the compost bin stands: on the open grass in the lower right, clear of the path and the house. */
export function compostSpot(size: Size, region: Region): Spot {
  const w = Math.min(Math.max(size.w * 0.17, 84), 150)
  const x = Math.min(region.cx + region.aw * 0.36, region.x1 - w * 0.5)
  return { x, y: region.y1 - region.ah * 0.2, w }
}

/** The three slots for perennial trees: the empty lower left corner. */
export function treeSpots(region: Region, tw: number): Spot[] {
  const w = Math.min(Math.max(tw * 0.55, 40), 90)
  return [0, 1, 2].map(i => ({ x: region.x0 + w * 0.6 + i * w * 1.05, y: region.y1 - w * 0.35 - (i === 1 ? w * 0.05 : 0), w }))
}
