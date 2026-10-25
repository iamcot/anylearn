export default function RadioOption({ name, checked, onChange, label, hint, children }: {
  name: string
  checked: boolean
  onChange: () => void
  label: React.ReactNode
  hint?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <label className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${checked ? 'border-green bg-green-soft' : 'border-line bg-white'}`}>
      <input type="radio" name={name} checked={checked} onChange={onChange} className="mt-0.5 size-[18px] shrink-0 accent-green" />
      <span className="min-w-0 flex-1">
        <span className={`block text-ink ${checked ? 'font-bold' : ''}`}>{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-muted">{hint}</span>}
        {children}
      </span>
    </label>
  )
}
