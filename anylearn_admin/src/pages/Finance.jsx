import { App, Card, Col, DatePicker, Row, Select, Space, Statistic, Table, Tag, Tabs, Typography } from 'antd'
import {
  BankOutlined, FundOutlined, RiseOutlined,
  TeamOutlined, WalletOutlined, ClockCircleOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import dayjs from 'dayjs'
import client from '../api/client'
import { fmtVND, fmtDateTime } from '../utils/format'

const BONUS_RATE = 1000

function KpiCard({ icon, title, value, suffix, sub, color = '#1677ff', loading }) {
  return (
    <Card loading={loading} style={{ borderTop: `3px solid ${color}` }}>
      <Statistic
        title={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{icon}{title}</span>}
        value={value}
        suffix={suffix}
        valueStyle={{ color, fontSize: 22 }}
        formatter={v => fmtVND(v)}
      />
      {sub && <Typography.Text type="secondary" style={{ fontSize: 12 }}>{sub}</Typography.Text>}
    </Card>
  )
}

// ── Tab 1: KPIs ───────────────────────────────────────────────────────────────
function KpiTab() {
  const { message } = App.useApp()
  const { data, isLoading } = useQuery({
    queryKey: ['admin-finance-summary'],
    queryFn: () => client.get('/admin/finance/summary').then(r => r.data?.data ?? r.data),
    onError: () => message.error('Không thể tải dữ liệu tài chính'),
    staleTime: 60_000,
  })
  const d = data ?? {}

  return (
    <div style={{ paddingTop: 16 }}>
      <Typography.Text strong style={{ display: 'block', marginBottom: 12, color: '#4a4f6b', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Nghĩa vụ thanh toán
      </Typography.Text>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          <KpiCard loading={isLoading} icon={<TeamOutlined />} color="#fa8c16"
            title="Nợ đối tác" value={d.partnerWalletC} suffix="pts"
            sub={`≈ ${fmtVND((d.partnerWalletC ?? 0) * BONUS_RATE)} VND — điểm trong ví partner chưa rút`}
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <KpiCard loading={isLoading} icon={<WalletOutlined />} color="#1677ff"
            title="Ví người dùng" value={d.userWalletC} suffix="pts"
            sub={`≈ ${fmtVND((d.userWalletC ?? 0) * BONUS_RATE)} VND — điểm tích lũy của buyer chưa dùng`}
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <KpiCard loading={isLoading} icon={<ClockCircleOutlined />} color="#722ed1"
            title="Chờ phê duyệt" value={d.pendingPoints} suffix="pts"
            sub={`≈ ${fmtVND((d.pendingPoints ?? 0) * BONUS_RATE)} VND — commission pending`}
          />
        </Col>
      </Row>

      <Typography.Text strong style={{ display: 'block', marginBottom: 12, color: '#4a4f6b', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Doanh thu & quỹ
      </Typography.Text>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          <KpiCard loading={isLoading} icon={<RiseOutlined />} color="#52c41a"
            title="Doanh thu ròng công ty" value={d.companyRevenueVnd} suffix="VND"
            sub="Phần hệ thống giữ lại sau khi phân phối hết điểm"
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <KpiCard loading={isLoading} icon={<BankOutlined />} color="#13c2c2"
            title="Quỹ vận hành" value={d.foundationPoints} suffix="pts"
            sub={`≈ ${fmtVND((d.foundationPoints ?? 0) * BONUS_RATE)} VND — tích lũy từ tất cả đơn hàng`}
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <KpiCard loading={isLoading} icon={<WalletOutlined />} color="#eb2f96"
            title="Tổng lưu thông" value={d.totalWalletC} suffix="pts"
            sub={`≈ ${fmtVND((d.totalWalletC ?? 0) * BONUS_RATE)} VND — tổng anyPoint toàn hệ thống`}
          />
        </Col>
      </Row>

      <Card size="small" style={{ background: '#f9f9f9', borderColor: '#e8e8e8' }}>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          <strong>Cách đọc:</strong> Giá bán = anyPoint đối tác + anyPoint buyer + referral + quỹ + doanh thu ròng công ty.
          Phần còn lại sau khi trừ hết điểm (tỉ giá {fmtVND(BONUS_RATE)} VND/pt) là doanh thu ròng.
          Nợ đối tác + ví buyer = khoản nợ của hệ thống.
        </Typography.Text>
      </Card>
    </div>
  )
}

// ── Tab 2: Revenue history ────────────────────────────────────────────────────
function RevenueTab() {
  const [dateRange, setDateRange] = useState([null, null])
  const [statusFilter, setStatusFilter] = useState(null)
  const [page, setPage] = useState(1)
  const pageSize = 20

  const from = dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : undefined
  const to   = dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : undefined

  const { data, isLoading } = useQuery({
    queryKey: ['admin-finance-revenue', from, to, statusFilter, page],
    queryFn: () => client.get('/admin/finance/revenue', {
      params: { from, to, ...(statusFilter != null && { status: statusFilter }), page: page - 1, size: pageSize },
    }).then(r => r.data?.data ?? r.data),
    staleTime: 30_000,
  })

  const columns = [
    {
      title: 'Đơn hàng', dataIndex: 'orderId', width: 100,
      render: v => <Typography.Text code>#{v}</Typography.Text>,
    },
    { title: 'Khóa học', dataIndex: 'itemTitle', ellipsis: true },
    {
      title: 'Giá bán', dataIndex: 'paidPrice', width: 130, align: 'right',
      render: v => `${fmtVND(v)}đ`,
    },
    {
      title: 'Doanh thu ròng', dataIndex: 'netRevenueVnd', width: 140, align: 'right',
      render: v => <Typography.Text strong style={{ color: '#52c41a' }}>{fmtVND(v)}đ</Typography.Text>,
    },
    {
      title: 'Trạng thái', dataIndex: 'status', width: 130,
      render: v => v === 1
        ? <Tag color="green">Đã xác nhận</Tag>
        : <Tag color="orange">Chưa xác nhận</Tag>,
    },
    {
      title: 'Thời gian', dataIndex: 'createdAt', width: 140,
      render: v => fmtDateTime(v),
    },
  ]

  return (
    <div style={{ paddingTop: 16 }}>
      <Space wrap style={{ marginBottom: 16 }}>
        <DatePicker.RangePicker
          format="DD/MM/YYYY" allowClear
          value={dateRange}
          onChange={v => { setDateRange(v ?? [null, null]); setPage(1) }}
          presets={[
            { label: '7 ngày qua',  value: [dayjs().subtract(6,  'day'), dayjs()] },
            { label: '30 ngày qua', value: [dayjs().subtract(29, 'day'), dayjs()] },
            { label: 'Tháng này',   value: [dayjs().startOf('month'), dayjs()] },
          ]}
        />
        <Select
          value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1) }}
          style={{ width: 160 }} allowClear placeholder="Tất cả trạng thái"
          options={[
            { value: 1, label: 'Đã xác nhận' },
            { value: 0, label: 'Chưa xác nhận' },
          ]}
        />
        {data?.total != null && (
          <Typography.Text type="secondary">
            {fmtVND(data.total)} giao dịch
          </Typography.Text>
        )}
      </Space>

      <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
        <Table
          size="small"
          columns={columns}
          dataSource={data?.content ?? []}
          rowKey="txId"
          loading={isLoading}
          scroll={{ x: 'max-content' }}
          pagination={{
            current: page,
            pageSize,
            total: data?.total,
            showSizeChanger: false,
            onChange: setPage,
            showTotal: (t, range) => `${fmtVND(range[0])}–${fmtVND(range[1])} / ${fmtVND(t)}`,
          }}
          summary={pageData => {
            const pageRevenue = pageData.reduce((s, r) => s + (r.netRevenueVnd ?? 0), 0)
            const pageSales   = pageData.reduce((s, r) => s + (r.paidPrice ?? 0), 0)
            return pageData.length > 0 ? (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={2}>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>Trang này</Typography.Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  <Typography.Text strong>{fmtVND(pageSales)}đ</Typography.Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  <Typography.Text strong style={{ color: '#52c41a' }}>{fmtVND(pageRevenue)}đ</Typography.Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} colSpan={2} />
              </Table.Summary.Row>
            ) : null
          }}
        />
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Finance() {
  return (
    <div style={{ padding: 24 }}>
      <div className="page-header">
        <div className="page-title">Tài chính</div>
        <span className="page-subtitle">Tổng quan dòng tiền, nghĩa vụ thanh toán và doanh thu ròng</span>
      </div>
      <div style={{ background: '#fff', borderRadius: 10, padding: '16px 24px', boxShadow: '0 2px 14px rgba(99,102,241,.07)' }}>
        <Tabs
          items={[
            { key: 'kpi',     label: 'Tổng quan', children: <KpiTab /> },
            { key: 'revenue', label: 'Dòng tiền',  children: <RevenueTab /> },
          ]}
        />
      </div>
    </div>
  )
}
