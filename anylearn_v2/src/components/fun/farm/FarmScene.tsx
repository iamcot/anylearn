/* eslint-disable @next/next/no-img-element */
'use client'

import type { CSSProperties } from 'react'
import type { FarmPlot, FarmView } from '@/lib/api/farm'
import { backgroundFor, cropImage, farmImg, plotImage, type TimeOfDay } from '@/lib/farm/art'
import { formatWait } from '@/lib/farm/rules'
import { cellCenters, sceneLayout, type SceneKind } from '@/lib/farm/scene'

export type DecoKey = 'compost' | 'market' | 'orders' | 'mailbox'

interface Props {
  view: FarmView
  kind: SceneKind
  tod: TimeOfDay
  elapsed: number
  selected: number | null
  hasDog: boolean
  leo: 'idle' | 'water' | 'harvest' | 'cheer'
  badges: Partial<Record<DecoKey, boolean>>
  onTile: (slot: number) => void
  onExpand: () => void
  onDeco: (key: DecoKey) => void
}

const DIAMOND = 'polygon(50% 3%, 97% 50%, 50% 97%, 3% 50%)'
const cq = (n: number) => `${n.toFixed(3)}cqw`

function chip(p: FarmPlot, elapsed: number): { text: string; tone: string } | null {
  if (p.phase === 'ripe') return { text: 'Chín rồi!', tone: 'bg-green text-white' }
  if (p.phase === 'wilting') return { text: 'Sắp héo', tone: 'bg-amber-500 text-white' }
  if (p.phase === 'growing') return { text: formatWait((p.secondsToRipe ?? 0) - elapsed / 1000), tone: 'bg-white/90 text-ink' }
  return null
}

