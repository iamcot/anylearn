import { Avatar, Badge, Dropdown, Flex, Layout, List, Menu, Popover, Spin, Typography } from 'antd'
import {
  AuditOutlined, BellOutlined, BookOutlined, DashboardOutlined, FileTextOutlined,
  FundOutlined, LogoutOutlined, OrderedListOutlined, SettingOutlined, SwapOutlined,
  TeamOutlined, UserOutlined,
} from '@ant-design/icons'
import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import client from '../api/client'
import '../styles/themes.css'

const NAV_ITEMS = [
  { key: '/dashboard',   icon: <DashboardOutlined />, label: 'Tổng quan'  },
  { key: '/users',       icon: <TeamOutlined />,      label: 'Thành viên' },
  { key: '/items',       icon: <BookOutlined />,       label: 'Khóa học'  },
  { key: '/orders',      icon: <OrderedListOutlined />, label: 'Đơn hàng' },
  { key: '/transactions',icon: <SwapOutlined />,      label: 'anyPoints'  },
  { key: '/finance',     icon: <FundOutlined />,      label: 'Tài chính'  },
  { key: '/articles',    icon: <FileTextOutlined />,  label: 'Bài viết'   },
]

const SETTINGS_MENU = [
  {
    key: 'zalo',
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
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifItems, setNotifItems] = useState([])
  const [notifLoading, setNotifLoading] = useState(false)
  const esRef = useRef(null)

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

  const settingsMenu = [
    ...SETTINGS_MENU,
    { type: 'divider' },
    { key: 'audit', icon: <AuditOutlined />, label: 'Kiểm toán anyPoint', onClick: () => navigate('/audit') },
  ]

  const selectedKey = NAV_ITEMS.find(i => location.pathname.startsWith(i.key))?.key ?? '/dashboard'

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
            <img src="/LogoanyLEARN.svg" alt="AnyLearn" style={{ height: 30 }} />
            <span style={{ borderLeft: '1px solid #e8e8e8', height: 16 }} />
            <Typography.Text strong>Admin</Typography.Text>
          </Flex>

          <Flex align="center" gap={20}>
            <Popover
              title="Thông báo"
              trigger="click"
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
                          onClick={() => item.route && navigate(item.route.replace('/admin', ''))}
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
                if (open) {
                  setNotifLoading(true)
                  client.get('/api/user/notification', { params: { page: 0 } })
                    .then(r => { setNotifItems(r.data?.data?.items ?? []); setNotifLoading(false) })
                    .catch(() => setNotifLoading(false))
                } else if (unreadCount > 0) {
                  client.post('/api/user/notification/mark-all-read').catch(() => {})
                  setUnreadCount(0)
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
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            <Menu
              mode="inline" selectedKeys={[selectedKey]}
              items={NAV_ITEMS}
              onClick={({ key }) => navigate(key)}
              style={{ borderRight: 'none', paddingTop: 8 }}
            />
          </div>

          {/* Settings — always at bottom, never overlaps nav items */}
          <Popover content={<Menu items={settingsMenu} style={{ border: 'none' }} />} trigger="click" placement="rightBottom">
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
          </Popover>
        </Layout.Sider>

        {/* bg-mesh-blue-purple — swap class name to switch theme */}
        <Layout.Content className="bg-mesh-blue-purple" style={{ overflow: 'auto', minHeight: 'calc(100vh - 48px)' }}>
          <Outlet />
        </Layout.Content>
      </Layout>

    </Layout>
  )
}
