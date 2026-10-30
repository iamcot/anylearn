import { Avatar, Badge, Dropdown, Flex, Layout, List, Menu, Popover, Spin, Typography } from 'antd'
import {
  RobotOutlined, AuditOutlined, BankOutlined, CreditCardOutlined, BellOutlined, BookOutlined, CalendarOutlined, DashboardOutlined, DollarOutlined, FileTextOutlined,
  CustomerServiceOutlined, FundOutlined, LineChartOutlined, SearchOutlined, LogoutOutlined, MailOutlined, ApiOutlined, OrderedListOutlined, SettingOutlined, SolutionOutlined, SwapOutlined,
  TeamOutlined, UserOutlined, MessageOutlined, CrownOutlined, GiftOutlined, TrophyOutlined, CompassOutlined,
} from '@ant-design/icons'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import UploadTray from './UploadTray'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import client from '../api/client'
import logo from '/LogoanyLEARN.svg'
import '../styles/themes.css'

// Grouped by what the team does: orders and money first, then members and what they ask for, then courses, then content and insights.
const NAV_GROUPS = [
  { key: 'g-home', type: 'group', label: null, children: [
    { key: '/dashboard',        icon: <DashboardOutlined />,   label: 'Tổng quan'  },
  ] },
  { key: 'g-orders', type: 'group', label: 'Đơn hàng', children: [
    { key: '/orders',           icon: <OrderedListOutlined />, label: 'Đơn hàng'  },
    { key: '/transactions',     icon: <SwapOutlined />,        label: 'anyPoints'  },
    { key: '/finance',          icon: <FundOutlined />,        label: 'Tài chính'  },
  ] },
  { key: 'g-requests', type: 'group', label: 'Quản lý thành viên', children: [
    { key: '/users',            icon: <TeamOutlined />,        label: 'Thành viên' },
    { key: '/activities',       icon: <SolutionOutlined />,    label: 'Hoạt động' },
    { key: '/schedule-requests', icon: <CustomerServiceOutlined />, label: 'Nghỉ / đổi lịch' },
  ] },
  { key: 'g-courses', type: 'group', label: 'Khóa học', children: [
    { key: '/items',            icon: <BookOutlined />,        label: 'Khóa học'   },
    { key: '/schedule-monitor', icon: <CalendarOutlined />,    label: 'Lịch học'   },
  ] },
  { key: 'g-content', type: 'group', label: 'Nội dung & phân tích', children: [
    { key: '/articles',         icon: <FileTextOutlined />,    label: 'Bài viết'   },
    { key: '/search-insights',  icon: <LineChartOutlined />,   label: 'Xu hướng nhu cầu' },
    { key: '/acquisition',      icon: <FundOutlined />,        label: 'Nguồn khách' },
    { key: '/landing-pages',    icon: <FileTextOutlined />,    label: 'Trang đích' },
    { key: '/ai-suggestions',   icon: <RobotOutlined />,       label: 'Gợi ý AI' },
    { key: '/ai-usage',         icon: <RobotOutlined />,       label: 'Dùng AI (token)' },
  ] },
  { key: 'g-fun', type: 'group', label: 'Giải trí', children: [
    { key: '/fun-events',       icon: <TrophyOutlined />,      label: 'Vui học' },
    { key: '/fun-arena',        icon: <TrophyOutlined />,      label: 'Đấu trường Leo' },
    { key: '/explore',          icon: <CompassOutlined />,     label: 'Khám phá' },
  ] },
]
// Opened from buttons on the "Vui học" page, not from the menu.
const FUN_SUBPAGES = ['/fun-checkin', '/quiz-bank', '/quiz-game', '/stickers', '/fun-coins', '/fun-shop', '/achievements']
const NAV_ITEMS = NAV_GROUPS.flatMap(group => group.children)

// A member with "Duyệt nội dung" (plan 19.A5) only sees Khám phá (posts, comments, social queue); the server refuses the rest.
const REVIEWER_PAGES = ['/explore']
const isReviewerPage = path => REVIEWER_PAGES.some(page => path === page || path.startsWith(`${page}/`))

// Things people ask the team for sit in the top bar, left of the bell, with the red number of what waits.
const HEADER_LINKS = [
  { key: '/course-requests', icon: <SearchOutlined />, label: 'Nhờ tìm' },
  { key: '/price-reports',   icon: <DollarOutlined />, label: 'Rẻ hơn' },
  { key: '/chat',            icon: <MessageOutlined />, label: 'Chat lớp' },
]

