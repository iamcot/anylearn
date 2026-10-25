interface Props {
  label: string
  hint?: React.ReactNode
  inputProps: React.InputHTMLAttributes<HTMLInputElement>
  buttonLabel: string
  onApply: () => void
  disabled?: boolean
  message?: { kind: 'success' | 'error'; text: string } | null
}

export default function ApplyRow({ label, hint, inputProps, buttonLabel, onApply, disabled, message }: Props) {
  return (
    <div>
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3">
        <label className="text-xs font-bold text-muted">{label}</label>
        {hint}
      </div>
      <div className="flex gap-2">
        <input {...inputProps} className="field min-h-11 flex-1 text-sm" />
        <button
          type="button"
          onClick={onApply}
          disabled={disabled}
          className="min-h-11 w-28 shrink-0 cursor-pointer rounded-full border border-warn-line bg-warn-soft text-xs font-bold text-ink transition-colors hover:bg-yellow/30 disabled:cursor-default disabled:opacity-60"
        >
          {buttonLabel}
        </button>
      </div>
      {message && <div className={`mt-1 text-right text-xs ${message.kind === 'success' ? 'text-green-dark' : 'text-red'}`}>{message.text}</div>}
    </div>
  )
}
