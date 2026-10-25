export default function SectionCard({ icon, title, action, children }: {
  icon?: React.ReactNode
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="mb-4 overflow-hidden rounded-card border border-line bg-white">
      <div className="flex items-center gap-2 border-b border-line bg-bg px-5 py-3 text-ink">
        {icon && <span className="text-green">{icon}</span>}
        <h2 className="m-0 flex-1 text-base font-extrabold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}