// Pages opened from the course list belong to "Khóa học" in the menu.
const COURSE_SUBPAGES = ['/tags', '/item-gaps', '/reviews', '/collections', '/pathways']

// The red number on a menu item: how many records wait for the team (key = path, value = field of GET /admin/badges).
const BADGE_FIELDS = {
  '/orders': 'orders',
  '/transactions': 'transactions',
  '/activities': 'activities',
  '/schedule-requests': 'scheduleRequests',
  '/course-requests': 'courseRequests',
  '/price-reports': 'priceReports',
  '/chat': 'chatReports',
  '/fun-events': ['stickerReview', 'quizFlagged', 'arenaFlagged'],
  '/fun-arena': 'arenaFlagged',
  '/explore': ['exploreReports', 'explorePending', 'socialQueue'],
}

function withBadges(groups, counts) {
  return groups.map(group => ({
    ...group,
    children: group.children.map(item => {
      const fields = [].concat(BADGE_FIELDS[item.key] ?? [])
      const count = fields.reduce((sum, f) => sum + (counts?.[f] ?? 0), 0)
      if (!count) return item
      return { ...item, label: <Flex justify="space-between" align="center"><span>{item.label}</span><Badge count={count} overflowCount={999} size="small" /></Flex> }
    }),
  }))
}

const SETTINGS_MENU = [
  {
    key: 'email-settings',
    icon: <MailOutlined />,
    label: 'Cài đặt email',
    onClick: () => {},  // onClick set dynamically in component (needs navigate)
  },
  {
    key: 'zalo',
    icon: <ApiOutlined />,
    label: 'Kết nối Zalo OA',
    onClick: async () => {
      try {
        const res = await client.get('/admin/zns/authorize')
        const url = res.data?.data?.url
        if (url) window.open(url, '_blank')
      } catch { alert('Không thể lấy link Zalo OA') }
    },
  },
]

