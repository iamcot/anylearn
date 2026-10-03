'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const NAV_ITEMS = [
  { href: '/account/anypoint', label: 'anyPoint', icon: '🟡', isPoint: true },
  { href: '/account/profile', label: 'Thông tin cá nhân', icon: '👤' },
  { href: '/account/children', label: 'Tài khoản của con', icon: '👶' },
  { href: '/account/orders', label: 'Đơn hàng của tôi', icon: '📦' },
  { href: '/account/schedule', label: 'Lịch học', icon: '📅' },
  { href: '/account/course-codes', label: 'Mã code khóa học', icon: '🔑' },
  { href: '/account/change-password', label: 'Đổi mật khẩu', icon: '🔒' },
]

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthLoading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isAuthLoading && !user) router.push('/login')
  }, [isAuthLoading, user, router])

  if (isAuthLoading || !user) return null

  return (
    <div className="section section--soft min-h-[80vh]">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">

          {/* Sidebar */}
          <aside className="h-fit">
            <div className="bg-white border border-line rounded-card overflow-hidden sticky top-24">
              {/* User info */}
              <div className="p-5 border-b border-line flex items-center gap-3">
                {user.image
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={user.image} alt={user.name} className="w-12 h-12 rounded-full object-cover border-2 border-line" />
                  : <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue to-green grid place-items-center text-white font-black text-lg shrink-0">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                }
                <div className="overflow-hidden">
                  <div className="font-black text-ink text-sm truncate">{user.name}</div>
                  <div className="text-xs text-muted truncate">{user.phone}</div>
                </div>
              </div>

              {/* Nav */}
              <nav className="py-2">
                {NAV_ITEMS.map(item => {
                  const active = pathname === item.href
                  return (
                    <Link key={item.href} href={item.href}
                      className={`flex items-center gap-3 px-5 py-3 text-sm no-underline transition-colors
                        ${active
                          ? 'bg-blue-soft text-blue font-bold border-l-[3px] border-blue'
                          : 'text-text hover:bg-bg font-medium border-l-[3px] border-transparent'
                        }`}>
                      <span>{item.icon}</span>
                      <span className="flex-1">{item.label}</span>
                      {'isPoint' in item && item.isPoint && (
                        <span className={`text-xs font-black px-2 py-0.5 rounded-full ${active ? 'bg-blue text-white' : 'bg-yellow/20 text-ink'}`}>
                          {(user.walletC ?? 0).toLocaleString()}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </nav>

              {/* Logout */}
              <div className="border-t border-line py-2">
                <button
                  onClick={() => { logout(); router.push('/') }}
                  className="w-full flex items-center gap-3 px-5 py-3 text-sm text-red font-medium border-0 bg-transparent cursor-pointer hover:bg-red-soft transition-colors text-left">
                  <span>🚪</span> Đăng xuất
                </button>
              </div>
            </div>
          </aside>

          {/* Content */}
          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  )
}
