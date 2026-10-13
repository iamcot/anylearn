import { Button, Card, Input, Modal, Select, Space, Table, Tag, Typography, message } from 'antd'
import { CustomerServiceOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import { fmtDate, fmtDateTime } from '../utils/format'

const TYPE_LABEL = { leave: 'Xin nghỉ', reschedule: 'Đổi lịch', makeup: 'Học bù' }
const STATUS_TAG = { pending: ['Chờ xử lý', 'warning'], approved: ['Đã chấp nhận', 'success'], rejected: ['Đã từ chối', 'default'] }
const DECISION_TITLE = { approved: 'Chấp nhận yêu cầu', rejected: 'Từ chối yêu cầu' }

export default function ScheduleRequests() {
  const [status, setStatus] = useState('pending')
  const [decision, setDecision] = useState(null)
  const [adminNote, setAdminNote] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-schedule-requests', status],
    queryFn: () => client.get('/admin/schedule-requests', { params: { status: status || undefined } })
      .then(r => r.data?.data ?? []),
  })

  const decide = useMutation({
    mutationFn: ({ id, status: next, note }) =>
      client.put(`/admin/schedule-requests/${id}`, { status: next, adminNote: note }).then(r => r.data),
    onSuccess: (res) => {
      if (res.resultCode !== 1) return message.error(res.message)
      message.success('Đã cập nhật')
      closeDecision()
      qc.invalidateQueries({ queryKey: ['admin-schedule-requests'] })
    },
  })

  const openDecision = (request, next) => { setDecision({ request, status: next }); setAdminNote('') }
  const closeDecision = () => setDecision(null)

  const columns = [
    {
      title: 'Người học', key: 'learner', width: 170,
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{r.learnerName}</div>
          <div style={{ fontSize: 11, color: '#888' }}>{r.accountName} · {r.accountPhone}</div>
        </div>
      ),
    },
    { title: 'Khóa học', dataIndex: 'itemTitle', key: 'item' },
    {
      title: 'Buổi học', key: 'session', width: 150,
      render: (_, r) => <span style={{ fontSize: 13 }}>{fmtDate(r.sessionDate)} · {r.timeStart ?? ''}{r.timeEnd ? `–${r.timeEnd}` : ''}</span>,
    },
    { title: 'Yêu cầu', dataIndex: 'type', key: 'type', width: 100, render: v => <Tag color="blue">{TYPE_LABEL[v] ?? v}</Tag> },
    { title: 'Lý do', dataIndex: 'note', key: 'note', render: v => <span style={{ fontSize: 12 }}>{v || '—'}</span> },
    {
      title: 'Gửi lúc', dataIndex: 'createdAt', key: 'created', width: 130,
      render: v => <span style={{ fontSize: 11, color: '#888' }}>{v ? fmtDateTime(v) : '—'}</span>,
    },
    {
      title: 'Xử lý', key: 'action', width: 190,
      render: (_, r) => {
        if (r.status !== 'pending') {
          const [label, color] = STATUS_TAG[r.status] ?? [r.status, 'default']
          return <div><Tag color={color}>{label}</Tag><div style={{ fontSize: 11, color: '#888' }}>{r.adminNote}</div></div>
        }
        return (
          <Space>
            <Button size="small" type="primary" onClick={() => openDecision(r, 'approved')}>Chấp nhận</Button>
            <Button size="small" onClick={() => openDecision(r, 'rejected')}>Từ chối</Button>
          </Space>
        )
      },
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <CustomerServiceOutlined style={{ fontSize: 20, color: '#1677ff' }} />
        <Typography.Title level={4} style={{ margin: 0 }}>Yêu cầu nghỉ / đổi lịch</Typography.Title>
      </div>

      <Card styles={{ body: { padding: '16px 20px' } }}>
        <Space wrap style={{ marginBottom: 14 }}>
          <Select
            style={{ width: 180 }} value={status} onChange={setStatus}
            options={[
              { value: 'pending', label: 'Chờ xử lý' },
              { value: 'approved', label: 'Đã chấp nhận' },
              { value: 'rejected', label: 'Đã từ chối' },
              { value: '', label: 'Tất cả' },
            ]}
          />
        </Space>
        <Table columns={columns} dataSource={data ?? []} rowKey="id" loading={isLoading} size="small"
          scroll={{ x: 'max-content' }} pagination={{ pageSize: 30, showSizeChanger: false }} />
      </Card>

      <Modal
        title={decision ? DECISION_TITLE[decision.status] : ''}
        open={!!decision}
        onCancel={closeDecision}
        okText="Xác nhận"
        cancelText="Đóng"
        confirmLoading={decide.isPending}
        onOk={() => decide.mutate({ id: decision.request.id, status: decision.status, note: adminNote })}
        destroyOnClose
      >
        {decision && (
          <p style={{ marginTop: 0 }}>
            {decision.request.learnerName} · {TYPE_LABEL[decision.request.type]} · {fmtDate(decision.request.sessionDate)}
          </p>
        )}
        <Input.TextArea rows={3} maxLength={500} value={adminNote} onChange={e => setAdminNote(e.target.value)}
          placeholder="Ghi chú gửi phụ huynh (tuỳ chọn)" />
      </Modal>
    </div>
  )
}
