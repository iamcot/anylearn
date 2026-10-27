import { Button, Card, Drawer, Form, Input, InputNumber, Popconfirm, Select, Space, Switch, Table, Tabs, Tag, Typography, message } from 'antd'
import { MessageOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import { fmtDateTime } from '../utils/format'

const REPORT_STATUS = { open: ['Chờ xử lý', 'orange'], hidden: ['Đã ẩn tin', 'red'], dismissed: ['Bỏ qua', 'default'] }

const get = (url, params) => client.get(url, { params }).then(r => r.data?.data ?? [])

function useAction(invalidate) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ method, url, body }) => client({ method, url, data: body }).then(r => r.data),
    onSuccess: (res) => {
      if (res.resultCode !== 1) return message.error(res.message)
      message.success('Đã cập nhật')
      invalidate.forEach(key => qc.invalidateQueries({ queryKey: [key] }))
    },
  })
}

function Reports() {
  const [status, setStatus] = useState('open')
  const { data, isLoading } = useQuery({ queryKey: ['chat-reports', status], queryFn: () => get('/admin/chat/reports', { status: status || undefined }) })
  const act = useAction(['chat-reports', 'chat-banned', 'admin-badges'])
  const handle = (id, body) => act.mutate({ method: 'put', url: `/admin/chat/reports/${id}`, body })

  const columns = [
    { title: 'Nhóm', dataIndex: 'roomTitle', width: 180 },
    {
      title: 'Tin bị báo cáo', key: 'body',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.hidden ? <s>{r.body}</s> : r.body}</div>
          <div style={{ fontSize: 12, color: '#888' }}>
            Người gửi: {r.authorName || '—'} (tài khoản {r.authorAccount || `#${r.authorId}`}) {r.authorBanned ? <Tag color="red">Đã khóa chat</Tag> : null}
          </div>
          <div style={{ fontSize: 12 }}>Lý do: “{r.reason}” · {r.reporterName || 'Thành viên'} · {fmtDateTime(r.createdAt)}</div>
        </div>
      ),
    },
    {
      title: 'Xử lý', key: 'action', width: 260,
      render: (_, r) => {
        const [label, color] = REPORT_STATUS[r.status] ?? [r.status, 'default']
        if (r.status !== 'open') return <Tag color={color}>{label}</Tag>
        return (
          <Space direction="vertical" size={4}>
            <Button size="small" type="primary" onClick={() => handle(r.id, { action: 'hide' })}>Ẩn tin</Button>
            <Popconfirm title="Ẩn tin và tạm khóa người gửi 7 ngày?" onConfirm={() => handle(r.id, { action: 'hide', muteDays: 7 })}>
              <Button size="small">Ẩn tin + khóa 7 ngày</Button>
            </Popconfirm>
            <Popconfirm title="Ẩn tin và khóa chat người gửi ở mọi nhóm?" onConfirm={() => handle(r.id, { action: 'hide', ban: true })}>
              <Button size="small" danger>Ẩn tin + khóa chat</Button>
            </Popconfirm>
            <Button size="small" onClick={() => handle(r.id, { action: 'dismiss' })}>Bỏ qua (không vi phạm)</Button>
          </Space>
        )
      },
    },
  ]

  return (
    <>
      <Select style={{ width: 200, marginBottom: 14 }} value={status} onChange={setStatus}
        options={[{ value: '', label: 'Tất cả' }, ...Object.entries(REPORT_STATUS).map(([value, [label]]) => ({ value, label }))]} />
      <Table columns={columns} dataSource={data ?? []} rowKey="id" loading={isLoading} size="small" pagination={{ pageSize: 30, showSizeChanger: false }} />
    </>
  )
}

