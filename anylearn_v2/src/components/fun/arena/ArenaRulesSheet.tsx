'use client'

import { useEffect } from 'react'
import BrandText from '@/components/fun/BrandText'
import type { ArenaRules } from '@/lib/api/arena'

/** The "Đấu trường Leo là gì?" bottom sheet, shared by the banner and the lobby. The numbers come from the server, so they follow the back office settings. */
export default function ArenaRulesSheet({ rules, onClose }: { rules: ArenaRules | undefined; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  const coin = rules?.coinName ?? 'Leo Xu'
  const prizes = (rules?.rewardCoins ?? []).filter(c => c > 0)
  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-navy/55" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Đấu trường Leo là gì" onClick={e => e.stopPropagation()}
        className="max-h-[88%] w-full max-w-[560px] overflow-auto rounded-t-[22px] bg-white p-5 pb-6 text-text">
        <h3 className="m-0 mb-2 text-lg font-black text-ink">Đấu trường Leo là gì?</h3>
        <p className="m-0 mb-2 text-sm">Mỗi tối, mọi người cùng trả lời một loạt câu hỏi vào cùng một lúc. Ai đúng nhiều nhất và nhanh nhất đứng đầu bảng.</p>
        <b className="text-sm">Thể thức</b>
        {rules ? (
          <ol className="my-1.5 mb-3 list-decimal space-y-1.5 pl-5 text-sm">
            <li>Bắt đầu lúc <b>{rules.startTime}</b>, gồm <b>{rules.questionCount} câu</b> từ dễ đến khó, ai cũng nhận cùng câu hỏi. Phòng mở trước {rules.openMinutes} phút.</li>
            <li>Mỗi câu có vài giây chuẩn bị rồi <b>{rules.answerSeconds} giây</b> để chọn 1 trong 4 đáp án. Không có vật phẩm trợ giúp.</li>
            <li>Đáp án đúng hiện khi hết giờ. Đúng <b>+1 điểm</b>, sai hoặc hết giờ không mất gì.</li>
            <li>Bằng điểm thì ai có tổng thời gian trả lời đúng ít hơn xếp trên.</li>
            <li>Vào trễ vẫn chơi được các câu còn lại. Không tốn năng lượng, không ảnh hưởng sao Leo rank.</li>
            {(prizes.length > 0 || rules.rewardParticipation > 0) && (
              <li>
                {prizes.length > 0 && <>Top 3 nhận <BrandText text={`${prizes.join(' / ')} ${coin}`} coinName={coin} />{rules.rewardSticker ? ' và sticker ngẫu nhiên' : ''} (cần ít nhất {rules.rewardMinScore} điểm). </>}
                {rules.rewardParticipation > 0 && <>Mọi người khác có trả lời ít nhất 1 câu nhận <b>{rules.rewardParticipation}</b> <BrandText text={coin} coinName={coin} /> thưởng tham gia.</>}
              </li>
            )}
          </ol>
        ) : <p className="text-sm text-muted">Đang tải…</p>}
        <p className="m-0 mb-3 text-[13px] text-muted">Nhấn <b>Nhắc tôi</b> để được báo trước khi bắt đầu.</p>
        <button type="button" onClick={onClose} className="min-h-11 w-full cursor-pointer rounded-2xl border-0 bg-green px-4 text-base font-extrabold text-white">Đã hiểu</button>
      </div>
    </div>
  )
}
