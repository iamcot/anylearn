import { Card, Col, Row, Segmented, Space, Statistic, Table, Typography } from 'antd'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import client from '../api/client'

const fmt = v => Number(v ?? 0).toLocaleString('vi-VN')
const money = v => `${fmt(v)}đ`
const rate = (part, whole) => (whole ? `${Math.round((part / whole) * 1000) / 10}%` : '–')

// Visits, sign-ups and buyers by where people came from (plan 19.A4). Visits = arrivals with UTM parameters, counted once
// per browser session; a sign-up keeps the first link of its browser; a buyer has at least one delivered order.
const numberCols = [
  { title: 'Lượt vào', dataIndex: 'visits', align: 'right', render: fmt },
  { title: 'Đăng ký', dataIndex: 'signups', align: 'right', render: v => <b>{fmt(v)}</b> },
  { title: 'Tỉ lệ đăng ký', key: 'signupRate', align: 'right', render: (_, r) => (r.visits ? rate(r.signups, r.visits) : '–') },
  { title: 'Đã mua', dataIndex: 'buyers', align: 'right', render: fmt },
  { title: 'Doanh thu', dataIndex: 'revenue', align: 'right', render: money },
]

export default function Acquisition() {
  const [days, setDays] = useState(30)
  const { data, isLoading } = useQuery({
    queryKey: ['admin-acquisition', days],
    queryFn: () => client.get('/admin/acquisition', { params: { days } }).then(r => r.data?.data),
  })
  const t = data?.totals

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }} wrap>
        <Typography.Title level={4} style={{ margin: 0 }}>Nguồn khách</Typography.Title>
        <Segmented value={days} onChange={setDays} options={[{ label: '7 ngày', value: 7 }, { label: '30 ngày', value: 30 }, { label: '90 ngày', value: 90 }]} />
      </Space>
      <Typography.Paragraph type="secondary">
        Lượt vào là số lần có người mở link mang tham số UTM (utm_source, utm_campaign...), mỗi trình duyệt đếm một lần trong một phiên.
        Đăng ký tính theo link UTM đầu tiên của trình duyệt đó trong 30 ngày trước khi đăng ký; không có link UTM thì là "trực tiếp", chỉ có mã giới thiệu thì là "giới thiệu".
        Đã mua = tài khoản có ít nhất một đơn đã hoàn thành.
      </Typography.Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}><Card loading={isLoading}><Statistic title="Lượt vào có UTM" value={t?.visits ?? 0} /></Card></Col>
        <Col xs={12} md={6}><Card loading={isLoading}><Statistic title="Tài khoản mới" value={t?.signups ?? 0} /></Card></Col>
        <Col xs={12} md={6}><Card loading={isLoading}><Statistic title="Đã mua" value={t?.buyers ?? 0} suffix={t?.signups ? `(${rate(t.buyers, t.signups)})` : undefined} /></Card></Col>
        <Col xs={12} md={6}><Card loading={isLoading}><Statistic title="Doanh thu từ tài khoản mới" value={money(t?.revenue)} /></Card></Col>
      </Row>

      <Card title="Theo kênh" style={{ marginTop: 16 }} loading={isLoading}>
        <Table size="small" rowKey="channel" pagination={false} dataSource={data?.channels ?? []} scroll={{ x: 700 }}
          columns={[{ title: 'Kênh (nguồn / phương tiện)', dataIndex: 'channel' }, ...numberCols]} />
      </Card>

      <Card title="Theo chiến dịch" style={{ marginTop: 16 }} loading={isLoading}>
        <Table size="small" rowKey="campaign" pagination={{ pageSize: 20 }} dataSource={data?.campaigns ?? []} scroll={{ x: 700 }}
          columns={[{ title: 'Chiến dịch (utm_campaign)', dataIndex: 'campaign' }, ...numberCols]} />
      </Card>

      <Card title="Theo video / bài (utm_content)" style={{ marginTop: 16 }} loading={isLoading}>
        <Table size="small" rowKey="content" pagination={{ pageSize: 20 }} dataSource={data?.contents ?? []} scroll={{ x: 800 }}
          columns={[
            { title: 'Mã nội dung', dataIndex: 'content' },
            { title: 'Bài Khám phá', key: 'post', render: (_, r) => (r.postId ? `#${r.postId} ${r.postTitle ?? ''}` : '') },
            ...numberCols,
          ]} />
      </Card>

      <Card title="Theo ngày" style={{ marginTop: 16 }} loading={isLoading}>
        <Table size="small" rowKey="day" pagination={{ pageSize: 15 }} dataSource={[...(data?.daily ?? [])].reverse()}
          columns={[
            { title: 'Ngày', dataIndex: 'day', width: 120 },
            { title: 'Lượt vào có UTM', dataIndex: 'visits', align: 'right', render: fmt },
            { title: 'Tài khoản mới', dataIndex: 'signups', align: 'right', render: fmt },
          ]} />
      </Card>
    </div>
  )
}
