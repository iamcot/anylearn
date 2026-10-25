import type { SearchMode } from '@/lib/search/query'

const MODES: { key: SearchMode; label: string }[] = [
  { key: 'class', label: 'Khóa học' },
  { key: 'school', label: 'anySCHOOL' },
  { key: 'teacher', label: 'anyPROFESSOR' },
]

export default function SearchModeTabs({ mode, onChange }: { mode: SearchMode; onChange: (mode: SearchMode) => void }) {
  return (
    <div className="bg-bg pt-4">
      <div className="container flex gap-1">
        {MODES.map(item => {
          const active = mode === item.key
          return (
            <button
              key={item.key}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(item.key)}
              className={`relative min-h-11 cursor-pointer whitespace-nowrap rounded-t-[10px] border border-b-0 px-3 text-[13px] sm:px-4 font-medium transition-colors ${
                active ? 'z-[2] -mb-px border-transparent bg-gradient-to-br from-blue to-green text-white' : 'z-[1] border-line bg-white text-muted'
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
