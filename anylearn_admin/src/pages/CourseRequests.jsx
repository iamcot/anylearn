import { Button, Card, Input, InputNumber, Modal, Select, Space, Table, Tag, Typography, message } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import { fmtDateTime, fmtVND } from '../utils/format'

const STATUS = {
  new: ['Mới', 'blue'],
  contacting: ['Đang liên hệ', 'orange'],
  matched: ['Đã tìm được', 'green'],
  no_partner: ['Chưa có đối tác', 'red'],
  closed: ['Đã đóng', 'default'],
}
const STATUS_OPTIONS = Object.entries(STATUS).map(([value, [label]]) => ({ value, label }))
const TIME_LABEL = { weekday_evening: 'Tối trong tuần', weekend: 'Cuối tuần', summer: 'Hè', flexible: 'Linh hoạt' }
const MODE_LABEL = { offline: 'Học trực tiếp', online: 'Học online', any: 'Cả hai' }
const PROVINCE_LABEL = { 79: 'TP.HCM', '01': 'Hà Nội', other: 'Tỉnh khác' }

function Need({ r }) {
  const details = [
    r.learnerAge != null && `${r.learnerAge} tuổi`,
    MODE_LABEL[r.mode], TIME_LABEL[r.preferredTime],
    r.budgetMax != null && `≤ ${fmtVND(r.budgetMax)}đ/tháng`,
  ].filter(Boolean)
  return (
    <div>
      <div style={{ fontWeight: 600 }}>{r.subject}</div>
      {details.length > 0 && <div style={{ fontSize: 12, color: '#666' }}>{details.join(' · ')}</div>}
      {r.note && <div style={{ fontSize: 12, color: '#888' }}>“{r.note}”</div>}
    </div>
  )
}

export default function CourseRequests() {
  const [status, setStatus] = useState('')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ status: 'contacting', matchedItemId: null, adminNote: '' })
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-course-requests', status],
    queryFn: () => client.get('/admin/course-requests', { params: { status: status || undefined } }).then(r => r.data?.data ?? []),
  })

  const save = useMutation({
    mutationFn: ({ id, ...body }) => client.put(`/admin/course-requests/${id}`, body).then(r => r.data),
    onSuccess: (res) => {
      if (res.resultCode !== 1) return message.error(res.message)
      message.success('Đã cập nhật')
      setEditing(null)
      qc.invalidateQueries({ queryKey: ['admin-course-requests'] })
    },
  })

  const open = (request) => {
    setEditing(request)
    setForm({ status: request.status === 'new' ? 'contacting' : request.status, matchedItemId: request.matchedItemId ?? null, adminNote: request.adminNote ?? '' })
  }

  const columns = [
    {
      title: 'Người gửi', key: 'who', width: 170,
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{r.contactName || 'Chưa để tên'}</div>
          <a href={`tel:${r.contactPhone}`} style={{ fontSize: 12 }}>{r.contactPhone}</a>
          {r.userId && <div style={{ fontSize: 11, color: '#888' }}>Có tài khoản #{r.userId}</div>}
        </div>
      ),
    },
    { title: 'Nhu cầu', key: 'need', render: (_, r) => <Need r={r} /> },
    {
      title: 'Khu vực', key: 'area', width: 130,
      render: (_, r) => <span style={{ fontSize: 12 }}>{[r.districtText, PROVINCE_LABEL[r.provinceCode]].filter(Boolean).join(', ') || '—'}</span>,
    },
    { title: 'Gửi lúc', dataIndex: 'createdAt', key: 'createdAt', width: 130, render: v => <span style={{ fontSize: 11, color: '#888' }}>{fmtDateTime(v)}</span> },
    {
      title: 'Xử lý', key: 'action', width: 210,
      render: (_, r) => {
        const [label, color] = STATUS[r.status] ?? [r.status, 'default']
        return (
          <Space direction="vertical" size={4}>
            <Space>
              <Tag color={color}>{label}</Tag>
              {r.matchedItemId && <a href={`/admin/items/${r.matchedItemId}`} style={{ fontSize: 12 }}>Khóa #{r.matchedItemId}</a>}
            </Space>
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
        <SearchOutlined style={{ fontSize: 20, color: '#1677ff' }} />
        <Typography.Title level={4} style={{ margin: 0 }}>Yêu cầu tìm khóa học</Typography.Title>
      </div>
      <Card styles={{ body: { padding: '16px 20px' } }}>
        <Space wrap style={{ marginBottom: 14 }}>
          <Select style={{ width: 200 }} value={status} onChange={setStatus}
            options={[{ value: '', label: 'Tất cả trạng thái' }, ...STATUS_OPTIONS]} />
        </Space>
        <Table columns={columns} dataSource={data ?? []} rowKey="id" loading={isLoading} size="small"
          scroll={{ x: 'max-content' }} pagination={{ pageSize: 30, showSizeChanger: false }} />
      </Card>

      <Modal title="Cập nhật yêu cầu" open={!!editing} onCancel={() => setEditing(null)} okText="Lưu" cancelText="Đóng"
        confirmLoading={save.isPending} destroyOnClose
        onOk={() => save.mutate({ id: editing.id, status: form.status, matchedItemId: form.status === 'matched' ? form.matchedItemId : undefined, adminNote: form.adminNote })}>
        {editing && <p style={{ marginTop: 0 }}>{editing.subject} · {editing.contactPhone}</p>}
        <Space direction="vertical" style={{ width: '100%' }}>
          <Select style={{ width: '100%' }} value={form.status} options={STATUS_OPTIONS}
            onChange={value => setForm(prev => ({ ...prev, status: value }))} />
          {form.status === 'matched' && (
            <InputNumber style={{ width: '100%' }} min={1} placeholder="Mã khóa học đã tìm được" value={form.matchedItemId}
              onChange={value => setForm(prev => ({ ...prev, matchedItemId: value }))} />
          )}
          <Input.TextArea rows={3} maxLength={500} value={form.adminNote} placeholder="Ghi chú nội bộ (đã gọi lúc nào, đối tác nào…)"
            onChange={event => setForm(prev => ({ ...prev, adminNote: event.target.value }))} />
          {form.status === 'matched' && <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Người gửi có tài khoản sẽ nhận thông báo kèm link khóa học; người không có tài khoản cần được gọi theo số điện thoại.
          </Typography.Text>}
        </Space>
      </Modal>
    </div>
  )
}
