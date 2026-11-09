/* eslint-disable @next/next/no-img-element */
'use client'

import type { FarmPlot, FarmProgress, FarmView } from '@/lib/api/farm'
import { backgroundFor, cropImage, farmImg, plotImage, type TimeOfDay } from '@/lib/farm/art'
import { formatWait, secondsUntil } from '@/lib/farm/rules'
import { cellCenters, compostSpot, fieldRegion, treeSpots, TREE_SLOT_LEVELS, type SceneKind, type Size } from '@/lib/farm/scene'

interface Props {
  view: FarmView
  progress: FarmProgress
  size: Size
  kind: SceneKind
  tod: TimeOfDay
  elapsed: number
  selected: number | null
  onTile: (slot: number) => void
  onExpand: () => void
  onCompost: () => void
}

const DIAMOND = 'polygon(50% 3%, 97% 50%, 50% 97%, 3% 50%)'
const px = (n: number) => `${n.toFixed(1)}px`
/** Highest layer of the scene: timer pills sit above every tile so no soil covers them. */
const OVERLAY_Z = 600

function timerText(p: FarmPlot, elapsed: number): { text: string; tone: string } | null {
  if (p.phase === 'ripe') return { text: 'Chín rồi!', tone: 'bg-green/80 text-white' }
  if (p.phase === 'wilting') return { text: 'Sắp héo', tone: 'bg-amber-500/80 text-white' }
  if (p.phase === 'growing') return { text: formatWait((p.secondsToRipe ?? 0) - elapsed / 1000), tone: 'bg-white/50 text-ink' }
  return null
}

/** A small tool tilted and bobbing above a plant: the can when it is thirsty, the fertilizer when it can be fed. */
function Hint({ img, x, y, w }: { img: string; x: number; y: number; w: number }) {
  return (
    <div className="pointer-events-none absolute" style={{ left: px(x), top: px(y), width: px(w), transform: 'translate(-50%, -100%)', zIndex: OVERLAY_Z }}>
      <div className="relative">
        <span className="absolute -inset-[30%] animate-pulse rounded-full bg-white/55 blur-[3px] ring-2 ring-white/70 [animation-duration:1.4s]" aria-hidden />
        <div className="relative -rotate-[25deg]"><div className="animate-bounce [animation-duration:1.6s]"><img src={farmImg(img)} alt="" className="block h-auto w-full drop-shadow-[0_0_5px_rgba(255,255,255,1)]" draggable={false} /></div></div>
      </div>
    </div>
  )
}

