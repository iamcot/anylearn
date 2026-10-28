import { Alert, Card, Col, Row, Segmented, Space, Statistic, Table, Typography } from 'antd'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import client from '../api/client'

const fmt = v => Number(v ?? 0).toLocaleString('vi-VN')
// Estimated cost in USD: small amounts need more decimals.
const usd = v => {
  const n = Number(v ?? 0)
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: n < 1 ? 4 : 2 })}`
}

// Tokens in and out of every feature that calls the Anthropic API (AnthropicClient logs each call into ai_usage_log).
export default function AiUsage() {
  const [days, setDays] = useState(30)
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
        Mô hình đang dùng: {data?.model ?? '–'}.
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
