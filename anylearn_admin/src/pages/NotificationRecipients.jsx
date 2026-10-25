import { Alert, Button, Card, Select, Space, Table, Tag, Typography, message } from 'antd'
import { BellOutlined, DeleteOutlined, SendOutlined } from '@ant-design/icons'
import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'

const ROLE_LABEL = { user: 'Thành viên', member: 'Thành viên', teacher: 'Giáo viên', school: 'Trường', partner: 'Đối tác', admin: 'Quản trị' }
const SEARCH_DELAY_MS = 350

const label = (user) => `${user.name || 'Chưa đặt tên'} · ${user.phone}`

export default function NotificationRecipients() {
  const qc = useQueryClient()
  // null until the list is edited; then the edited copy replaces the saved one
  const [draft, setDraft] = useState(null)
  const [options, setOptions] = useState([])
  const [searching, setSearching] = useState(false)
  const timer = useRef(null)

  const { data } = useQuery({
    queryKey: ['admin-notification-recipients'],
    queryFn: () => client.get('/admin/notification-recipients').then(r => r.data?.data),
  })

  const extras = draft ?? data?.extras ?? []
  const dirty = draft !== null

  const save = useMutation({
    mutationFn: () => client.put('/admin/notification-recipients', { userIds: extras.map(user => user.id) }).then(r => r.data),
    onSuccess: (res) => {
      if (res.resultCode !== 1) return message.error(res.message)
      message.success('Đã lưu danh sách')
      setDraft(null)
      qc.invalidateQueries({ queryKey: ['admin-notification-recipients'] })
    },
  })

  const test = useMutation({
    mutationFn: () => client.post('/admin/notification-recipients/test').then(r => r.data),
    onSuccess: (res) => {
      if (res.resultCode !== 1) return message.error(res.message)
      message.success(`Đã gửi thông báo thử cho ${res.data.sent} người`)
    },
  })

  const search = (text) => {
    clearTimeout(timer.current)
    if (text.trim().length < 2) { setOptions([]); return }
    timer.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await client.get('/admin/users', { params: { q: text.trim(), size: 15 } })
        setOptions((res.data?.data?.content ?? []).map(user => ({ value: user.id, label: `${label(user)} · ${ROLE_LABEL[user.role] ?? user.role}`, user })))
      } finally {
        setSearching(false)
      }
    }, SEARCH_DELAY_MS)
  }

  const add = (_, option) => {
    const { user } = option
    if (user.role === 'admin') return message.info(`${user.name} đã là quản trị viên, luôn nhận thông báo`)
    if (extras.some(item => item.id === user.id)) return
    setDraft([...extras, { id: user.id, name: user.name, phone: user.phone, role: user.role }])
  }

  const remove = (id) => {
    setDraft(extras.filter(user => user.id !== id))
  }

  const columns = [
    { title: 'Thành viên', key: 'who', render: (_, user) => <span style={{ fontWeight: 600 }}>{user.name || 'Chưa đặt tên'}</span> },
    { title: 'Số điện thoại', dataIndex: 'phone', key: 'phone', width: 150 },
    { title: 'Vai trò', dataIndex: 'role', key: 'role', width: 130, render: role => <Tag>{ROLE_LABEL[role] ?? role}</Tag> },
    { title: '', key: 'remove', width: 70, render: (_, user) => <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(user.id)} aria-label="Bỏ khỏi danh sách" /> },
  ]

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <BellOutlined style={{ fontSize: 20, color: '#1677ff' }} />
        <Typography.Title level={4} style={{ margin: 0 }}>Người nhận thông báo admin</Typography.Title>
      </div>

      <Alert type="info" showIcon style={{ marginBottom: 16 }}
        message="Thông báo của quản trị (đơn mới, chuyển khoản về, yêu cầu tìm khóa học, yêu cầu nghỉ / đổi lịch…) luôn gửi cho các quản trị viên. Thêm thành viên khác vào đây để họ cũng nhận."
        description="Người được thêm cần đăng nhập anyLEARN trên điện thoại, vào Tài khoản > Thông báo và bật thông báo. Họ không vào được trang quản trị." />

      <Card size="small" title="Quản trị viên (luôn nhận)" style={{ marginBottom: 16 }}>
        <Space wrap>
          {(data?.admins ?? []).map(user => <Tag key={user.id} color="blue">{label(user)}</Tag>)}
        </Space>
      </Card>

      <Card size="small" title={`Thành viên được thêm (${extras.length}/${data?.max ?? 50})`}>
        <Select
          showSearch
          style={{ width: '100%', marginBottom: 12 }}
          placeholder="Tìm theo tên hoặc số điện thoại để thêm"
          filterOption={false}
          onSearch={search}
          onSelect={add}
          value={null}
          options={options}
          loading={searching}
          notFoundContent={searching ? 'Đang tìm...' : 'Gõ ít nhất 2 ký tự'}
        />
        <Table columns={columns} dataSource={extras} rowKey="id" size="small" pagination={false}
          locale={{ emptyText: 'Chưa thêm ai' }} />
        <Space style={{ marginTop: 16 }}>
          <Button type="primary" onClick={() => save.mutate()} loading={save.isPending} disabled={!dirty}>Lưu danh sách</Button>
          <Button icon={<SendOutlined />} onClick={() => test.mutate()} loading={test.isPending} disabled={dirty}>
            Gửi thông báo thử cho mọi người
          </Button>
        </Space>
        {dirty && <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
          Lưu danh sách trước khi gửi thông báo thử.
        </Typography.Text>}
      </Card>
    </div>
  )
}