/** The garden as a game screen: the background fills the viewport and the tiles lie on the grass, nothing else around them. */
export default function FarmScene({ view, progress, size, kind, tod, elapsed, selected, onTile, onExpand, onCompost }: Props) {
  const region = fieldRegion(size)
  const cells = view.plots.length + (view.nextPlotPrice > 0 ? 1 : 0)
  const { tw, th, centers } = cellCenters(cells, region)
  const cropOf = (k?: string) => view.crops.find(c => c.cropKey === k)
  const dense = tw < (kind === 'mobile' ? 44 : 60)
  const canFeed = (view.inventory.fertilizer ?? 0) > 0
  const bin = compostSpot(size, region)
  const binH = bin.w * 0.75
  const labelStroke = '[text-shadow:-1px_-1px_0_#4a2a10,1px_-1px_0_#4a2a10,-1px_1px_0_#4a2a10,1px_1px_0_#4a2a10]'
  const active = progress.compost.active
  const binLeft = active && !active.ready ? secondsUntil(active.readyAt, progress.serverNow, elapsed) : 0
  const trees = treeSpots(region, tw)
  const npcW = Math.min(Math.max(size.w * 0.09, 44), 84)
  const npcs = [
    { img: 'npc_bu_nhin', x: region.x0 + region.aw * 0.3, delay: 0 },
    { img: 'npc_co_tho', x: region.x0 + region.aw * 0.5, delay: 0.7 },
    { img: 'npc_be_mam', x: region.x0 + region.aw * 0.68, delay: 1.4 },
    ...(progress.hasDog ? [{ img: 'npc_cho_bong', x: region.x0 + region.aw * 0.84, delay: 0.3 }] : []),
  ]
  const pill = 'whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-extrabold shadow'

  return (
    <div className="absolute inset-0 select-none overflow-hidden bg-[#9be15d]">
      <img src={backgroundFor(tod, kind)} alt="" className={`absolute inset-0 size-full object-cover ${kind === 'mobile' ? 'object-[72%_top]' : ''}`} draggable={false} />

      {trees.map((t, i) => (
        <div key={i} className="pointer-events-none absolute" style={{ left: px(t.x), top: px(t.y), width: px(t.w), transform: 'translate(-50%, -100%)', zIndex: 50 + i }}>
          <img src={farmImg('tree_slot_empty')} alt="" className={`block h-auto w-full ${view.level < TREE_SLOT_LEVELS[i] ? 'opacity-50 grayscale' : ''}`} draggable={false} />
          {view.level < TREE_SLOT_LEVELS[i] && (
            <span className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${pill} bg-white/70 text-ink`}>Cấp {TREE_SLOT_LEVELS[i]}</span>
          )}
        </div>
      ))}

      <button type="button" aria-label="Thùng ủ phân" onClick={onCompost} className="absolute block cursor-pointer border-0 bg-transparent p-0" style={{ left: px(bin.x), top: px(bin.y), width: px(bin.w), height: px(binH), transform: 'translate(-50%, -50%)', zIndex: 90 }}>
        <img src={farmImg('compost_bin')} alt="" className="size-full object-contain drop-shadow" draggable={false} />
      </button>
      <span className={`pointer-events-none absolute -translate-x-1/2 whitespace-nowrap text-[11px] font-extrabold text-white ${labelStroke}`} style={{ left: px(bin.x), top: px(bin.y + binH * 0.5 - 2), zIndex: 91 }}>Thùng ủ phân</span>
      {active && (
        <span className={`pointer-events-none absolute ${pill} ${active.ready ? 'bg-green/90 text-white' : 'bg-white/50 text-ink'}`} style={{ left: px(bin.x), top: px(bin.y - binH * 0.5 - 4), transform: 'translate(-50%, -100%)', zIndex: OVERLAY_Z }}>
          {active.ready ? 'Nhận phân' : formatWait(binLeft)}
        </span>
      )}

      {/* friends of the farm stand on the grass strip under the field (no taps, only company) */}
      {npcs.map(n => (
        <img key={n.img} src={farmImg(n.img)} alt="" draggable={false} className="pointer-events-none absolute animate-bounce object-contain drop-shadow [animation-duration:3.2s]"
          style={{ left: px(n.x), top: px(region.y1 + 4), width: px(npcW), transform: 'translate(-50%, -100%)', zIndex: 95, animationDelay: `${n.delay}s` }} />
      ))}

      {centers.map((c, i) => {
        const p = view.plots[i]
        const left = c.x - tw / 2
        const top = c.y - th / 2
        const z = 100 + c.depth
        if (!p) {
          return (
            <button key="expand" type="button" aria-label="Mở thêm ô đất" onClick={onExpand} className="absolute block cursor-pointer border-0 bg-transparent p-0"
              style={{ left: px(left), top: px(top), width: px(tw), height: px(th), zIndex: z, clipPath: DIAMOND }}>
              <img src={farmImg('plot_locked')} alt="" className="size-full object-contain" draggable={false} />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-white/50 px-2 py-0.5 text-xs font-extrabold text-ink shadow">
                {view.level < view.nextPlotLevel ? `Cấp ${view.nextPlotLevel}` : `+ ${view.nextPlotPrice}`}
              </span>
            </button>
          )
        }
        const crop = cropOf(p.cropKey)
        const art = cropImage(p, crop, elapsed)
        const spriteW = tw * (p.phase === 'ripe' || p.phase === 'wilting' ? 0.66 : 0.55)
        const sel = selected === p.slot
        return (
          <div key={p.slot} className="pointer-events-none absolute" style={{ left: px(left), top: px(top), width: px(tw), height: px(th), zIndex: z }}>
            <img src={plotImage(p)} alt="" className={`absolute inset-0 size-full object-contain transition-[filter] ${sel ? 'drop-shadow-[0_0_6px_rgba(255,255,255,1)]' : ''}`} draggable={false} />
            {p.phase !== 'empty' && (
              <div className="pointer-events-none absolute left-1/2" style={{ width: px(spriteW), bottom: px(th * 0.38), transform: 'translateX(-50%)' }}><div className={p.phase === 'ripe' ? 'animate-bounce [animation-duration:2.4s]' : ''}>
                {art
                  ? <img src={art} alt={crop?.name ?? ''} className={`block h-auto w-full ${p.phase === 'wilting' ? 'grayscale sepia' : p.phase === 'thirsty' ? 'saturate-50' : ''}`} draggable={false} />
                  : <div className="text-center leading-none" style={{ fontSize: px(tw * 0.3) }} aria-hidden>{p.phase === 'ripe' ? crop?.emoji ?? '🌾' : p.phase === 'wilting' ? '🍂' : '🌱'}</div>}
              </div></div>
            )}
            {p.phase === 'empty' && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <img src={farmImg('item_seed_packet')} alt="" className="animate-bounce object-contain drop-shadow [animation-duration:2.2s]" style={{ width: px(tw * 0.15), marginTop: px(-th * 0.08) }} draggable={false} />
              </div>
            )}
            <button type="button" aria-label={`Ô ${p.slot + 1}${crop ? `, ${crop.name}` : ', trống'}`} onClick={() => onTile(p.slot)} className="pointer-events-auto absolute inset-0 cursor-pointer border-0 bg-transparent p-0" style={{ clipPath: DIAMOND }} />
          </div>
        )
      })}

      {/* everything that must never be covered by a neighbour's soil */}
      {centers.map((c, i) => {
        const p = view.plots[i]
        if (!p) return null
        const spriteW = tw * (p.phase === 'ripe' || p.phase === 'wilting' ? 0.66 : 0.55)
        const topOfPlant = c.y - th * 0.36
        const tag = dense && p.phase === 'growing' ? null : timerText(p, elapsed)
        const feed = p.phase === 'growing' && !p.fertilized && canFeed
        return (
          <div key={p.slot}>
            {p.phase === 'thirsty' && <Hint img="tool_can_1" x={c.x} y={topOfPlant} w={Math.max(tw * 0.22, 26)} />}
            {feed && <Hint img="item_fertilizer" x={c.x} y={topOfPlant} w={Math.max(tw * 0.2, 24)} />}
            {tag && (
              <span className={`pointer-events-none absolute -translate-x-1/2 ${pill} ${tag.tone}`} style={{ left: px(c.x), top: px(c.y + th * 0.16), zIndex: OVERLAY_Z + 1 }}>{tag.text}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
