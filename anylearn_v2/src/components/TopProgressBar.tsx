export default function TopProgressBar() {
  return (
    <div role="progressbar" aria-label="Đang chuyển trang" className="fixed inset-x-0 top-[env(safe-area-inset-top)] z-[70] h-1 bg-green/20">
      <div className="nav-progress-bar h-full bg-green" />
    </div>
  )
}
