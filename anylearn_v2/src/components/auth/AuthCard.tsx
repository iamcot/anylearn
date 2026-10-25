export default function AuthCard({ title, subtitle, maxWidth = 'max-w-[420px]', children }: {
  title: string
  subtitle?: string
  maxWidth?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-8 lg:py-12">
      <div className={`w-full ${maxWidth} rounded-3xl border border-line bg-white p-6 shadow-raised sm:px-9 sm:py-10`}>
        <h1 className="m-0 mb-2 text-[28px] font-extrabold text-ink">{title}</h1>
        {subtitle && <p className="m-0 mb-7 text-muted">{subtitle}</p>}
        {children}
      </div>
    </div>
  )
}
