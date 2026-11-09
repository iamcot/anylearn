/* eslint-disable @next/next/no-img-element */
import { farmImg } from '@/lib/farm/art'

/** Pictures that exist as `<crop>_product`; others show their emoji on the badge. */
const BADGE_KEYS = new Set([
  'ca_rot_cau_vong', 'rau_mam', 'bap_rang', 'khoai_cuoi', 'hoa_nang_mai', 'hoa_not_nhac', 'cay_chu_cai', 'ca_chua_bong_bay', 'cay_tri_thuc', 'day_so_dem',
  'huong_duong_cuoi', 'ot_tia_lua', 'tulip_anh_trang', 'bi_den_long', 'bui_dau_sao_bang', 'cay_cam_mat_troi', 'cay_tao_ngoi_sao', 'cay_thong_keo_gay',
])

/** A seed bag for one crop: the shared bag picture with the crop's own fruit stuck on the front, so every seed looks different. */
export default function SeedBag({ cropKey, emoji, className = 'size-14' }: { cropKey: string; emoji?: string | null; className?: string }) {
  return (
    <span className={`relative inline-block shrink-0 ${className}`} aria-hidden>
      <img src={farmImg(cropKey === 'cay_tri_thuc' ? 'item_knowledge_seed' : 'item_seed_packet')} alt="" className="size-full object-contain drop-shadow" draggable={false} />
      {cropKey !== 'cay_tri_thuc' && (
        <span className="absolute bottom-[8%] left-1/2 flex size-[48%] -translate-x-1/2 items-center justify-center rounded-full bg-white/90 shadow ring-1 ring-black/10">
          {BADGE_KEYS.has(cropKey)
            ? <img src={farmImg(`${cropKey}_product`)} alt="" className="size-[85%] object-contain" draggable={false} />
            : <span className="text-[0.9em] leading-none">{emoji ?? '🌱'}</span>}
        </span>
      )}
    </span>
  )
}
