import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, ListIcon } from '@/components/icons'

export type Period = 'month' | 'week'
export type ViewMode = 'calendar' | 'list'

interface Props {
  period: Period
  viewMode: ViewMode
  label: string
  onPeriodChange: (period: Period) => void
  onViewModeChange: (mode: ViewMode) => void
  onNavigate: (direction: -1 | 1) => void
}

const SEGMENT_BASE = 'min-h-11 cursor-pointer border-0 px-3 text-xs font-medium'
const segment = (active: boolean) => `${SEGMENT_BASE} ${active ? 'bg-blue text-white' : 'bg-white text-muted'}`
const NAV_BUTTON = 'grid size-11 cursor-pointer place-items-center rounded-lg border border-line bg-white text-ink'

export default function ScheduleToolbar({ period, viewMode, label, onPeriodChange, onViewModeChange, onNavigate }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <div className="flex overflow-hidden rounded-lg border border-line">
        <button type="button" aria-pressed={period === 'month'} onClick={() => onPeriodChange('month')} className={segment(period === 'month')}>Tháng</button>
        <button type="button" aria-pressed={period === 'week'} onClick={() => onPeriodChange('week')} className={`${segment(period === 'week')} border-l border-line`}>Tuần</button>
      </div>

      <div className="flex items-center gap-1">
        <button type="button" aria-label="Kỳ trước" onClick={() => onNavigate(-1)} className={NAV_BUTTON}><ChevronLeftIcon /></button>
        <span className="min-w-[150px] text-center text-[13px] font-medium text-text">{label}</span>
        <button type="button" aria-label="Kỳ sau" onClick={() => onNavigate(1)} className={NAV_BUTTON}><ChevronRightIcon /></button>
      </div>

      <div className="flex overflow-hidden rounded-lg border border-line">
        <button type="button" aria-label="Xem dạng lịch" aria-pressed={viewMode === 'calendar'} onClick={() => onViewModeChange('calendar')} className={segment(viewMode === 'calendar')}>
          <CalendarIcon className="size-4" />
        </button>
        <button type="button" aria-label="Xem dạng danh sách" aria-pressed={viewMode === 'list'} onClick={() => onViewModeChange('list')} className={`${segment(viewMode === 'list')} border-l border-line`}>
          <ListIcon className="size-4" />
        </button>
      </div>
    </div>
  )
}
