import { Card, Col, Row, Segmented, Statistic, Table, Typography } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import client from '../api/client'

const PERIODS = [
  { label: 'Hôm nay',   key: 'today',   days: 0,   granularity: 'day' },
  { label: 'Tuần này',  key: 'week',    days: 7,   granularity: 'day' },
  { label: 'Tháng này', key: 'month',   days: 30,  granularity: 'week' },
  { label: 'Quý này',   key: 'quarter', days: 90,  granularity: 'month' },
  { label: 'Năm này',   key: 'year',    days: 365, granularity: 'month' },
]

function toIso(d) { return d.toISOString().split('T')[0] }
function getDates(key) {
  const now = new Date(), to = toIso(now)
  const p = PERIODS.find(p => p.key === key) ?? PERIODS[2]
  if (p.days === 0) return { from: to, to }
  const d = new Date(now); d.setDate(d.getDate() - p.days)
  return { from: toIso(d), to }
}
const fmtM = (v) => Math.round((v ?? 0) / 1_000_000).toLocaleString('vi-VN')

export default function Dashboard() {
  const [period, setPeriod] = useState('month')
  const { from, to } = getDates(period)
  const gran = PERIODS.find(p => p.key === period)?.granularity ?? 'week'

  const q = (key) => ({ queryKey: [key, from, to, gran], staleTime: 60_000 })

  const { data: stats } = useQuery({ ...q('stats'), queryFn: () => client.get(`/admin/dashboard/stats?from=${from}&to=${to}`).then(r => r.data?.data) })
  const { data: userChart } = useQuery({ ...q('uc'), queryFn: () => client.get(`/admin/dashboard/chart/users?from=${from}&to=${to}&granularity=${gran}`).then(r => r.data?.data ?? []) })
  const { data: gmvChart } = useQuery({ ...q('gc'), queryFn: () => client.get(`/admin/dashboard/chart/gmv?from=${from}&to=${to}&granularity=${gran}`).then(r => (r.data?.data ?? []).map(row => ({ ...row, amount: Math.round(row.amount / 1_000_000) }))) })
  const { data: topPartners } = useQuery({ ...q('tp'), queryFn: () => client.get(`/admin/dashboard/top-partners?from=${from}&to=${to}`).then(r => r.data?.data ?? []) })
  const { data: topItems } = useQuery({ ...q('ti'), queryFn: () => client.get(`/admin/dashboard/top-items?from=${from}&to=${to}`).then(r => r.data?.data ?? []) })

  const kpis = [
    { title: 'User mới',        total: stats?.totalUsers,    period: stats?.newUsers,    count: true },
    { title: 'Đối tác mới',     total: stats?.totalPartners, period: stats?.newPartners, count: true },
    { title: 'Khóa học mới',    total: stats?.totalItems,    period: stats?.newItems,    count: true },
    { title: 'Đơn hàng mới',    total: stats?.totalOrders,   period: stats?.newOrders,   count: true },
    { title: 'Doanh thu (triệu)', total: stats?.totalRevenue, period: stats?.periodRevenue },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>Tổng quan</Typography.Title>
        <Segmented value={period} onChange={setPeriod} options={PERIODS.map(p => ({ label: p.label, value: p.key }))} />
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {kpis.map(({ title, total, period: p, count }) => (
          <Col key={title} flex="1" style={{ minWidth: 150 }}>
            <Card size="small">
              <Statistic title={title} value={count ? (total ?? 0) : fmtM(total)} suffix={count ? '' : 'tr'} />
              <div style={{ fontSize: 14, color: '#1677ff', marginTop: 4 }}>
                Kỳ này: {count ? (p ?? 0).toLocaleString() : `${fmtM(p)} tr`}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} lg={12}>
          <Card title="Tăng trưởng user" size="small">
            {!userChart?.length
              ? <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>Không có dữ liệu</div>
              : <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={userChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" stroke="#1677ff" fill="#e6f4ff" name="User mới" />
                  </AreaChart>
                </ResponsiveContainer>}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="GMV (triệu đồng)" size="small">
            {!gmvChart?.length
              ? <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>Không có dữ liệu</div>
              : <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={gmvChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => [`${v} tr`, 'GMV']} />
                    <Bar dataKey="amount" fill="#1677ff" name="GMV" />
                  </BarChart>
                </ResponsiveContainer>}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Top đối tác" size="small">
            <Table size="small" pagination={false} dataSource={topPartners} rowKey="userId"
              columns={[
                { title: 'Đối tác', dataIndex: 'name' },
                { title: 'SĐT', dataIndex: 'phone' },
                { title: 'Đơn', dataIndex: 'orderCount' },
                { title: 'GMV', dataIndex: 'revenue', render: v => `${fmtM(v)} tr` },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Top khóa học" size="small">
            <Table size="small" pagination={false} dataSource={topItems} rowKey="itemId"
              columns={[
                { title: 'Khóa học', dataIndex: 'title' },
                { title: 'Đơn hàng', dataIndex: 'orderCount' },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
