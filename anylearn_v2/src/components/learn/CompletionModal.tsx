'use client'

import VideoSuggestions from './VideoSuggestions'

interface Props {
  token: string
  itemId: number
  learnerId: number
  courseTitle: string
  onClose: () => void
  onReplay: () => void
}

/** Shown once, right after the learner finishes the last open lesson of a video course (plan 17): thanks, next courses, replay. */
export default function CompletionModal({ token, itemId, learnerId, courseTitle, onClose, onReplay }: Props) {
  return (
    <div role="dialog" aria-modal="true" aria-label="Hoàn thành khóa học" className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/60 md:items-center">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[24px] bg-bg p-5 pb-[calc(20px+env(safe-area-inset-bottom))] md:max-w-xl md:rounded-[24px]">
        <div className="text-center">
          <div className="text-5xl" aria-hidden>🎉</div>
          <h2 className="mb-1 mt-2 text-xl font-extrabold text-ink">Chúc mừng, bạn đã học xong!</h2>
          <p className="m-0 text-sm text-muted">Bạn đã hoàn thành khóa “{courseTitle}”. Chứng chỉ hoàn thành sẽ có ở bản sau.</p>
        </div>
        <VideoSuggestions token={token} itemId={itemId} learnerId={learnerId} done />
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={onReplay} className="btn btn--outline min-h-11 py-2 text-sm">Xem lại từ đầu</button>
          <button type="button" onClick={onClose} className="btn btn--green min-h-11 py-2 text-sm">Đóng</button>
        </div>
      </div>
    </div>
  )
}
