export default function AccountCard({ title, subtitle, action, children }: {
  title: React.ReactNode
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <div>
          <h2 className="m-0 text-lg font-extrabold text-ink">{title}</h2>
          {subtitle && <p className="m-0 mt-1 text-xs text-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}
