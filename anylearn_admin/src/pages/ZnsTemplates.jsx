import { Alert, Button, Card, Input, Select, Space, Switch, Table, Tag, Typography, message } from 'antd'
import { MessageOutlined, SendOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'

const STATUS = {
  queued: { color: 'default', label: 'Đang chờ' },
  sent: { color: 'green', label: 'Đã gửi' },
  failed: { color: 'red', label: 'Lỗi' },
  stub: { color: 'orange', label: 'Chỉ ghi log' },
}

const statusTag = (status) => {
  const s = STATUS[status] ?? { color: 'default', label: status }
  return <Tag color={s.color}>{s.label}</Tag>
}

const formatTime = (value) => value ? new Date(value).toLocaleString('vi-VN') : ''

function TemplateCard({ template, onSaved }) {
  const [templateId, setTemplateId] = useState(null)
  const [testPhone, setTestPhone] = useState('')
  const id = templateId ?? template.templateId

  const save = useMutation({
    mutationFn: (patch) => client.put('/admin/zns/templates', { templates: [{ key: template.key, ...patch }] }).then(r => r.data),
    onSuccess: (res) => {
      if (res.resultCode !== 1) return message.error(res.message)
      message.success('Đã lưu')
      setTemplateId(null)
      onSaved()
    },
  })

  const test = useMutation({
    mutationFn: () => client.post(`/admin/zns/templates/${template.key}/test`, testPhone ? { phone: testPhone } : {}).then(r => r.data),
    onSuccess: (res) => {
      onSaved()
      if (res.resultCode !== 1) return message.error(`Zalo từ chối: ${res.message}`, 8)
      message.success(res.data.stub ? 'Server chưa cấu hình Zalo (ZALO_APP_ID trống): tin chỉ được ghi log' : `Đã gửi tới ${res.data.phone}`)
    },
  })

  const counts = template.last7Days ?? {}
  return (
    <Card size="small" style={{ marginBottom: 12 }}
      title={<Space><span>{template.label}</span>{template.enabled ? <Tag color="green">Đang bật</Tag> : <Tag>Đang tắt</Tag>}</Space>}
      extra={<Switch checked={template.enabled} loading={save.isPending} onChange={(checked) => save.mutate({ enabled: checked })} />}>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>Khi gửi: {template.when}</Typography.Paragraph>
      <Space wrap style={{ marginBottom: 8 }}>
        <span>Mã mẫu ZNS:</span>
        <Input style={{ width: 140 }} value={id} onChange={e => setTemplateId(e.target.value)} placeholder={template.defaultTemplateId} />
        <Button onClick={() => save.mutate({ templateId: id })} disabled={templateId === null} loading={save.isPending}>Lưu mã</Button>
        <Typography.Text type="secondary">(để trống = mã đã duyệt {template.defaultTemplateId})</Typography.Text>
      </Space>
      <div style={{ marginBottom: 8 }}>
        <Typography.Text type="secondary">Tham số gửi kèm: </Typography.Text>
        {template.params.map(p => <Tag key={p}>{p}</Tag>)}
      </div>
      <pre style={{ background: '#fafafa', padding: 8, fontSize: 12, margin: '0 0 8px', whiteSpace: 'pre-wrap' }}>
        {JSON.stringify(template.sample, null, 2)}
      </pre>
      <Space wrap>
        <Input style={{ width: 180 }} value={testPhone} onChange={e => setTestPhone(e.target.value)} placeholder="SĐT nhận thử (trống = của bạn)" />
        <Button icon={<SendOutlined />} onClick={() => test.mutate()} loading={test.isPending}>Gửi thử dữ liệu mẫu</Button>
        <Typography.Text type="secondary">7 ngày: gửi {counts.sent ?? 0} · lỗi {counts.failed ?? 0}{counts.stub ? ` · chỉ log ${counts.stub}` : ''}</Typography.Text>
      </Space>
    </Card>
  )
}

export default function ZnsTemplates() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState({ template: undefined, status: undefined, page: 0 })

  const { data } = useQuery({
    queryKey: ['admin-zns-templates'],
    queryFn: () => client.get('/admin/zns/templates').then(r => r.data?.data),
  })
  const { data: log, isFetching } = useQuery({
    queryKey: ['admin-zns-messages', filter],
    queryFn: () => client.get('/admin/zns/messages', { params: { ...filter, size: 20 } }).then(r => r.data?.data),
  })
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin-zns-templates'] })
    qc.invalidateQueries({ queryKey: ['admin-zns-messages'] })
  }

  const templateOptions = (data?.templates ?? []).map(t => ({ value: t.key, label: t.label }))
  const labelOf = Object.fromEntries(templateOptions.map(o => [o.value, o.label]))

  const columns = [
    { title: 'Lúc', dataIndex: 'createdAt', key: 'createdAt', width: 160, render: formatTime },
    { title: 'Mẫu', dataIndex: 'templateKey', key: 'templateKey', width: 180, render: key => labelOf[key] ?? key },
    { title: 'Người nhận', key: 'who', width: 200, render: (_, row) => <span>{row.userName || '—'}<br /><Typography.Text type="secondary">{row.phone}</Typography.Text></span> },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 110, render: statusTag },
    { title: 'Dữ liệu / lỗi', key: 'data', render: (_, row) => (
      <span style={{ fontSize: 12 }}>
        {row.error && <Typography.Text type="danger" style={{ display: 'block' }}>{row.error}</Typography.Text>}
        <Typography.Text type="secondary" style={{ wordBreak: 'break-all' }}>{row.templateData}</Typography.Text>
      </span>
    ) },
  ]

  return (
    <div style={{ padding: 24, maxWidth: 1000 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <MessageOutlined style={{ fontSize: 20, color: '#1677ff' }} />
        <Typography.Title level={4} style={{ margin: 0 }}>Mẫu Zalo ZNS</Typography.Title>
      </div>

      {data && !data.configured && <Alert type="warning" showIcon style={{ marginBottom: 16 }}
        message="Server chưa có ZALO_APP_ID: tin ZNS chỉ được ghi vào nhật ký bên dưới, không gửi thật." />}
      <Alert type="info" showIcon style={{ marginBottom: 16 }}
        message="Tin ZNS gửi tới số điện thoại của tài khoản (phụ huynh). Người dùng tắt kênh Zalo ở Tài khoản > Thông báo thì không nhận tin nhắc lịch, khảo sát, nhắc thanh toán; tin xác nhận đơn luôn gửi. Mỗi tin chỉ gửi một lần."
        description="Mỗi tin gửi thật đều tính phí Zalo. Dùng nút Gửi thử để kiểm tra tên tham số với mẫu đã duyệt trước khi bật." />

      {(data?.templates ?? []).map(t => <TemplateCard key={t.key} template={t} onSaved={refresh} />)}

      <Card size="small" title="Nhật ký gửi">
        <Space style={{ marginBottom: 12 }} wrap>
          <Select allowClear placeholder="Mẫu" style={{ width: 220 }} options={templateOptions} value={filter.template}
            onChange={template => setFilter({ ...filter, template, page: 0 })} />
          <Select allowClear placeholder="Trạng thái" style={{ width: 160 }} value={filter.status}
            options={Object.entries(STATUS).map(([value, s]) => ({ value, label: s.label }))}
            onChange={status => setFilter({ ...filter, status, page: 0 })} />
        </Space>
        <Table columns={columns} dataSource={log?.items ?? []} rowKey="id" size="small" loading={isFetching}
          locale={{ emptyText: 'Chưa có tin nào' }}
          pagination={{ current: filter.page + 1, pageSize: 20, total: log?.total ?? 0, showSizeChanger: false,
            onChange: page => setFilter({ ...filter, page: page - 1 }) }} />
      </Card>
    </div>
  )
}
