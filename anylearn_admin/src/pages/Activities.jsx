import { App, Button, Card, Input, Modal, Select, Space, Table, Tag, Tooltip, Typography } from 'antd'
import { CalendarOutlined, SearchOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import { fmtDateTime } from '../utils/format'

const TYPE_LABEL = { trial: 'Học thử', test: 'Test đầu vào', visit: 'Tham quan' }
const TYPE_COLOR = { trial: 'blue', test: 'purple', visit: 'green' }
const STATUS_TAG = { '-1': ['Đã từ chối', 'error'], '0': ['Chờ duyệt', 'warning'], '1': ['Đã duyệt', 'success'] }

export default function Activities() {
  const [typeFilter, setTypeFilter] = useState(null)
  const [partnerId, setPartnerId] = useState(null)
  const [search, setSearch] = useState('')
  const [searchVal, setSearchVal] = useState('')
  const [page, setPage] = useState(1)
  const qc = useQueryClient()
  const { message } = App.useApp()
  const [deciding, setDeciding] = useState(null) // { row, decision }
  const [note, setNote] = useState('')

  const { data: partners } = useQuery({
    queryKey: ['admin-partners'],
    queryFn: () => client.get('/admin/partners').then(r => r.data?.data ?? []),
    staleTime: 10 * 60_000,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-activities', typeFilter, partnerId, search, page],
    queryFn: () => client.get('/admin/activities', {
      params: { type: typeFilter || undefined, partnerId: partnerId || undefined, search: search || undefined, page: page - 1, size: 30 },
    }).then(r => r.data?.data ?? { content: [] }),
  })

  const decideMutation = useMutation({
    mutationFn: ({ row, decision, text }) => client.put(`/admin/activities/${row.id}/decision`, { decision, message: text }).then(r => r.data),
    onSuccess: (res) => {
      if (res.resultCode !== 1) { message.error(res.message); return }
      setDeciding(null)
      setNote('')
      qc.invalidateQueries({ queryKey: ['admin-activities'] })
      qc.invalidateQueries({ queryKey: ['admin-badges'] })
    },
  })

  const columns = [
    {
      title: 'Học sinh', key: 'student', width: 160,
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{r.userName || '—'}</div>
          <div style={{ fontSize: 11, color: '#888' }}>{r.userPhone}</div>
        </div>
      ),
    },
    {
      title: 'Khóa học', key: 'item',
      render: (_, r) => (
        <div>
          <div style={{ fontSize: 13 }}>{r.itemTitle}</div>
          {r.partnerName && <div style={{ fontSize: 11, color: '#888' }}>{r.partnerName}</div>}
        </div>
      ),
    },
    {
      title: 'Hoạt động', dataIndex: 'trialType', key: 'type', width: 130,
      render: v => <Tag color={TYPE_COLOR[v] ?? 'default'}>{TYPE_LABEL[v] ?? v}</Tag>,
    },
    {
      title: 'Ngày', dataIndex: 'trialDate', key: 'date', width: 100,
      render: v => <span style={{ fontSize: 12 }}>{v || '—'}</span>,
    },
    {
      title: 'Ghi chú', dataIndex: 'trialNote', key: 'note',
      render: v => <span style={{ fontSize: 12, color: '#888' }}>{v || '—'}</span>,
    },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 170,
      render: (v, r) => {
        const s = String(v)
        if (s === '1' || s === '-1') {
          const [label, color] = STATUS_TAG[s]
          return <Tooltip title={r.adminNote || null}><Tag color={color}>{label}</Tag>{r.adminNote && <div style={{ fontSize: 11, color: '#888' }}>{r.adminNote}</div>}</Tooltip>
        }
        return (
          <Space size={6}>
            <Button size="small" type="primary" onClick={() => setDeciding({ row: r, decision: 'approve' })}>Duyệt</Button>
            <Button size="small" danger onClick={() => setDeciding({ row: r, decision: 'reject' })}>Từ chối</Button>
          </Space>
        )
      },
    },
    {
      title: 'Đăng ký lúc', dataIndex: 'createdAt', key: 'created', width: 130,
      render: v => <span style={{ fontSize: 11, color: '#888' }}>{v ? fmtDateTime(v) : '—'}</span>,
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <CalendarOutlined style={{ fontSize: 20, color: '#7c3aed' }} />
        <Typography.Title level={4} style={{ margin: 0 }}>Đăng ký hoạt động</Typography.Title>
      </div>

      <Card styles={{ body: { padding: '16px 20px' } }}>
        {/* Filters inside card */}
        <Space wrap style={{ marginBottom: 14 }}>
          <Input.Search
            placeholder="Tìm tên / SĐT học viên"
            allowClear style={{ width: 220 }} prefix={<SearchOutlined />}
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            onSearch={v => { setSearch(v); setPage(1) }}
            onClear={() => { setSearch(''); setPage(1) }}
          />
          <Select
            allowClear placeholder="Loại hoạt động" style={{ width: 160 }} value={typeFilter}
            onChange={v => { setTypeFilter(v); setPage(1) }}
            options={[
              { value: 'trial', label: 'Học thử' },
              { value: 'test', label: 'Test đầu vào' },
              { value: 'visit', label: 'Tham quan' },
            ]}
          />
          <Select
            allowClear placeholder="Đối tác / Trường" style={{ width: 200 }} value={partnerId}
            onChange={v => { setPartnerId(v); setPage(1) }}
            showSearch optionFilterProp="label"
            options={(partners ?? []).map(p => ({ value: p.id, label: p.name || p.phone }))}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={data?.content ?? []}
          rowKey="id"
          loading={isLoading}
          size="small"
          scroll={{ x: 'max-content' }}
          pagination={{
            current: page, pageSize: 30, total: data?.total ?? 0, showSizeChanger: false,
            onChange: p => setPage(p),
          }}
        />
      </Card>

      <Modal
        open={Boolean(deciding)}
        title={deciding?.decision === 'approve' ? 'Duyệt đăng ký' : 'Từ chối đăng ký'}
        okText={deciding?.decision === 'approve' ? 'Duyệt và báo khách' : 'Từ chối và báo khách'}
        okButtonProps={{ danger: deciding?.decision === 'reject', disabled: deciding?.decision === 'reject' && !note.trim(), loading: decideMutation.isPending }}
        cancelText="Hủy"
        onCancel={() => { setDeciding(null); setNote('') }}
        onOk={() => decideMutation.mutate({ row: deciding.row, decision: deciding.decision, text: note })}
      >
        <Typography.Paragraph type="secondary">
          {deciding?.row.userName} đăng ký {TYPE_LABEL[deciding?.row.trialType] ?? ''} khóa &quot;{deciding?.row.itemTitle}&quot;.{' '}
          {deciding?.decision === 'approve'
            ? 'Có thể ghi thêm giờ, địa điểm, đồ cần mang. Nội dung được gửi cho khách qua thông báo.'
            : 'Lý do được gửi cho khách qua thông báo.'}
        </Typography.Paragraph>
        <Input.TextArea rows={3} maxLength={500} showCount style={{ marginBottom: 24 }} value={note} onChange={e => setNote(e.target.value)}
          placeholder={deciding?.decision === 'approve' ? 'Ví dụ: Mời bạn đến lớp 9h sáng thứ Bảy, mang theo vở và bút' : 'Ví dụ: Lớp học thử tuần này đã đủ chỗ, mời bạn đăng ký tuần sau'} />
      </Modal>
    </div>
  )
}
