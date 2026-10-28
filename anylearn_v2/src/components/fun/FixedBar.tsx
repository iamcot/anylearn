/**
 * Actions that stay in view at the bottom of a Vui học page, just above the bottom tabs.
 * `position: fixed` on purpose: `sticky` does not hold on iPhone Safari under the page's `overflow-x: hidden`.
 * The page needs bottom padding (pb-28) so the last content is not hidden behind it.
 */
export default function FixedBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--app-tabs-h,0px)+var(--compare-bar-h,0px)+0.5rem)] z-30 lg:bottom-4">
      <div className="pointer-events-auto mx-auto max-w-[720px] px-4 lg:px-0">{children}</div>
    </div>
  )
}