export default function AppShell() {
  const { user, logout } = useAuth()
  const isAdmin = user?.role === 'admin'
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifItems, setNotifItems] = useState([])
  const [notifLoading, setNotifLoading] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const esRef = useRef(null)

  // Drag-to-scroll for all horizontal tables
  useEffect(() => {
    const onMouseDown = (e) => {
      if (e.button !== 0) return
      const body = e.target.closest('.ant-table-content')
      if (!body) return

      const startX = e.pageX
      const startLeft = body.scrollLeft
      let dragged = false

      const onMove = (e) => {
        const dx = e.pageX - startX
        if (!dragged && Math.abs(dx) > 5) {
          dragged = true
          body.style.cursor = 'grabbing'
          body.style.userSelect = 'none'
        }
        if (dragged) body.scrollLeft = startLeft - dx
      }

      const onUp = () => {
        if (dragged) {
          body.style.cursor = ''
          body.style.userSelect = ''
          // Block the click that follows mouseup so row onClick doesn't fire
          const suppress = (e) => { e.stopPropagation(); document.removeEventListener('click', suppress, true) }
          document.addEventListener('click', suppress, true)
        }
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }

      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    }

    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  useEffect(() => {
    if (!user) return
    const fetchCount = () =>
      client.get('/api/user/notification', { params: { page: 0 } })
        .then(r => setUnreadCount(r.data?.data?.unread ?? 0))
        .catch(() => {})
    fetchCount()

    const apiToken = user.apiToken
    if (!apiToken) return
    const es = new EventSource(`/v2/api/user/notification/stream?api_token=${apiToken}`)
    esRef.current = es
    es.addEventListener('notification', () => fetchCount())
    es.onerror = () => es.close()
    return () => { es.close(); esRef.current = null }
  }, [user])

  function markAllRead() {
    client.post('/api/user/notification/mark-all-read').catch(() => {})
    setUnreadCount(0)
    setNotifItems(prev => prev.map(n => ({ ...n, read: n.read ?? new Date().toISOString() })))
  }

  const settingsMenu = [
    { key: 'g-notify', type: 'group', label: 'Thông báo', children: [
      ...SETTINGS_MENU.map(item =>
        item.key === 'email-settings' ? { ...item, onClick: () => navigate('/settings') } : item
      ),
      { key: 'notification-recipients', icon: <BellOutlined />, label: 'Người nhận thông báo admin', onClick: () => navigate('/notification-recipients') },
    ] },
    { key: 'g-ops', type: 'group', label: 'Vận hành', children: [
      { key: 'operations', icon: <SettingOutlined />, label: 'Cấu hình tìm kiếm & đơn hàng', onClick: () => navigate('/operations') },
      { key: 'membership', icon: <CrownOutlined />, label: 'Hạng & ưu đãi gia đình', onClick: () => navigate('/membership') },
      { key: 'content-reviewers', icon: <TeamOutlined />, label: 'Người duyệt nội dung', onClick: () => navigate('/content-reviewers') },
    ] },
    { key: 'g-money', type: 'group', label: 'Thanh toán', children: [
      { key: 'bank-account', icon: <BankOutlined />, label: 'Tài khoản ngân hàng', onClick: () => navigate('/bank-account') },
      { key: 'payment-methods', icon: <CreditCardOutlined />, label: 'Phương thức thanh toán', onClick: () => navigate('/payment-methods') },
      { key: 'audit', icon: <AuditOutlined />, label: 'Kiểm toán anyPoint', onClick: () => navigate('/audit') },
    ] },
  ]

  const selectedKey = COURSE_SUBPAGES.some(path => location.pathname.startsWith(path))
    ? '/items'
    : FUN_SUBPAGES.some(path => location.pathname.startsWith(path))
      ? '/fun-events'
      : HEADER_LINKS.some(link => location.pathname.startsWith(link.key)) || location.pathname.startsWith('/membership')
        ? ''
        : NAV_ITEMS.find(i => location.pathname.startsWith(i.key))?.key ?? '/dashboard'

  const { data: badgeCounts, refetch: refetchBadges } = useQuery({
    queryKey: ['admin-badges'],
    queryFn: () => client.get('/admin/badges').then(r => r.data?.data ?? {}),
    refetchInterval: 60_000,
    enabled: Boolean(user),
  })
  useEffect(() => { if (user) refetchBadges() }, [location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps
  const navGroups = useMemo(() => {
    const groups = isAdmin ? NAV_GROUPS : NAV_GROUPS
      .map(group => ({ ...group, children: group.children.filter(item => isReviewerPage(item.key)) }))
      .filter(group => group.children.length > 0)
    return withBadges(groups, badgeCounts)
  }, [badgeCounts, isAdmin])

  const userMenu = [
    { key: 'info', label: <Typography.Text type="secondary">{user?.name || user?.phone}</Typography.Text>, disabled: true },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true, onClick: logout },
  ]

  return (
    <Layout className="admin-layout" style={{ minHeight: '100vh' }}>

      {/* ── Header ────────────────────────────────── */}
      <Layout.Header style={{ background: '#fff', height: 48, lineHeight: '48px', padding: '0 24px', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 100 }}>
        <Flex align="center" justify="space-between" style={{ height: '100%' }}>
          <Flex align="center" gap={12}>
            <img src={logo} alt="AnyLearn" style={{ height: 30 }} />
            <span style={{ borderLeft: '1px solid #e8e8e8', height: 16 }} />
            <Typography.Text strong>Admin</Typography.Text>
          </Flex>

          <Flex align="center" gap={20}>
            {isAdmin && HEADER_LINKS.map(link => {
              const active = location.pathname.startsWith(link.key)
              return (
                <Badge key={link.key} count={badgeCounts?.[BADGE_FIELDS[link.key]] ?? 0} overflowCount={99} size="small" offset={[4, 2]}>
                  <Flex align="center" gap={6} onClick={() => navigate(link.key)}
                    style={{ cursor: 'pointer', fontSize: 14, fontWeight: active ? 600 : 400, color: active ? '#1677ff' : undefined }}>
                    {link.icon}<span>{link.label}</span>
                  </Flex>
                </Badge>
              )
            })}
            <Popover
              title={
                <Flex justify="space-between" align="center">
                  <span>Thông báo</span>
                  {unreadCount > 0 && (
                    <Typography.Link style={{ fontSize: 12, fontWeight: 400 }} onClick={markAllRead}>
                      Đánh dấu tất cả đã đọc
                    </Typography.Link>
                  )}
                </Flex>
              }
              trigger="click"
              open={notifOpen}
              placement="bottomRight"
              styles={{ body: { padding: 0 } }}
              content={
                <div style={{ width: 320, maxHeight: 400, overflowY: 'auto' }}>
                  {notifLoading ? (
                    <div style={{ padding: 24, textAlign: 'center' }}><Spin /></div>
                  ) : notifItems.length === 0 ? (
                    <div style={{ padding: 16 }}>
                      <Typography.Text type="secondary">Không có thông báo mới</Typography.Text>
                    </div>
                  ) : (
                    <List size="small" dataSource={notifItems}
                      renderItem={item => (
                        <List.Item
                          style={{ padding: '10px 16px', background: item.read ? '#fff' : '#e6f4ff', cursor: item.route ? 'pointer' : 'default' }}
                          onClick={() => {
                            if (!item.read) {
                              client.get(`/api/user/notification/${item.id}`).catch(() => {})
                              setNotifItems(prev => prev.map(n => n.id === item.id ? { ...n, read: new Date().toISOString() } : n))
                              setUnreadCount(prev => Math.max(0, prev - 1))
                            }
                            setNotifOpen(false)
                            if (item.route) {
                              const path = item.route.startsWith('/admin')
                                ? item.route.slice('/admin'.length)
                                : item.route
                              navigate(path || '/')
                            }
                          }}
                        >
                          <div>
                            <Typography.Text strong style={{ fontSize: 13 }}>{item.title}</Typography.Text>
                            <br />
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>{item.content}</Typography.Text>
                          </div>
                        </List.Item>
                      )}
                    />
                  )}
                </div>
              }
              onOpenChange={open => {
                setNotifOpen(open)
                if (open) {
                  setNotifLoading(true)
                  client.get('/api/user/notification', { params: { page: 0 } })
                    .then(r => { setNotifItems(r.data?.data?.items ?? []); setNotifLoading(false) })
                    .catch(() => setNotifLoading(false))
                }
              }}
            >
              <Badge count={unreadCount} overflowCount={99}><BellOutlined style={{ fontSize: 16, cursor: 'pointer' }} /></Badge>
            </Popover>

            <Dropdown menu={{ items: userMenu }} placement="bottomRight">
              <Flex align="center" gap={8} style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} size="small" />
                <Typography.Text>{user?.name || user?.phone}</Typography.Text>
              </Flex>
            </Dropdown>
          </Flex>
        </Flex>
      </Layout.Header>

      {/* ── Body ──────────────────────────────────── */}
      <Layout>
        <Layout.Sider
          collapsible collapsed={collapsed} onCollapse={setCollapsed}
          theme="light"
          style={{ borderRight: '1px solid #f0f0f0', position: 'sticky', top: 48, height: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          {/* Nav menu — scrollable, takes all available space */}
          <div style={{ height: 'calc(100vh - 48px - 104px)', overflowY: 'auto', overflowX: 'hidden' }}>
            <Menu
              mode="inline" selectedKeys={[selectedKey]}
              items={navGroups}
              onClick={({ key }) => navigate(key)}
              style={{ borderRight: 'none', paddingTop: 8 }}
            />
          </div>

          {/* Settings — always at bottom, never overlaps nav items */}
          {isAdmin && <Popover
            content={<Menu items={settingsMenu} style={{ border: 'none' }} onClick={() => setSettingsOpen(false)} />}
            trigger="click"
            placement="rightBottom"
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
          >
            <Flex
              align="center" gap={10}
              className="sider-settings"
              style={{
                padding: collapsed ? '10px 0' : '10px 24px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                cursor: 'pointer',
                borderTop: '1px solid #f0f0f0',
                transition: 'background .15s, color .15s',
                flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f5f5f5' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <SettingOutlined style={{ fontSize: 16 }} />
              {!collapsed && <span style={{ fontSize: 14 }}>Cài đặt</span>}
            </Flex>
          </Popover>}
        </Layout.Sider>

        {/* bg-mesh-blue-purple — swap class name to switch theme */}
        <Layout.Content className="bg-mesh-blue-purple" style={{ overflowX: 'hidden', overflowY: 'auto', minHeight: 'calc(100vh - 48px)' }}>
          {isAdmin || isReviewerPage(location.pathname) ? <Outlet /> : <Navigate to={REVIEWER_PAGES[0]} replace />}
        </Layout.Content>
      </Layout>
      <UploadTray />

    </Layout>
  )
}
