/** Layout of the farm scene (pure, tested). Lengths are in cqw: 1/100 of the scene width. */
export type SceneKind = 'desktop' | 'mobile'

export interface Decor { key: string; img: string; x: number; y: number; w: number; label?: string; soon?: boolean; action?: 'compost' | 'market' | 'orders' | 'mailbox' }

export interface SceneLayout {
  aspect: string
  height: number
  /** Where the field may be drawn: centre and size of the free lawn. */
  region: { cx: number; cy: number; aw: number; ah: number }
  maxTile: number
  font: number
  decor: Decor[]
}

/** Width : height of the soil tile picture is 512 : 341 and its diamond fills almost all of it. */
export const TILE_RATIO = 512 / 341
/** Distance between neighbour centres as a part of the tile size: a little more than touching so the grass edges show. */
export const TILE_STEP = 0.43

const LAYOUTS: Record<SceneKind, SceneLayout> = {
  desktop: {
    aspect: '16 / 9', height: 56.25, region: { cx: 43, cy: 33, aw: 54, ah: 36 }, maxTile: 30, font: 1.1,
    decor: [
      { key: 'tree1', img: 'tree_slot_empty', x: 76, y: 52, w: 9 },
      { key: 'tree2', img: 'tree_slot_empty', x: 84, y: 62, w: 9 },
      { key: 'tree3', img: 'tree_slot_empty', x: 76, y: 72, w: 9 },
    ],
  },
  mobile: {
    aspect: '4 / 5', height: 125, region: { cx: 50, cy: 66, aw: 94, ah: 56 }, maxTile: 50, font: 3,
    decor: [
      { key: 'tree1', img: 'tree_slot_empty', x: 30, y: 90, w: 17 },
      { key: 'tree2', img: 'tree_slot_empty', x: 50, y: 92, w: 17 }, { key: 'tree3', img: 'tree_slot_empty', x: 70, y: 90, w: 17 },
    ],
  },
}

export const sceneLayout = (kind: SceneKind) => LAYOUTS[kind]

/** Columns and rows for a number of cells: as square as possible, wider than tall. */
export function gridSize(cells: number): { cols: number; rows: number } {
  const n = Math.max(cells, 1)
  const cols = Math.ceil(Math.sqrt(n))
  return { cols, rows: Math.ceil(n / cols) }
}

export interface Center { x: number; y: number; depth: number }

/** Tile size and the centre of every cell (in cqw) so the whole diamond field fits the free lawn. */
export function cellCenters(cells: number, layout: SceneLayout): { tw: number; th: number; centers: Center[] } {
  const { cols, rows } = gridSize(cells)
  const n = cols + rows - 2
  const { cx, cy, aw, ah } = layout.region
  const fitW = aw / (1 + TILE_STEP * n)
  const fitH = ah / (1 / TILE_RATIO + (TILE_STEP / TILE_RATIO) * n)
  const tw = Math.min(fitW, fitH, layout.maxTile)
  const th = tw / TILE_RATIO
  const dx = TILE_STEP * tw
  const dy = TILE_STEP * th
  const x0 = ((cols - 1) - (rows - 1)) * dx / 2
  const y0 = ((cols - 1) + (rows - 1)) * dy / 2
  const centers: Center[] = []
  for (let i = 0; i < Math.max(cells, 0); i++) {
    const c = i % cols
    const r = Math.floor(i / cols)
    centers.push({ x: cx + (c - r) * dx - x0, y: cy + (c + r) * dy - y0, depth: c + r })
  }
  return { tw, th, centers }
}
