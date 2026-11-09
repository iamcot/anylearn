'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { worldOffset, type Size } from '@/lib/farm/scene'

/**
 * A viewport onto a garden that may be bigger than the screen. It starts with the field in view and the player drags to look around;
 * a drag never counts as a tap on a tile. When the world is as big as the screen nothing moves.
 */
export default function PanWorld({ size, world, children }: { size: Size; world: Size; children: ReactNode }) {
  const [off, setOff] = useState(() => worldOffset(size, world))
  const drag = useRef<{ x: number; y: number; ox: number; oy: number; moved: boolean; id: number } | null>(null)
  const justDragged = useRef(false)
  const bigger = world.w > size.w + 1 || world.h > size.h + 1

  useEffect(() => { setOff(worldOffset(size, world)) }, [size.w, size.h, world.w, world.h]) // eslint-disable-line react-hooks/exhaustive-deps

  const clamp = (v: number, min: number) => Math.min(Math.max(v, Math.min(min, 0)), 0)

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ touchAction: bigger ? 'none' : undefined }}
      onPointerDown={e => { if (bigger) drag.current = { x: e.clientX, y: e.clientY, ox: off.x, oy: off.y, moved: false, id: e.pointerId } }}
      onPointerMove={e => {
        const d = drag.current
        if (!d || d.id !== e.pointerId) return
        const dx = e.clientX - d.x
        const dy = e.clientY - d.y
        if (!d.moved && Math.hypot(dx, dy) > 8) { d.moved = true; try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* ignore */ } }
        if (d.moved) setOff({ x: clamp(d.ox + dx, size.w - world.w), y: clamp(d.oy + dy, size.h - world.h) })
      }}
      onPointerUp={() => { if (drag.current?.moved) { justDragged.current = true; window.setTimeout(() => { justDragged.current = false }, 0) } drag.current = null }}
      onPointerCancel={() => { drag.current = null }}
      onClickCapture={e => { if (justDragged.current) { e.stopPropagation(); e.preventDefault() } }}>
      <div className="absolute left-0 top-0" style={{ width: world.w, height: world.h, transform: `translate(${off.x}px, ${off.y}px)` }}>
        {children}
      </div>
    </div>
  )
}
