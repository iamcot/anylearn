export default function AuthCard({ title, subtitle, maxWidth = 'max-w-[420px]', logo = false, children }: {
  title: string
  subtitle?: string
  maxWidth?: string
  logo?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-8 lg:py-12">
      <div className={`w-full ${maxWidth} rounded-3xl border border-line bg-white p-6 shadow-raised sm:px-9 sm:py-10`}>
        {logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/cdn/anylearn/img/LogoanyLEARN.svg" alt="anyLEARN" className="mx-auto mb-4 h-10" />
        )}
        <h1 className={`m-0 mb-2 text-[28px] font-extrabold text-ink ${logo ? 'text-center' : ''}`}>{title}</h1>
        {subtitle && <p className={`m-0 mb-7 text-muted ${logo ? 'text-center text-sm' : ''}`}>{subtitle}</p>}
        {children}
      </div>
    </div>
  )
}