function RoomDrawer({ room, onClose }) {
  const members = useQuery({ queryKey: ['chat-members', room.id], queryFn: () => get(`/admin/chat/rooms/${room.id}/members`) })
  const msgs = useQuery({ queryKey: ['chat-room-messages', room.id], queryFn: () => get(`/admin/chat/rooms/${room.id}/messages`) })
  const act = useAction(['chat-members', 'chat-room-messages', 'chat-banned', 'chat-rooms'])
  const [form] = Form.useForm()

  return (
    <Drawer open width={720} title={room.title} onClose={onClose}>
      <Typography.Title level={5}>Thêm giáo viên / người hỗ trợ</Typography.Title>
      <Form form={form} layout="inline" onFinish={v => { act.mutate({ method: 'post', url: `/admin/chat/rooms/${room.id}/members`, body: v }); form.resetFields() }}
        initialValues={{ role: 'moderator' }} style={{ marginBottom: 20 }}>
        <Form.Item name="userId" rules={[{ required: true, message: 'Nhập ID người dùng' }]}><InputNumber placeholder="ID người dùng" style={{ width: 150 }} /></Form.Item>
        <Form.Item name="role"><Select style={{ width: 160 }} options={[{ value: 'moderator', label: 'Kiểm duyệt (giáo viên)' }, { value: 'member', label: 'Thành viên' }]} /></Form.Item>
        <Button type="primary" htmlType="submit">Thêm</Button>
      </Form>

      <Typography.Title level={5}>Thành viên</Typography.Title>
      <Table size="small" rowKey="userId" loading={members.isLoading} dataSource={members.data ?? []} pagination={{ pageSize: 8, showSizeChanger: false }}
        columns={[
          { title: 'Tên trong nhóm', dataIndex: 'displayName', render: (v, r) => <span>{v || <i>chưa vào</i>} <span style={{ color: '#888', fontSize: 12 }}>({r.account} #{r.userId})</span></span> },
          { title: 'Vai trò', dataIndex: 'role', width: 90, render: v => v === 'moderator' ? <Tag color="green">Kiểm duyệt</Tag> : 'Thành viên' },
          { title: '', key: 'a', width: 200, render: (_, r) => (
            <Space>
              {r.leftAt ? <Tag>Đã rời</Tag> : <a onClick={() => act.mutate({ method: 'delete', url: `/admin/chat/rooms/${room.id}/members/${r.userId}` })}>Cho rời</a>}
              <a onClick={() => act.mutate({ method: 'put', url: `/admin/chat/users/${r.userId}/ban`, body: { banned: !r.banned } })}>{r.banned ? 'Mở khóa chat' : 'Khóa chat'}</a>
            </Space>
          ) },
        ]} />

      <Typography.Title level={5} style={{ marginTop: 20 }}>Tin gần đây</Typography.Title>
      <Table size="small" rowKey="id" loading={msgs.isLoading} dataSource={msgs.data ?? []} pagination={{ pageSize: 10, showSizeChanger: false }}
        columns={[
          { title: 'Người gửi', dataIndex: 'authorName', width: 130, render: v => v || '—' },
          { title: 'Nội dung', dataIndex: 'body', render: (v, r) => r.hidden ? <s style={{ color: '#888' }}>{v}</s> : v },
          { title: 'Lúc', dataIndex: 'createdAt', width: 120, render: v => <span style={{ fontSize: 11 }}>{fmtDateTime(v)}</span> },
          { title: '', key: 'a', width: 70, render: (_, r) => (
            <a onClick={() => act.mutate({ method: 'put', url: `/admin/chat/messages/${r.id}/hidden`, body: { hidden: !r.hidden } })}>{r.hidden ? 'Hiện lại' : 'Ẩn'}</a>
          ) },
        ]} />
    </Drawer>
  )
}

function Rooms() {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(null)
  const { data, isLoading } = useQuery({ queryKey: ['chat-rooms', q], queryFn: () => get('/admin/chat/rooms', { q: q || undefined }) })
  const act = useAction(['chat-rooms'])
  return (
    <>
      <Input.Search placeholder="Tìm theo tên khóa / lớp" allowClear onSearch={setQ} style={{ width: 280, marginBottom: 14 }} />
      <Table size="small" rowKey="id" loading={isLoading} dataSource={data ?? []} pagination={{ pageSize: 30, showSizeChanger: false }}
        columns={[
          { title: 'Nhóm', dataIndex: 'title' },
          { title: 'Thành viên', dataIndex: 'members', width: 100 },
          { title: 'Tin nhắn', dataIndex: 'messages', width: 90 },
          { title: 'Tin gần nhất', dataIndex: 'lastAt', width: 140, render: v => v ? fmtDateTime(v) : '—' },
          { title: 'Khóa nhóm', key: 'lock', width: 100, render: (_, r) => (
            <Switch checked={!!r.locked} onChange={locked => act.mutate({ method: 'put', url: `/admin/chat/rooms/${r.id}/lock`, body: { locked } })} />
          ) },
          { title: '', key: 'open', width: 80, render: (_, r) => <a onClick={() => setOpen(r)}>Quản lý</a> },
        ]} />
      {open && <RoomDrawer room={open} onClose={() => setOpen(null)} />}
    </>
  )
}

function Banned() {
  const { data, isLoading } = useQuery({ queryKey: ['chat-banned'], queryFn: () => get('/admin/chat/banned') })
  const act = useAction(['chat-banned'])
  return (
    <Table size="small" rowKey="userId" loading={isLoading} dataSource={data ?? []} pagination={false}
      locale={{ emptyText: 'Chưa khóa ai' }}
      columns={[
        { title: 'Tài khoản', dataIndex: 'name', render: (v, r) => `${v || 'Không tên'} (#${r.userId})` },
        { title: '', key: 'a', width: 140, render: (_, r) => <a onClick={() => act.mutate({ method: 'put', url: `/admin/chat/users/${r.userId}/ban`, body: { banned: false } })}>Mở khóa chat</a> },
      ]} />
  )
}

function ChatSettings() {
  const [form] = Form.useForm()
  const { data } = useQuery({ queryKey: ['chat-settings'], queryFn: () => client.get('/admin/chat/settings').then(r => r.data?.data) })
  const save = useMutation({
    mutationFn: body => client.put('/admin/chat/settings', body).then(r => r.data),
    onSuccess: res => (res.resultCode === 1 ? message.success('Đã lưu') : message.error(res.message)),
  })
  useEffect(() => { if (data) form.setFieldsValue(data) }, [data, form])
  return (
    <Form form={form} layout="vertical" style={{ maxWidth: 640 }} onFinish={save.mutate}>
      <Form.Item name="enabled" label="Bật chat lớp" valuePropName="checked" extra="Tắt thì mọi người không vào được nhóm; dữ liệu vẫn giữ."><Switch /></Form.Item>
      <Form.Item name="partnerModerator" label="Đối tác của khóa tự là người kiểm duyệt nhóm" valuePropName="checked"
        extra="Giáo viên khác thêm bằng tay ở tab Nhóm lớp > Quản lý.">
        <Switch />
      </Form.Item>
      <Form.Item name="ratePerMinute" label="Số tin tối đa mỗi người mỗi phút (0 = không giới hạn)"><InputNumber min={0} max={600} /></Form.Item>
      <Form.Item name="retentionDays" label="Số ngày còn đọc được sau khi hết khóa"><InputNumber min={0} max={365} /></Form.Item>
      <Form.Item name="bannedWords" label="Từ cấm (cách nhau bằng dấu phẩy, không phân biệt dấu và hoa thường)"><Input.TextArea rows={3} /></Form.Item>
      <Form.Item name="rulesText" label="Nội quy nhóm (hiện khi vào nhóm lần đầu)"><Input.TextArea rows={8} maxLength={4000} /></Form.Item>
      <Button type="primary" htmlType="submit" loading={save.isPending}>Lưu</Button>
    </Form>
  )
}

export default function ChatModeration() {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <MessageOutlined style={{ fontSize: 20, color: '#1677ff' }} />
        <Typography.Title level={4} style={{ margin: 0 }}>Chat lớp</Typography.Title>
      </div>
      <Card styles={{ body: { padding: '16px 20px' } }}>
        <Tabs items={[
          { key: 'reports', label: 'Báo cáo tin nhắn', children: <Reports /> },
          { key: 'rooms', label: 'Nhóm lớp', children: <Rooms /> },
          { key: 'banned', label: 'Người bị khóa chat', children: <Banned /> },
          { key: 'settings', label: 'Cài đặt', children: <ChatSettings /> },
        ]} />
      </Card>
    </div>
  )
}
