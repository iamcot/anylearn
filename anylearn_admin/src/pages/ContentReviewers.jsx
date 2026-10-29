import { Alert, Button, Card, Select, Table, Tag, Typography, message } from 'antd'
import { DeleteOutlined, SafetyOutlined } from '@ant-design/icons'
import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'

const SEARCH_DELAY_MS = 350
const CONTENT_REVIEW = 'content_review'

// "Người duyệt nội dung" (plan 19.A5): members who sign in to the back office and only see Khám phá (posts, comments,
// social queue). They do not see orders, money or members.
export default function ContentReviewers() {
  const qc = useQueryClient()
  const [options, setOptions] = useState([])
  const [searching, setSearching] = useState(false)
  const timer = useRef(null)
  const { data, isLoading } = useQuery({ queryKey: ['admin-permissions'], queryFn: () => client.get('/admin/permissions').then(r => r.data?.data) })
  const people = data?.people ?? []

  const set = useMutation({
    mutationFn: ({ userId, permissions }) => client.put(`/admin/permissions/${userId}`, { permissions }).then(r => r.data),
    onSuccess: (res, { permissions }) => {
      if (res.resultCode !== 1) return message.error(res.message)
      message.success(permissions.length ? 'Đã cấp quyền duyệt nội dung' : 'Đã bỏ quyền')
      qc.invalidateQueries({ queryKey: ['admin-permissions'] })
    },
  })

  const search = text => {
    clearTimeout(timer.current)
    if (text.trim().length < 2) { setOptions([]); return }
    timer.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await client.get('/admin/users', { params: { q: text.trim(), size: 15 } })
        setOptions((res.data?.data?.content ?? []).map(user => ({ value: user.id, label: `${user.name || 'Chưa đặt tên'} · ${user.phone}`, user })))
      } finally {
        setSearching(false)
      }
    }, SEARCH_DELAY_MS)
  }

  const add = (_, option) => {
    if (option.user.role === 'admin') return message.info('Quản trị viên đã có mọi quyền')
    set.mutate({ userId: option.user.id, permissions: [CONTENT_REVIEW] })
  }

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <SafetyOutlined style={{ fontSize: 20, color: '#1677ff' }} />
        <Typography.Title level={4} style={{ margin: 0 }}>Người duyệt nội dung</Typography.Title>
      </div>
      <Alert type="info" showIcon style={{ marginBottom: 16 }}
        message="Người được thêm đăng nhập trang quản trị bằng tài khoản anyLEARN của họ và chỉ thấy trang Khám phá: duyệt bài của creator và tool t2m, xử lý bình luận, hàng đợi đăng social."
        description="Họ không thấy đơn hàng, tiền, thành viên, cấu hình. Bỏ quyền thì lần gọi tiếp theo của họ bị từ chối (tối đa 30 giây sau)." />
      <Card size="small" title="Thêm người duyệt">
        <Select showSearch style={{ width: '100%', marginBottom: 12 }} placeholder="Tìm theo tên hoặc số điện thoại" filterOption={false}
          onSearch={search} onSelect={add} value={null} options={options} loading={searching}
          notFoundContent={searching ? 'Đang tìm...' : 'Gõ ít nhất 2 ký tự'} />
        <Table rowKey="id" size="small" loading={isLoading} dataSource={people} pagination={false} locale={{ emptyText: 'Chưa có ai' }} columns={[
          { title: 'Thành viên', dataIndex: 'name', render: v => <b>{v || 'Chưa đặt tên'}</b> },
          { title: 'Số điện thoại', dataIndex: 'phone', width: 150 },
          { title: 'Quyền', dataIndex: 'permissions', render: list => list.map(p => <Tag key={p} color="blue">{data?.labels?.[p] ?? p}</Tag>) },
          { title: '', key: 'remove', width: 70, render: (_, r) => <Button type="text" danger icon={<DeleteOutlined />} aria-label="Bỏ quyền" onClick={() => set.mutate({ userId: r.id, permissions: [] })} /> },
        ]} />
      </Card>
    </div>
  )
}
