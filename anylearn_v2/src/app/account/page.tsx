'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getMeSummary, type MeSummary } from '@/lib/api'
import AccountCard from '@/components/account/AccountCard'
import { PendingOrdersPill, PointBadge } from '@/components/account/AccountBadges'
import { NAV_ITEMS } from '@/components/account/navItems'
import { ChevronRightIcon, LogoutIcon } from '@/components/icons'
import { ListSkeleton } from '@/components/PageSkeleton'

const ORDERS_HREF = '/account/orders'

function Todos({ summary }: { summary: MeSummary }) {
  if (summary.todos.length === 0) {
    return <p className="m-0 p-4 text-sm text-muted sm:p-5">Bạn không còn việc nào cần làm. 🎉</p>
  }
  return (
    <ul className="m-0 flex list-none flex-col p-0">
      {summary.todos.map(todo => (
        <li key={todo.kind} className="border-t border-line first:border-t-0">
          <Link href={todo.route} className="flex min-h-12 items-center gap-3 px-4 py-3 text-sm font-bold text-ink no-underline hover:bg-bg sm:px-5">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-red text-xs font-extrabold text-white">{todo.count}</span>
            <span className="flex-1">{todo.label}</span>
            <ChevronRightIcon className="size-4 text-muted" />
          </Link>
        </li>
      ))}
    </ul>
  )
}

function Children({ summary }: { summary: MeSummary }) {
  if (summary.children.length === 0) return null
  return (
    <AccountCard title="Các bé" subtitle="Xem khóa học, đơn hàng và sở thích của từng bé">
      <ul className="m-0 flex list-none flex-col p-0">
        {summary.children.map(child => (
          <li key={child.id} className="border-t border-line first:border-t-0">
            <Link href={`/account/children/${child.id}`} className="flex min-h-12 items-center gap-3 px-4 py-3 text-sm no-underline hover:bg-bg sm:px-5">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-soft font-extrabold text-blue">{child.name?.charAt(0).toUpperCase()}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold text-ink">{child.name}</span>
                <span className="block text-xs text-muted">{child.activeCourses > 0 ? `${child.activeCourses} khóa đang học` : 'Chưa có khóa đang học'}</span>
              </span>
              <ChevronRightIcon className="size-4 text-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </AccountCard>
  )
}

// The menu: everything the sidebar has, as a list that works with one thumb. On a desktop the sidebar is always there, so only the summary shows.
export default function AccountHomePage() {
  const { token, user, logout } = useAuth()
  const router = useRouter()
  const [summary, setSummary] = useState<MeSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    getMeSummary(token).then(data => { setSummary(data); setLoading(false) })
  }, [token])

  return (
    <div className="flex flex-col gap-3">
      {user && (
        <div className="flex items-center gap-3 rounded-card border border-line bg-white p-4 lg:hidden">
          {user.image
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={user.image} alt={user.name} className="size-12 rounded-full border-2 border-line object-cover" />
            : <div className="grid size-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue to-green text-lg font-extrabold text-white">{user.name?.charAt(0).toUpperCase()}</div>
          }
          <div className="min-w-0">
            <div className="truncate text-base font-extrabold text-ink">{user.name}</div>
            <div className="truncate text-sm text-muted">{user.phone}</div>
          </div>
        </div>
      )}

      <AccountCard title="Cần làm ngay">
        {loading ? <div className="p-5"><ListSkeleton showTitle={false} /></div> : summary ? <Todos summary={summary} /> : <p className="m-0 p-5 text-sm text-muted">Chưa tải được, vui lòng thử lại sau.</p>}
      </AccountCard>

      {summary && <Children summary={summary} />}

      <div className="lg:hidden">
        <AccountCard title="Tài khoản">
          <ul className="m-0 flex list-none flex-col p-0">
            {NAV_ITEMS.map(({ href, label, Icon, isPoint }) => (
              <li key={href} className="border-t border-line first:border-t-0">
                <Link href={href} className="flex min-h-12 items-center gap-3 px-4 py-3 text-sm font-medium text-ink no-underline hover:bg-bg">
                  <Icon className="size-[18px] shrink-0" />
                  <span className="flex-1">{label}</span>
                  {isPoint && <PointBadge points={user?.walletC ?? 0} active={false} />}
                  {href === ORDERS_HREF && <PendingOrdersPill />}
                  <ChevronRightIcon className="size-4 text-muted" />
                </Link>
              </li>
            ))}
            <li className="border-t border-line">
              <button type="button" onClick={() => { logout(); router.push('/') }}
                className="flex min-h-12 w-full cursor-pointer items-center gap-3 border-0 bg-transparent px-4 py-3 text-left text-sm font-medium text-red hover:bg-red-soft">
                <LogoutIcon className="size-[18px] shrink-0" /> Đăng xuất
              </button>
            </li>
          </ul>
        </AccountCard>
      </div>
    </div>
  )
}
