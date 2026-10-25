const TONE_CLASS = {
  error: 'border-red-line bg-red-soft text-red',
  success: 'border-green-line bg-green-soft text-green-dark',
}

export default function Alert({ kind, children, className = '' }: { kind: 'error' | 'success'; children: React.ReactNode; className?: string }) {
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={`rounded-xl border px-3.5 py-2.5 text-sm ${TONE_CLASS[kind]} ${className}`}>
      {children}
    </div>
  )
}
