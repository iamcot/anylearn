import { farmImg } from '@/lib/farm/art'

/** A villager of the farm talking at the top of a panel: picture on the left, one or two friendly lines on the right. */
export default function NpcSays({ npc, name, children }: { npc: 'npc_bu_nhin' | 'npc_co_tho' | 'npc_be_mam' | 'npc_cho_bong'; name: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/90 p-3 ring-1 ring-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={farmImg(npc)} alt={name} className="size-20 shrink-0 object-contain" draggable={false} />
      <p className="m-0 text-sm text-muted"><b className="text-ink">{name}:</b> {children}</p>
    </div>
  )
}
