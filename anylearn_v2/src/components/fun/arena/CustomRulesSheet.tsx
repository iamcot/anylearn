'use client'

import { useEffect, useState } from 'react'
import type { ArenaCustomRules } from '@/lib/api/arena'
import { dayLabel, timeText } from '@/lib/arena/timeline'

/** "Đấu trường riêng là gì?": the short explanation of an arena the back office runs by hand. Numbers come from the server. */
export default function CustomRulesSheet({ rules, onClose }: { rules: ArenaCustomRules | undefined; onClose: () => void }) {
  const [now] = useState(() => Date.now())
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-navy/55" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Đấu trường riêng là gì" onClick={e => e.stopPropagation()}
        className="max-h-[88%] w-full max-w-[560px] overflow-auto rounded-t-[22px] bg-white p-5 pb-6 text-text">
        <h3 className="m-0 mb-2 text-lg font-black text-ink">Đấu trường riêng là gì?</h3>
        <p className="m-0 mb-2 text-sm">Đây là một trận đấu do anyLEARN tổ chức riêng, không phải trận hằng ngày. Ban tổ chức sẽ bắt đầu khi mọi người đã sẵn sàng.</p>
        <b className="text-sm">Thể thức</b>
        <ol className="my-1.5 mb-3 list-decimal space-y-1.5 pl-5 text-sm">
          {rules?.expectedAt != null && <li>Dự kiến bắt đầu lúc <b>{timeText(rules.expectedAt)} {dayLabel(rules.expectedAt, now)}</b>. Thời gian có thể thay đổi, ban tổ chức bấm bắt đầu thì có 1 phút đếm ngược.</li>}
          {rules?.expectedAt == null && <li>Ban tổ chức bấm bắt đầu khi sẵn sàng, sau đó có 1 phút đếm ngược.</li>}
          <li>Bạn có thể vào phòng bất cứ lúc nào để chờ. Gồm <b>{rules?.questionCount ?? '…'} câu</b>, ai cũng nhận cùng câu hỏi theo cùng thứ tự.</li>
          <li>Mỗi câu có <b>{rules?.answerSeconds ?? '…'} giây</b> để chọn 1 trong 4 đáp án. Đáp án đúng hiện khi hết giờ. Đúng <b>+1 điểm</b>, sai hoặc hết giờ không mất gì.</li>
          <li>Bằng điểm thì ai có tổng thời gian trả lời đúng ít hơn xếp trên.</li>
          <li>Bảng xếp hạng chỉ có những người chơi trận này. Phần thưởng (nếu có) do ban tổ chức thông báo.</li>
        </ol>
        <button type="button" onClick={onClose} className="min-h-11 w-full cursor-pointer rounded-2xl border-0 bg-[#6d28d9] px-4 text-base font-extrabold text-white">Đã hiểu</button>
      </div>
    </div>
  )
}