/** The garden drawn as a field: tiles laid out isometrically over the background, crops growing on them. */
export default function FarmScene({ view, kind, tod, elapsed, selected, hasDog, leo, badges, onTile, onExpand, onDeco }: Props) {
  const layout = sceneLayout(kind)
  const cells = view.plots.length + (view.nextPlotPrice > 0 ? 1 : 0)
  const { tw, th, centers } = cellCenters(cells, layout)
  const cropOf = (k?: string) => view.crops.find(c => c.cropKey === k)
  const dense = tw < (kind === 'mobile' ? 22 : 17)
  const fontSize = `clamp(10px, ${cq(layout.font)}, 15px)`

  const box = (xPct: number, yPct: number, w: number): CSSProperties => ({ left: `${xPct}%`, top: `${yPct}%`, width: cq(w), transform: 'translate(-50%, -50%)' })

  return (
    <div className="relative mx-auto w-full select-none overflow-hidden bg-[#9be15d] lg:rounded-3xl lg:shadow-lg" style={{ containerType: 'inline-size', aspectRatio: layout.aspect, fontSize }}>
      <img src={backgroundFor(tod, kind)} alt="" className="absolute inset-0 size-full object-cover" draggable={false} />

      {layout.decor.map(d => {
        if (d.key === 'dog' && !hasDog) return null
        const interactive = d.action
        const img = <img src={farmImg(d.img)} alt="" className={`block h-auto w-full ${d.key === 'dog' ? 'animate-pulse' : ''}`} draggable={false} />
        return (
          <div key={d.key} className="absolute" style={{ ...box(d.x, d.y, d.w), zIndex: Math.round(d.y) }}>
            {interactive
              ? <button type="button" aria-label={d.label} onClick={() => onDeco(interactive)} className="relative block w-full cursor-pointer border-0 bg-transparent p-0 transition-transform active:scale-95">
                {img}
                <span className="absolute left-1/2 top-[92%] -translate-x-1/2 whitespace-nowrap rounded-full bg-white/95 px-2 py-0.5 text-[0.85em] font-extrabold text-ink shadow">{d.label}</span>
                {badges[interactive] && <span className="absolute right-[12%] top-[2%] size-3.5 animate-bounce rounded-full bg-red-500 ring-2 ring-white" aria-hidden />}
              </button>
              : img}
          </div>
        )
      })}

      {centers.map((c, i) => {
        const p = view.plots[i]
        const left = c.x - tw / 2
        const top = c.y - th / 2
        const z = 100 + c.depth
        if (!p) {
          return (
            <button key="expand" type="button" aria-label="Mở thêm ô đất" onClick={onExpand} className="absolute block cursor-pointer border-0 bg-transparent p-0"
              style={{ left: cq(left), top: cq(top), width: cq(tw), height: cq(th), zIndex: z, clipPath: DIAMOND }}>
              <img src={farmImg('plot_locked')} alt="" className="size-full object-contain" draggable={false} />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-white/95 px-2 py-0.5 text-[0.85em] font-extrabold text-ink shadow">
                + {view.nextPlotPrice}{view.level < view.nextPlotLevel ? ` · cấp ${view.nextPlotLevel}` : ''}
              </span>
            </button>
          )
        }
        const crop = cropOf(p.cropKey)
        const art = cropImage(p, crop, elapsed)
        const tag = dense && p.phase === 'growing' ? null : chip(p, elapsed)
        const spriteW = tw * (p.phase === 'ripe' || p.phase === 'wilting' ? 0.66 : 0.55)
        const spriteH = spriteW * (341 / 512)
        const sel = selected === p.slot
        return (
          <div key={p.slot} className="absolute" style={{ left: cq(left), top: cq(top), width: cq(tw), height: cq(th), zIndex: z }}>
            <img src={plotImage(p)} alt="" className={`absolute inset-0 size-full object-contain transition-[filter] ${sel ? 'drop-shadow-[0_0_6px_rgba(255,255,255,1)]' : ''}`} draggable={false} />
            {p.phase !== 'empty' && (
              <div className={`pointer-events-none absolute left-1/2 ${p.phase === 'ripe' ? 'animate-bounce [animation-duration:2.4s]' : ''}`} style={{ width: cq(spriteW), top: cq(th * 0.62 - spriteH), transform: 'translateX(-50%)' }}>
                {art
                  ? <img src={art} alt={crop?.name ?? ''} className={`block h-auto w-full ${p.phase === 'wilting' ? 'grayscale sepia' : p.phase === 'thirsty' ? 'saturate-50' : ''}`} draggable={false} />
                  : <div className="text-center leading-none" style={{ fontSize: cq(tw * 0.3) }} aria-hidden>{p.phase === 'ripe' ? crop?.emoji ?? '🌾' : p.phase === 'wilting' ? '🍂' : '🌱'}</div>}
              </div>
            )}
            {p.phase === 'empty' && (
              <span className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 font-black text-green-dark shadow" style={{ width: cq(tw * 0.16), height: cq(tw * 0.16), fontSize: cq(tw * 0.11) }} aria-hidden>+</span>
            )}
            {p.phase === 'thirsty' && (
              <img src={farmImg('icon_thirsty')} alt="Khát nước" className="pointer-events-none absolute left-1/2 animate-bounce object-contain" style={{ width: cq(tw * 0.2), top: cq(th * 0.04), transform: 'translateX(-50%)' }} draggable={false} />
            )}
            {tag && (
              <span className={`pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[0.85em] font-extrabold shadow ${tag.tone}`} style={{ top: cq(th * 0.66) }}>{tag.text}</span>
            )}
            <button type="button" aria-label={`Ô ${p.slot + 1}${crop ? `, ${crop.name}` : ', trống'}`} onClick={() => onTile(p.slot)} className="absolute inset-0 cursor-pointer border-0 bg-transparent p-0" style={{ clipPath: DIAMOND }} />
          </div>
        )
      })}

      <div className="pointer-events-none absolute" style={{ ...box(layout.leo.x, layout.leo.y, layout.leo.w), zIndex: Math.round(layout.leo.y) }}>
        <img src={farmImg(`leo_farmer_${leo}`)} alt="Leo" className="block h-auto w-full" draggable={false} />
      </div>
    </div>
  )
}
