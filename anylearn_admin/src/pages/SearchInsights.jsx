import { Button, Card, Col, Row, Select, Space, Statistic, Table, Tag, Typography } from 'antd'
import { DownloadOutlined, LineChartOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import client from '../api/client'
import { downloadCsv } from '../utils/csv'
import { fmtVND } from '../utils/format'

const PERIODS = [{ value: 7, label: '7 ngày' }, { value: 30, label: '30 ngày' }, { value: 90, label: '90 ngày' }]
const AGE_LABEL = { '3-5': '3–5 tuổi', '6-10': '6–10 tuổi', '11-15': '11–15 tuổi', '16+': '16 tuổi trở lên' }
const PROVINCE_LABEL = { 79: 'TP.HCM', '01': 'Hà Nội' }
const STATUS_LABEL = { new: 'Mới', contacting: 'Đang liên hệ', matched: 'Đã tìm được', no_partner: 'Chưa có đối tác', closed: 'Đã đóng' }

const percent = (part, whole) => (whole ? `${Math.round((part / whole) * 100)}%` : '—')
const dash = (value) => value ?? '—'

const keywordColumns = [
  { title: 'Từ khoá', dataIndex: 'keyword', key: 'keyword' },
  { title: 'Lượt tìm', dataIndex: 'searches', key: 'searches', width: 90, align: 'right' },
  { title: 'Không có kết quả', key: 'noResult', width: 140, align: 'right', render: (_, r) => `${r.noResult} (${percent(r.noResult, r.searches)})` },
  { title: 'Có bấm xem', dataIndex: 'clicked', key: 'clicked', width: 100, align: 'right' },
]

function Section({ title, extra, children }) {
  return <Card title={title} extra={extra} size="small" style={{ marginBottom: 16 }}>{children}</Card>
}

function SmallTable({ columns, data }) {
  return <Table columns={columns} dataSource={data ?? []} rowKey={(r) => JSON.stringify(r)} size="small" pagination={false} scroll={{ x: 'max-content' }} />
}

export default function SearchInsights() {
  const [days, setDays] = useState(30)
  const { data, isLoading } = useQuery({
    queryKey: ['admin-search-insights', days],
    queryFn: () => client.get('/admin/insights/search', { params: { days } }).then(r => r.data?.data),
  })
  const summary = data?.summary

  const exportNoResult = () => downloadCsv(`tu-khoa-khong-co-ket-qua-${days}-ngay.csv`,
    [{ key: 'keyword', title: 'Từ khoá' }, { key: 'searches', title: 'Lượt tìm' }, { key: 'noResult', title: 'Không có kết quả' }, { key: 'clicked', title: 'Có bấm xem' }],
    data?.noResultKeywords ?? [])

  const demandColumns = [
    { title: 'Độ tuổi', dataIndex: 'age', key: 'age', render: v => AGE_LABEL[v] ?? dash(v) },
    { title: 'Khu vực', dataIndex: 'location', key: 'location', render: v => PROVINCE_LABEL[v] ?? dash(v) },
    { title: 'Lĩnh vực', dataIndex: 'category', key: 'category', render: dash },
    { title: 'Lượt tìm', dataIndex: 'searches', key: 'searches', align: 'right' },
    { title: 'Không có kết quả', key: 'noResult', align: 'right', render: (_, r) => `${r.noResult} (${percent(r.noResult, r.searches)})` },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <LineChartOutlined style={{ fontSize: 20, color: '#1677ff' }} />
        <Typography.Title level={4} style={{ margin: 0 }}>Xu hướng nhu cầu</Typography.Title>
        <Select style={{ width: 120, marginLeft: 'auto' }} value={days} options={PERIODS} onChange={setDays} />
      </div>

      <Card loading={isLoading} size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={12} md={6}><Statistic title="Lượt tìm kiếm" value={summary?.searches ?? 0} /></Col>
          <Col xs={12} md={6}><Statistic title="Người tìm (trình duyệt)" value={summary?.visitors ?? 0} /></Col>
          <Col xs={12} md={6}><Statistic title="Không có kết quả" value={percent(summary?.noResult, summary?.searches)} /></Col>
          <Col xs={12} md={6}><Statistic title="Có bấm xem khóa học" value={percent(summary?.clicked, summary?.searches)} /></Col>
        </Row>
      </Card>

      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Section title="Từ khoá được tìm nhiều"><SmallTable columns={keywordColumns} data={data?.topKeywords} /></Section>
        </Col>
        <Col xs={24} lg={12}>
          <Section title="Từ khoá không có kết quả (đi tìm đối tác)"
            extra={<Button size="small" icon={<DownloadOutlined />} onClick={exportNoResult} disabled={!data?.noResultKeywords?.length}>CSV</Button>}>
            <SmallTable columns={keywordColumns} data={data?.noResultKeywords} />
          </Section>
        </Col>
      </Row>

      <Section title="Nhu cầu theo độ tuổi × khu vực × lĩnh vực (các lượt tìm có dùng bộ lọc)">
        <SmallTable columns={demandColumns} data={data?.demand} />
      </Section>

      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Section title="Khách nhờ tìm giúp">
            <Space wrap style={{ marginBottom: 10 }}>
              {(data?.requestsByStatus ?? []).map(r => <Tag key={r.status}>{STATUS_LABEL[r.status] ?? r.status}: {r.requests}</Tag>)}
            </Space>
            <SmallTable data={data?.requestSubjects} columns={[
              { title: 'Nhu cầu', dataIndex: 'subject', key: 'subject' },
              { title: 'Yêu cầu', dataIndex: 'requests', key: 'requests', align: 'right' },
              { title: 'Đã tìm được', dataIndex: 'matched', key: 'matched', align: 'right' },
              { title: 'Chưa có đối tác', dataIndex: 'noPartner', key: 'noPartner', align: 'right' },
            ]} />
          </Section>
        </Col>
        <Col xs={24} lg={12}>
          <Section title="Lĩnh vực được xem nhiều nhưng ít đơn">
            <SmallTable data={data?.categoryFunnel} columns={[
              { title: 'Lĩnh vực', dataIndex: 'category', key: 'category' },
              { title: 'Lượt xem', dataIndex: 'views', key: 'views', align: 'right', render: fmtVND },
              { title: 'Đơn hoàn thành', dataIndex: 'orders', key: 'orders', align: 'right', render: fmtVND },
              { title: 'Đơn / lượt xem', key: 'rate', align: 'right', render: (_, r) => percent(r.orders, r.views) },
            ]} />
          </Section>
        </Col>
      </Row>
    </div>
  )
}
