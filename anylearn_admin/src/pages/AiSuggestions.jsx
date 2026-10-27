import { Alert, Card, Col, DatePicker, Row, Space, Statistic, Table, Tag, Typography } from 'antd'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import client from '../api/client'

const { RangePicker } = DatePicker

// Usage, clicks, orders and feedback of the AI course suggestions. The switch and the numbers of courses are in
// Cài đặt > Vận hành > Gợi ý khóa học bằng AI.
export default function AiSuggestions() {
  const [range, setRange] = useState([dayjs().subtract(29, 'day'), dayjs()])
  const from = range[0].format('YYYY-MM-DD')
  const to = range[1].format('YYYY-MM-DD')
  const { data, isLoading } = useQuery({
    queryKey: ['admin-ai-suggestions', from, to],
    queryFn: () => client.get('/admin/ai-suggestions/stats', { params: { from, to } }).then(r => r.data?.data),
  })
  const s = data?.summary

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }} wrap>
        <Typography.Title level={4} style={{ margin: 0 }}>Gợi ý khóa học bằng AI</Typography.Title>
        <RangePicker value={range} allowClear={false} onChange={value => value && setRange(value)} />
      </Space>

      {s && !s.configured && (
        <Alert type="warning" showIcon style={{ marginBottom: 16 }}
          message="Máy chủ chưa có khóa API của Anthropic (ANTHROPIC_API_KEY), nên gợi ý đang chạy theo luật, AI chưa được gọi." />
      )}
      {s && s.configured && !s.enabled && (
        <Alert type="info" showIcon style={{ marginBottom: 16 }} message="Tính năng đang tắt. Bật lại ở Cài đặt > Vận hành > Gợi ý khóa học bằng AI." />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}><Card loading={isLoading}><Statistic title="Lượt gợi ý (gọi AI)" value={s?.suggestions ?? 0} /></Card></Col>
        <Col xs={12} md={6}><Card loading={isLoading}><Statistic title="Số bé / người học" value={s?.learners ?? 0} /></Card></Col>
        <Col xs={12} md={6}><Card loading={isLoading}><Statistic title="Token gửi đi" value={s?.inputTokens ?? 0} /></Card></Col>
        <Col xs={12} md={6}><Card loading={isLoading}><Statistic title="Token nhận về" value={s?.outputTokens ?? 0} /></Card></Col>
        <Col xs={12} md={6}><Card loading={isLoading}><Statistic title="Lượt xem khóa" value={s?.views ?? 0} /></Card></Col>
        <Col xs={12} md={6}><Card loading={isLoading}><Statistic title="Lượt bấm" value={s?.clicks ?? 0} /></Card></Col>
        <Col xs={12} md={6}><Card loading={isLoading}><Statistic title="Tỷ lệ bấm" value={s?.clickRate ?? 0} suffix="%" /></Card></Col>
        <Col xs={12} md={6}><Card loading={isLoading}><Statistic title="Có đơn (30 ngày sau khi bấm)" value={s?.orders ?? 0} /></Card></Col>
      </Row>

      <Card title="Phản hồi của phụ huynh" style={{ marginTop: 16 }} loading={isLoading}>
        <Space size="large" wrap style={{ marginBottom: 12 }}>
          <Statistic title="👍 Hợp" value={s?.thumbsUp ?? 0} />
          <Statistic title="👎 Chưa hợp" value={s?.thumbsDown ?? 0} />
        </Space>
        <Typography.Paragraph type="secondary">
          Lý do bị chê nhiều nhất được đưa vào lần gợi ý sau để AI tránh lặp lại, cùng với phản hồi riêng của từng bé.
        </Typography.Paragraph>
        <Space wrap style={{ marginBottom: 12 }}>
          {(s?.downReasons ?? []).map(r => <Tag key={r.key} color="red">{r.label}: {r.count}</Tag>)}
        </Space>
        <Table rowKey="id" size="small" dataSource={data?.feedback ?? []} pagination={{ pageSize: 10 }}
          columns={[
            { title: 'Ngày', dataIndex: 'createdAt', key: 'createdAt', width: 110, render: v => String(v).slice(0, 10) },
            { title: 'Người học', dataIndex: 'learnerName', key: 'learnerName', width: 140 },
            { title: 'Đánh giá', dataIndex: 'rating', key: 'rating', width: 90, render: v => (v > 0 ? '👍' : '👎') },
            { title: 'Lý do', dataIndex: 'reasons', key: 'reasons', render: list => (list ?? []).map(label => <Tag key={label}>{label}</Tag>) },
            { title: 'Góp ý', dataIndex: 'comment', key: 'comment' },
          ]} />
      </Card>

      <Card title="Theo ngày" style={{ marginTop: 16 }} loading={isLoading}>
        <Table rowKey="day" size="small" dataSource={s?.daily ?? []} pagination={{ pageSize: 10 }}
          columns={[
            { title: 'Ngày', dataIndex: 'day', key: 'day' },
            { title: 'Lượt gọi AI', dataIndex: 'suggestions', key: 'suggestions', align: 'right' },
            { title: 'Token', dataIndex: 'tokens', key: 'tokens', align: 'right' },
          ]} />
      </Card>
    </div>
  )
}
