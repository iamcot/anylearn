import { Avatar, Badge, Divider, Dropdown, Flex, Layout, Menu, Popover, Typography } from 'antd'
import {
  BellOutlined, BookOutlined, DashboardOutlined, FileTextOutlined,
  LogoutOutlined, OrderedListOutlined, SettingOutlined, SwapOutlined,
  TeamOutlined, UserOutlined,
} from '@ant-design/icons'
import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import client from '../api/client'

const NAV_ITEMS = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Tổng quan' },
  { key: '/users',     icon: <TeamOutlined />,      label: 'Thành viên' },
  { key: '/items',     icon: <BookOutlined />,       label: 'Khóa học'  },
  { key: '/orders',    icon: <OrderedListOutlined />, label: 'Đơn hàng' },
  { key: '/transactions', icon: <SwapOutlined />,    label: 'anyPoints' },
  { key: '/articles',  icon: <FileTextOutlined />,   label: 'Bài viết'  },
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

  const selectedKey = NAV_ITEMS.find(i => location.pathname.startsWith(i.key))?.key ?? '/dashboard'

  const userMenu = [
    { key: 'info', label: <Typography.Text type="secondary">{user?.name || user?.phone}</Typography.Text>, disabled: true },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true, onClick: logout },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>

      {/* ── Header ────────────────────────────────── */}
      <Layout.Header style={{ background: '#fff', height: 48, lineHeight: '48px', padding: '0 24px', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 100 }}>
        <Flex align="center" justify="space-between" style={{ height: '100%' }}>
          <Flex align="center" gap={12}>
            <img src="/LogoanyLEARN.svg" alt="AnyLearn" style={{ height: 30 }} />
            <Divider type="vertical" />
            <Typography.Text strong>Admin</Typography.Text>
          </Flex>

          <Flex align="center" gap={20}>
            <Popover
              title="Thông báo"
              content={<Typography.Text type="secondary">Không có thông báo mới</Typography.Text>}
              trigger="click" placement="bottomRight"
            >
              <Badge count={0}><BellOutlined style={{ fontSize: 16, cursor: 'pointer' }} /></Badge>
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
          style={{ borderRight: '1px solid #f0f0f0', position: 'sticky', top: 48, height: 'calc(100vh - 48px)', overflow: 'auto' }}
        >
          <Menu
            mode="inline" selectedKeys={[selectedKey]}
            items={NAV_ITEMS}
            onClick={({ key }) => navigate(key)}
            style={{ borderRight: 'none', paddingTop: 8 }}
          />

          <Popover content={<Menu items={SETTINGS_MENU} style={{ border: 'none' }} />} trigger="click" placement="rightBottom">
            <Flex
              align="center" gap={10}
              style={{
                position: 'absolute', bottom: 48, width: '100%',
                padding: collapsed ? '8px 0' : '8px 24px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                cursor: 'pointer', color: 'rgba(0,0,0,0.45)',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(0,0,0,0.88)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(0,0,0,0.45)'}
            >
              <SettingOutlined style={{ fontSize: 16 }} />
              {!collapsed && <span style={{ fontSize: 14 }}>Cài đặt</span>}
            </Flex>
          </Popover>
        </Layout.Sider>

        <Layout.Content style={{ overflow: 'auto' }}>
          <Outlet />
        </Layout.Content>
      </Layout>

    </Layout>
  )
}
