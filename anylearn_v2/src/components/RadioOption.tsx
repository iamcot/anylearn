export default function RadioOption({ name, checked, onChange, label, hint, children, disabled = false }: {
  name: string
  checked: boolean
  onChange: () => void
  label: React.ReactNode
  hint?: React.ReactNode
  children?: React.ReactNode
  disabled?: boolean
}) {
  return (
    <label className={`flex min-h-11 items-start gap-3 rounded-xl border p-3 transition-colors ${disabled ? 'cursor-not-allowed border-line bg-bg opacity-60' : checked ? 'cursor-pointer border-green bg-green-soft' : 'cursor-pointer border-line bg-white'}`}>
      <input type="radio" name={name} checked={checked} onChange={onChange} disabled={disabled} className="mt-0.5 size-[18px] shrink-0 accent-green" />
      <span className="min-w-0 flex-1">
        <span className={`block text-ink ${checked ? 'font-bold' : ''}`}>{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-muted">{hint}</span>}
        {children}
      </span>
    </label>
  )
}
