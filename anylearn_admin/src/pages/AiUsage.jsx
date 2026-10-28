import { Alert, Button, Card, Col, Row, Segmented, Select, Space, Statistic, Table, Typography, message } from 'antd'
import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'

const fmt = v => Number(v ?? 0).toLocaleString('vi-VN')
// Estimated cost in USD: small amounts need more decimals.
const usd = v => {
  const n = Number(v ?? 0)
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: n < 1 ? 4 : 2 })}`
}

// Which model each AI feature calls; saved at once, no deploy needed.
function ModelPicker({ onSaved }) {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['admin-ai-models'], queryFn: () => client.get('/admin/ai-usage/models').then(r => r.data?.data) })
  const [picks, setPicks] = useState({})
  const [saving, setSaving] = useState(false)
  useEffect(() => { if (data) setPicks(Object.fromEntries(data.features.map(f => [f.feature, f.model]))) }, [data])
  const options = (data?.models ?? []).map(m => ({ value: m.model, label: `${m.model}  ($${m.priceInput} gửi đi / $${m.priceOutput} nhận về mỗi 1 triệu token)` }))
  const dirty = (data?.features ?? []).some(f => picks[f.feature] !== f.model)
  const save = async () => {
    setSaving(true)
    try {
      const res = await client.put('/admin/ai-usage/models', { models: picks }).then(r => r.data)
      if (res?.resultCode !== 1) message.error(res.message || 'Không lưu được')
      else { message.success('Đã lưu, áp dụng từ lần gọi AI kế tiếp'); qc.invalidateQueries({ queryKey: ['admin-ai-models'] }); onSaved?.() }
    } catch (e) {
      message.error(e.message || 'Không lưu được')
    } finally { setSaving(false) }
  }
  return (
    <Card title="Mô hình cho từng tính năng" style={{ marginTop: 16 }} loading={isLoading}>
      <Typography.Paragraph type="secondary">
        Mỗi tính năng chọn một mô hình riêng. Mô hình rẻ (Haiku) đủ cho việc nhẹ, mô hình mạnh hơn (Sonnet, Opus) chính xác hơn nhưng đắt hơn nhiều lần. Đổi xong có hiệu lực ngay, không cần deploy; mặc định của máy chủ là {data?.defaultModel}.
      </Typography.Paragraph>
      <Space direction="vertical" style={{ width: '100%' }}>
        {(data?.features ?? []).map(f => (
          <Row key={f.feature} gutter={12} align="middle">
            <Col xs={24} md={8}>{f.label}</Col>
            <Col xs={24} md={16}><Select style={{ width: '100%' }} value={picks[f.feature]} options={options} onChange={v => setPicks(p => ({ ...p, [f.feature]: v }))} /></Col>
          </Row>
        ))}
        <Button type="primary" loading={saving} disabled={!dirty} onClick={save}>Lưu</Button>
      </Space>
    </Card>
  )
}

// Tokens in and out of every feature that calls the Anthropic API (AnthropicClient logs each call into ai_usage_log).
export default function AiUsage() {
  const [days, setDays] = useState(30)
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['admin-ai-usage', days],
    queryFn: () => client.get('/admin/ai-usage', { params: { days } }).then(r => r.data?.data),
  })
  const t = data?.totals
  const labels = Object.fromEntries((data?.features ?? []).map(f => [f.feature, f.label]))
  // one row per day, one column per feature (tokens in + out)
  const features = data?.features ?? []
  const byDay = {}
  for (const r of data?.daily ?? []) {
    byDay[r.day] ??= { day: r.day, costUsd: 0 }
    byDay[r.day].costUsd += r.costUsd ?? 0
    byDay[r.day][r.feature] = (byDay[r.day][r.feature] ?? 0) + r.inputTokens + r.outputTokens
  }
  const dailyRows = Object.values(byDay).sort((a, b) => b.day.localeCompare(a.day))
  const usageCols = [
    { title: 'Lần gọi', dataIndex: 'calls', align: 'right', render: fmt },
    { title: 'Lỗi', dataIndex: 'errors', align: 'right', render: v => (v ? <span style={{ color: '#d9363e' }}>{fmt(v)}</span> : 0) },
    { title: 'Token gửi đi', dataIndex: 'inputTokens', align: 'right', render: fmt },
    { title: 'Token nhận về', dataIndex: 'outputTokens', align: 'right', render: fmt },
    { title: 'Tổng', key: 'sum', align: 'right', render: (_, r) => <b>{fmt(r.inputTokens + r.outputTokens)}</b> },
    { title: 'Chi phí ước tính', dataIndex: 'costUsd', align: 'right', render: v => <b>{usd(v)}</b> },
    { title: 'Thời gian TB', dataIndex: 'avgMs', align: 'right', render: v => `${(v / 1000).toFixed(1)}s` },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }} wrap>
        <Typography.Title level={4} style={{ margin: 0 }}>Dùng AI (token)</Typography.Title>
        <Segmented value={days} onChange={setDays} options={[{ label: '7 ngày', value: 7 }, { label: '30 ngày', value: 30 }, { label: '90 ngày', value: 90 }]} />
      </Space>
      <Typography.Paragraph type="secondary">
        Mọi lần gọi API của Anthropic (gợi ý khóa học, so sánh khóa học, quiz) đều ghi vào đây, kể cả lần bị lỗi. Số liệu bắt đầu từ lúc bản này được triển khai.
        Mô hình mặc định của máy chủ: {data?.model ?? '–'} (mỗi tính năng có thể chọn mô hình riêng ở bảng bên dưới).
        Chi phí là số ước tính theo giá niêm yết của Anthropic cho từng mô hình (USD cho mỗi triệu token, xem bảng "Theo mô hình"), chưa tính giảm giá khi dùng cache hay phụ phí prompt dài trên 100.000 token.
      </Typography.Paragraph>
      {data?.hasUnpriced && <Alert type="info" showIcon style={{ marginBottom: 16 }} message="Có mô hình chưa có giá trong hệ thống, chi phí của mô hình đó đang tính là $0." />}
      {data && !data.configured && <Alert type="warning" showIcon style={{ marginBottom: 16 }} message="Máy chủ chưa có khóa ANTHROPIC_API_KEY, AI chưa được gọi." />}

      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}><Card loading={isLoading}><Statistic title="Lần gọi" value={t?.calls ?? 0} suffix={t?.errors ? `(${t.errors} lỗi)` : undefined} /></Card></Col>
        <Col xs={12} md={6}><Card loading={isLoading}><Statistic title="Token gửi đi" value={t?.inputTokens ?? 0} /></Card></Col>
        <Col xs={12} md={6}><Card loading={isLoading}><Statistic title="Token nhận về" value={t?.outputTokens ?? 0} /></Card></Col>
        <Col xs={12} md={6}><Card loading={isLoading}><Statistic title="Tổng token" value={(t?.inputTokens ?? 0) + (t?.outputTokens ?? 0)} /></Card></Col>
        <Col xs={12} md={6}><Card loading={isLoading}><Statistic title="Chi phí ước tính" value={usd(t?.costUsd)} /></Card></Col>
        <Col xs={12} md={6}><Card loading={isLoading}><Statistic title="Chi phí TB mỗi lần gọi" value={usd(t?.calls ? t.costUsd / t.calls : 0)} /></Card></Col>
      </Row>

      <ModelPicker onSaved={() => qc.invalidateQueries({ queryKey: ['admin-ai-usage'] })} />

      <Card title="Theo tính năng" style={{ marginTop: 16 }} loading={isLoading}>
        <Table size="small" rowKey="feature" pagination={false} dataSource={features} scroll={{ x: 700 }}
          columns={[{ title: 'Tính năng', dataIndex: 'label' }, ...usageCols]} />
      </Card>

      <Card title="Theo mô hình" style={{ marginTop: 16 }} loading={isLoading}>
        <Table size="small" rowKey="model" pagination={false} dataSource={data?.models ?? []} scroll={{ x: 700 }}
          columns={[{ title: 'Mô hình', dataIndex: 'model' },
            { title: 'Giá gửi đi / 1 triệu token', dataIndex: 'priceInput', align: 'right', render: v => (v == null ? '–' : usd(v)) },
            { title: 'Giá nhận về / 1 triệu token', dataIndex: 'priceOutput', align: 'right', render: v => (v == null ? '–' : usd(v)) },
            ...usageCols]} />
      </Card>

      <Card title="Token và chi phí theo ngày" style={{ marginTop: 16 }} loading={isLoading}>
        <Table size="small" rowKey="day" pagination={{ pageSize: 15 }} dataSource={dailyRows} scroll={{ x: 700 }}
          columns={[
            { title: 'Ngày', dataIndex: 'day', width: 120 },
            ...features.map(f => ({ title: f.label, dataIndex: f.feature, align: 'right', render: v => fmt(v) })),
            { title: 'Tổng token', key: 'sum', align: 'right', render: (_, r) => <b>{fmt(features.reduce((s, f) => s + (r[f.feature] ?? 0), 0))}</b> },
            { title: 'Chi phí ước tính', dataIndex: 'costUsd', align: 'right', render: v => <b>{usd(v)}</b> },
          ]} />
      </Card>

      {(data?.recentErrors?.length ?? 0) > 0 && (
        <Card title="Lỗi gần đây" style={{ marginTop: 16 }}>
          <Table size="small" rowKey={r => `${r.created_at}${r.feature}`} pagination={false} dataSource={data.recentErrors}
            columns={[
              { title: 'Lúc', dataIndex: 'created_at', width: 170, render: v => String(v).replace('T', ' ').slice(0, 19) },
              { title: 'Tính năng', dataIndex: 'feature', width: 200, render: v => labels[v] ?? v },
              { title: 'Lỗi', dataIndex: 'error' },
            ]} />
        </Card>
      )}
    </div>
  )
}
