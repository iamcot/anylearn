import { Button, Card, Input, Modal, Select, Space, Table, Tag, Typography, message } from 'antd'
import { DollarOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import { fmtDateTime, fmtVND } from '../utils/format'

const STATUS = {
  new: ['Mới', 'blue'],
  checking: ['Đang kiểm tra', 'orange'],
  fixed: ['Đã chỉnh giá', 'green'],
  rejected: ['Không đúng', 'default'],
}
const STATUS_OPTIONS = Object.entries(STATUS).map(([value, [label]]) => ({ value, label }))

export default function PriceReports() {
  const [status, setStatus] = useState('')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ status: 'checking', adminNote: '' })
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-price-reports', status],
    queryFn: () => client.get('/admin/price-reports', { params: { status: status || undefined } }).then(r => r.data?.data ?? []),
  })

  const save = useMutation({
    mutationFn: ({ id, ...body }) => client.put(`/admin/price-reports/${id}`, body).then(r => r.data),
    onSuccess: (res) => {
      if (res.resultCode !== 1) return message.error(res.message)
      message.success('Đã cập nhật')
      setEditing(null)
      qc.invalidateQueries({ queryKey: ['admin-price-reports'] })
    },
  })

  const open = (report) => {
    setEditing(report)
    setForm({ status: report.status === 'new' ? 'checking' : report.status, adminNote: report.adminNote ?? '' })
  }

  const columns = [
    {
      title: 'Khóa học', key: 'item', width: 120,
      render: (_, r) => r.itemId ? <a href={`/admin/items/${r.itemId}`}>Khóa #{r.itemId}</a> : <span style={{ color: '#888' }}>Không rõ</span>,
    },
    {
      title: 'Giá rẻ hơn thấy ở', key: 'seen',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.seenPlace || '—'}</div>
          {r.seenPrice != null && <div style={{ fontSize: 12 }}>Giá thấy: {fmtVND(r.seenPrice)}đ</div>}
          {r.note && <div style={{ fontSize: 12, color: '#888' }}>“{r.note}”</div>}
        </div>
      ),
    },
    {
      title: 'Người báo', key: 'who', width: 150,
      render: (_, r) => (
        <div>
          {r.contactPhone ? <a href={`tel:${r.contactPhone}`}>{r.contactPhone}</a> : <span style={{ color: '#888' }}>Không để số</span>}
          {r.userId && <div style={{ fontSize: 11, color: '#888' }}>Có tài khoản #{r.userId}</div>}
        </div>
      ),
    },
    { title: 'Gửi lúc', dataIndex: 'createdAt', key: 'createdAt', width: 130, render: v => <span style={{ fontSize: 11, color: '#888' }}>{fmtDateTime(v)}</span> },
    {
      title: 'Xử lý', key: 'action', width: 190,
      render: (_, r) => {
        const [label, color] = STATUS[r.status] ?? [r.status, 'default']
        return (
          <Space direction="vertical" size={4}>
            <Tag color={color}>{label}</Tag>
            {r.adminNote && <span style={{ fontSize: 11, color: '#888' }}>{r.adminNote}</span>}
            <Button size="small" onClick={() => open(r)}>Cập nhật</Button>
          </Space>
        )
      },
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <DollarOutlined style={{ fontSize: 20, color: '#1677ff' }} />
        <Typography.Title level={4} style={{ margin: 0 }}>Báo giá rẻ hơn nơi khác</Typography.Title>
      </div>
      <Card styles={{ body: { padding: '16px 20px' } }}>
        <Space wrap style={{ marginBottom: 14 }}>
          <Select style={{ width: 200 }} value={status} onChange={setStatus}
            options={[{ value: '', label: 'Tất cả trạng thái' }, ...STATUS_OPTIONS]} />
        </Space>
        <Table columns={columns} dataSource={data ?? []} rowKey="id" loading={isLoading} size="small"
          scroll={{ x: 'max-content' }} pagination={{ pageSize: 30, showSizeChanger: false }} />
      </Card>

      <Modal title="Cập nhật báo giá" open={!!editing} onCancel={() => setEditing(null)} okText="Lưu" cancelText="Đóng"
        confirmLoading={save.isPending} destroyOnClose
        onOk={() => save.mutate({ id: editing.id, status: form.status, adminNote: form.adminNote })}>
        {editing && <p style={{ marginTop: 0 }}>{editing.seenPlace} · {editing.seenPrice != null ? `${fmtVND(editing.seenPrice)}đ` : 'chưa có giá'}</p>}
        <Space direction="vertical" style={{ width: '100%' }}>
          <Select style={{ width: '100%' }} value={form.status} options={STATUS_OPTIONS}
            onChange={value => setForm(prev => ({ ...prev, status: value }))} />
          <Input.TextArea rows={3} maxLength={500} value={form.adminNote} placeholder="Ghi chú nội bộ (đã kiểm tra với đối tác nào, giá mới…)"
            onChange={event => setForm(prev => ({ ...prev, adminNote: event.target.value }))} />
          {form.status === 'fixed' && <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Người báo có tài khoản sẽ nhận thông báo cảm ơn; người không có tài khoản cần được gọi theo số điện thoại.
          </Typography.Text>}
        </Space>
      </Modal>
    </div>
  )
}
