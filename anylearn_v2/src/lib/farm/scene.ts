/** Layout of the farm scene (pure, tested). Lengths are in cqw: 1/100 of the scene width. */
export type SceneKind = 'desktop' | 'mobile'

export interface Decor { key: string; img: string; x: number; y: number; w: number; label?: string; action?: 'compost' | 'market' | 'orders' | 'mailbox' }

export interface SceneLayout {
  aspect: string
  height: number
  /** Where the field may be drawn: centre and size of the free lawn. */
  region: { cx: number; cy: number; aw: number; ah: number }
  maxTile: number
  font: number
  leo: { x: number; y: number; w: number }
  decor: Decor[]
}

/** Width : height of the soil tile picture is 512 : 341 and its diamond fills almost all of it. */
export const TILE_RATIO = 512 / 341
/** Distance between neighbour centres as a part of the tile size: a little more than touching so the grass edges show. */
export const TILE_STEP = 0.43

const LAYOUTS: Record<SceneKind, SceneLayout> = {
  desktop: {
    aspect: '16 / 9', height: 56.25, region: { cx: 50, cy: 34, aw: 58, ah: 36 }, maxTile: 28, font: 1.1,
    leo: { x: 30, y: 80, w: 7 },
    decor: [
      { key: 'well', img: 'well', x: 37, y: 31, w: 8 },
      { key: 'compost', img: 'compost_bin', x: 12, y: 52, w: 11, label: 'Thùng ủ', action: 'compost' },
      { key: 'chicken', img: 'pet_ga_bong', x: 23, y: 64, w: 4.5 },
      { key: 'orders', img: 'order_board', x: 13, y: 70, w: 8, label: 'Đơn hàng', action: 'orders' },
      { key: 'market', img: 'market_stall', x: 88, y: 63, w: 14, label: 'Chợ', action: 'market' },
      { key: 'mailbox', img: 'mailbox_neighbor', x: 67, y: 30, w: 6.5, label: 'Hàng xóm', action: 'mailbox' },
      { key: 'scarecrow', img: 'npc_bu_nhin', x: 82, y: 46, w: 5 },
      { key: 'dog', img: 'npc_cho_bong', x: 72, y: 82, w: 6 },
    ],
  },
  mobile: {
    aspect: '4 / 5', height: 125, region: { cx: 50, cy: 70, aw: 96, ah: 58 }, maxTile: 46, font: 3,
    leo: { x: 36, y: 87, w: 15 },
    decor: [
      { key: 'well', img: 'well', x: 33, y: 30, w: 16 },
      { key: 'compost', img: 'compost_bin', x: 14, y: 37, w: 22, label: 'Thùng ủ', action: 'compost' },
      { key: 'market', img: 'market_stall', x: 85, y: 41, w: 25, label: 'Chợ', action: 'market' },
      { key: 'orders', img: 'order_board', x: 87, y: 68, w: 15, label: 'Đơn hàng', action: 'orders' },
      { key: 'mailbox', img: 'mailbox_neighbor', x: 13, y: 68, w: 15, label: 'Hàng xóm', action: 'mailbox' },
      { key: 'chicken', img: 'pet_ga_bong', x: 60, y: 88, w: 9 },
      { key: 'dog', img: 'npc_cho_bong', x: 72, y: 86, w: 12 },
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
