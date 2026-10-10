import { Badge, Card, Col, Row, Segmented, Table, Tooltip, Typography } from 'antd'
import { InfoCircleOutlined, BookOutlined, DollarOutlined, OrderedListOutlined, TeamOutlined, UserAddOutlined, RiseOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts'
import client from '../api/client'
import { fmtVND } from '../utils/format'

const PERIODS = [
  { label: 'Hôm nay',  key: 'today',   days: 0,   granularity: 'day',   sparkTarget: 0,   sparkGran: 'day'   },
  { label: 'Tuần',   key: 'week',    days: 7,   granularity: 'day',   sparkTarget: 7,   sparkGran: 'day'   },
  { label: 'Tháng',  key: 'month',   days: 30,  granularity: 'day',   sparkTarget: 10,  sparkGran: 'day'   },
  { label: 'Quý',    key: 'quarter', days: 90,  granularity: 'month', sparkTarget: 10,  sparkGran: 'day'   },
  { label: 'Năm',    key: 'year',    days: 365, granularity: 'month', sparkTarget: 12,  sparkGran: 'month' },
]

function toIso(d) { return d.toISOString().split('T')[0] }
function getDates(key) {
  const now = new Date(), to = toIso(now)
  const p = PERIODS.find(p => p.key === key) ?? PERIODS[2]
  if (p.days === 0) return { from: to, to }
  const d = new Date(now); d.setDate(d.getDate() - p.days)
  return { from: toIso(d), to }
}
const fmtM = (v) => {
  const m = (v ?? 0) / 1_000_000
  return m.toLocaleString('vi-VN', { maximumFractionDigits: 1 })
}
const fmtN = (v) => (v ?? 0).toLocaleString('vi-VN')

// Bucket raw daily/monthly data into exactly `target` evenly-spaced points.
// Points with no data become 0, so the line shows flat → spike.
function buildSparkPoints(rawData, dataKey, target) {
  if (!target || target === 0) return []          // 'today' → no chart
  const vals = (rawData ?? []).map(d => Number(d[dataKey]) || 0)

  if (vals.length === 0) {
    return Array(target).fill(0).map((_, i) => ({ i, [dataKey]: 0 }))
  }

  if (vals.length >= target) {
    // Bucket down: sum every (vals.length/target) raw points into 1 slot
    const size = vals.length / target
    return Array(target).fill(0).map((_, i) => {
      const slice = vals.slice(Math.floor(i * size), Math.floor((i + 1) * size))
      return { i, [dataKey]: slice.reduce((s, v) => s + v, 0) }
    })
  }

  // Fewer raw points than target → pad zeros at front
  const pad = Array(target - vals.length).fill(0).map((_, i) => ({ i: -i, [dataKey]: 0 }))
  return [...pad, ...vals.map((v, i) => ({ i, [dataKey]: v }))]
}

// Custom tooltip for charts
function ChartTip({ active, payload, label, fmt, unit = '' }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 8, padding: '8px 12px', boxShadow: '0 4px 12px rgba(0,0,0,.08)', fontSize: 12 }}>
      <div style={{ color: '#888', marginBottom: 4 }}>{fmt ? fmt(label) : label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color, fontWeight: 700 }}>
          {Number(p.value).toLocaleString('vi-VN')}{unit}
        </div>
      ))}
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <Typography.Text style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4a4f6b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10, marginTop: 8 }}>
      {children}
    </Typography.Text>
  )
}

function Spark({ points, dataKey, color }) {
  if (!points?.length) return <div style={{ height: 52 }} />

  const maxV    = Math.max(...points.map(p => Number(p[dataKey]) || 0))
  const hasData = maxV > 0
  // When no data: show flat line near bottom (floor tiny, large domain)
  // When has data: lift zeros so flat portion stays visible above baseline
  const floor = hasData ? maxV * 0.12 : 25
  const yMax  = hasData ? maxV + floor : 100
  const lifted = points.map(p => ({ ...p, [dataKey]: (Number(p[dataKey]) || 0) + floor }))

  const gradId = `g${color.replace(/[^a-z0-9]/gi, '')}`
  return (
    <ResponsiveContainer width="100%" height={52}>
      <AreaChart data={lifted} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.4} />
            <stop offset="95%" stopColor={color} stopOpacity={0.08} />
          </linearGradient>
        </defs>
        <YAxis domain={[0, yMax]} hide />
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5}
          fill={`url(#${gradId})`} dot={false} connectNulls />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function KpiCard({ title, icon, color, total, period, isMoney, sparkPoints, sparkKey, tooltip }) {
  const fmt = isMoney ? (v) => `${fmtM(v)} tr` : fmtN
  const raw = (total ?? 0) > 0 ? ((period ?? 0) / (total ?? 1)) * 100 : 0
  const pct = raw >= 1 ? Math.round(raw) : parseFloat(raw.toFixed(1))
  const showGrowth = (period ?? 0) > 0

  return (
    <Card style={{ height: '100%' }} styles={{ body: { padding: '14px 16px 10px' } }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1.2 }}>{fmt(period)}</span>
            {showGrowth && (
              <span style={{ fontSize: 12, fontWeight: 700, color: '#52c41a' }}>{pct}% ▲</span>
            )}
            <Tooltip title={tooltip ?? 'Tỉ lệ trên tổng'} placement="top">
              <InfoCircleOutlined style={{ fontSize: 11, color: '#bbb', cursor: 'help' }} />
            </Tooltip>
          </div>
          <div style={{ fontSize: 12, color: '#999', marginTop: 3 }}>
            Tổng: <strong style={{ color: '#555' }}>{fmt(total)}</strong>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, paddingTop: 2 }}>
          <span style={{ fontSize: 22, color, opacity: 0.85 }}>{icon}</span>
          <span style={{ fontSize: 11, color: '#999', whiteSpace: 'nowrap' }}>{title}</span>
        </div>
      </div>
      <Spark points={sparkPoints} dataKey={sparkKey} color={color} />
    </Card>
  )
}

export default function Dashboard() {
  const [period, setPeriod] = useState('month')
  const { from, to } = getDates(period)
  const pCfg    = PERIODS.find(p => p.key === period) ?? PERIODS[2]
  const gran    = pCfg.granularity   // main chart granularity
  const sGran   = pCfg.sparkGran     // sparkline granularity (may differ)
  const sTarget = pCfg.sparkTarget   // target data points for sparkline

  const q     = (key) => ({ queryKey: [key, from, to, gran], staleTime: 60_000 })
  const sq    = (key) => ({ queryKey: [key + '_s', from, to, sGran, sTarget], staleTime: 60_000 })
  const chart  = (path, g = gran) => client.get(`/admin/dashboard/${path}?from=${from}&to=${to}&granularity=${g}`).then(r => r.data?.data ?? [])

  const { data: stats }       = useQuery({ ...q('stats'), queryFn: () => client.get(`/admin/dashboard/stats?from=${from}&to=${to}`).then(r => r.data?.data) })
  const { data: finance }     = useQuery({ ...q('fin'),   queryFn: () => client.get('/admin/finance/summary').then(r => r.data?.data), staleTime: 60_000 })
  // Main charts (use gran)
  const { data: userChart }   = useQuery({ ...q('uc'),    queryFn: () => chart('chart/users') })
  const { data: gmvChart }    = useQuery({ ...q('gc'),    queryFn: () => chart('chart/gmv').then(rows => rows.map(r => ({ ...r, amount: Math.round(r.amount / 1_000_000) }))) })
  // Spark charts (use sGran — may be 'day' even for quarter)
  const { data: sUser }       = useQuery({ ...sq('su'),   queryFn: () => chart('chart/users', sGran),  enabled: sTarget > 0 })
  const { data: sItem }       = useQuery({ ...sq('si'),   queryFn: () => chart('chart/items', sGran),  enabled: sTarget > 0 })
  const { data: sOrder }      = useQuery({ ...sq('so'),   queryFn: () => chart('chart/orders', sGran), enabled: sTarget > 0 })
  const { data: sGmv }        = useQuery({ ...sq('sg'),   queryFn: () => chart('chart/gmv', sGran).then(rows => rows.map(r => ({ ...r, amount: Math.round(r.amount / 1_000_000) }))), enabled: sTarget > 0 })
  const { data: topPartners } = useQuery({ ...q('tp'),    queryFn: () => client.get(`/admin/dashboard/top-partners?from=${from}&to=${to}`).then(r => r.data?.data ?? []) })
  const { data: topItems }    = useQuery({ ...q('ti'),    queryFn: () => client.get(`/admin/dashboard/top-items?from=${from}&to=${to}`).then(r => r.data?.data ?? []) })

  const sp = (raw, key) => buildSparkPoints(raw, key, sTarget)

  // tickFmt: monthly → "T10", daily → "7" (day only, no leading zero)
  const tickFmt = (v) => {
    if (!v || v.startsWith('_')) return ''
    if (gran === 'month') return `T${parseInt(v.slice(5, 7))}`
    return String(parseInt(v.slice(8, 10)))  // "10-07" or "2026-10-07" → "7"
  }

  // x-axis interval: show every tick for short periods, thin out for 30-day
  const xInterval = period === 'month' ? 4 : 0

  // Fill full date range. Monthly: always 12 complete months ending this month.
  // Daily: exact days from→to including today.
  function fillChart(rawData, dataKey, granularity) {
    const map = {}
    ;(rawData ?? []).forEach(d => { map[d.date] = d })
    const slots = []
    const now = new Date()

    if (granularity === 'month') {
      const months = period === 'quarter' ? 3 : 12
      for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        slots.push(map[key] ?? { date: key, [dataKey]: 0 })
      }
    } else {
      // Daily slots: from → today (inclusive)
      const end = new Date(now.toISOString().slice(0, 10))
      for (const d = new Date(from); d <= end; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().slice(0, 10)
        slots.push(map[key] ?? { date: key, [dataKey]: 0 })
      }
    }
    return slots
  }

  const userFull = fillChart(userChart, 'count', gran)
  const gmvFull  = fillChart(gmvChart, 'amount', gran)

  const row1 = [
    { title: 'Thành viên',      icon: <TeamOutlined />,        color: '#1677ff', total: stats?.totalUsers,          period: stats?.newUsers,            isMoney: false, sparkPoints: sp(sUser,  'count'),  sparkKey: 'count',  tooltip: '% user mới trong kỳ / tổng user'     },
    { title: 'Đối tác',   icon: <UserAddOutlined />,     color: '#722ed1', total: stats?.totalPartners,       period: stats?.newPartners,          isMoney: false, sparkPoints: sp(sUser,  'count'),  sparkKey: 'count',  tooltip: '% đối tác mới trong kỳ / tổng'        },
    { title: 'Khóa học',  icon: <BookOutlined />,        color: '#13c2c2', total: stats?.totalItems,          period: stats?.newItems,             isMoney: false, sparkPoints: sp(sItem,  'count'),  sparkKey: 'count',  tooltip: '% khóa học mới trong kỳ / tổng'       },
  ]
  const row2 = [
    { title: 'Đơn hàng',  icon: <OrderedListOutlined />, color: '#fa8c16', total: stats?.totalOrders,         period: stats?.newOrders,            isMoney: false, sparkPoints: sp(sOrder, 'count'),  sparkKey: 'count',  tooltip: '% đơn hàng mới trong kỳ / tổng'       },
    { title: 'Doanh thu', icon: <DollarOutlined />,      color: '#52c41a', total: stats?.totalRevenue,        period: stats?.periodRevenue,        isMoney: true,  sparkPoints: sp(sGmv,   'amount'), sparkKey: 'amount', tooltip: '% doanh thu kỳ này / tổng'             },
    { title: 'Lợi nhuận', icon: <RiseOutlined />,        color: '#eb2f96', total: finance?.companyRevenueVnd, period: finance?.companyRevenueVnd,  isMoney: true,  sparkPoints: sp(sGmv,   'amount'), sparkKey: 'amount', tooltip: 'Doanh thu ròng tích lũy của công ty'  },
  ]

  const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <div style={{ padding: 24 }}>

      {/* ── Header ────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <Typography.Title level={4} style={{ margin: 0, color: '#1e2047' }}>Tổng quan</Typography.Title>
          <Typography.Text style={{ fontSize: 12, color: '#5a5f7d' }}>{today}</Typography.Text>
        </div>
        <Segmented value={period} onChange={setPeriod} options={PERIODS.map(p => ({ label: p.label, value: p.key }))} />
      </div>

      {/* ── KPI row 1 ─────────────────────────── */}
      <SectionLabel>Thành viên & nội dung</SectionLabel>
      <Row gutter={[16, 16]} align="stretch" style={{ marginBottom: 16 }}>
        {row1.map(kpi => <Col key={kpi.title} xs={24} sm={8}><KpiCard {...kpi} /></Col>)}
      </Row>

      {/* ── KPI row 2 ─────────────────────────── */}
      <SectionLabel>Kinh doanh</SectionLabel>
      <Row gutter={[16, 16]} align="stretch" style={{ marginBottom: 24 }}>
        {row2.map(kpi => <Col key={kpi.title} xs={24} sm={8}><KpiCard {...kpi} /></Col>)}
      </Row>

      {/* ── Charts ────────────────────────────── */}
      <SectionLabel>Tăng trưởng</SectionLabel>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            title="Tăng trưởng user"
            extra={stats?.newUsers ? <Typography.Text style={{ fontSize: 12, color: '#1677ff', fontWeight: 700 }}>{fmtN(stats.newUsers)} user mới</Typography.Text> : null}
            styles={{ body: { padding: '8px 0 0' } }}
          >
            <div style={{ position: 'relative' }}>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={userFull} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradUser" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#1677ff" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#1677ff" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#aaa' }} tickLine={false} axisLine={false} tickFormatter={tickFmt} interval={xInterval} />
                  <YAxis tick={{ fontSize: 11, fill: '#aaa' }} tickLine={false} axisLine={false} width={32} />
                  <RTooltip content={<ChartTip fmt={tickFmt} />} cursor={{ stroke: '#1677ff', strokeWidth: 1, strokeDasharray: '4 2' }} />
                  <Area type="monotone" dataKey="count" stroke="#1677ff" strokeWidth={2.5} fill="url(#gradUser)" name="User mới" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
              {!userChart?.length && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <span style={{ color: '#ccc', fontSize: 13 }}>Chưa có dữ liệu trong kỳ</span>
                </div>
              )}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="Doanh thu (triệu đồng)"
            extra={stats?.periodRevenue ? <Typography.Text style={{ fontSize: 12, color: '#52c41a', fontWeight: 700 }}>{fmtM(stats.periodRevenue)} tr GMV</Typography.Text> : null}
            styles={{ body: { padding: '8px 0 0' } }}
          >
            <div style={{ position: 'relative' }}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={gmvFull} margin={{ top: 8, right: 16, left: 0, bottom: 0 }} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="2 4" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#aaa' }} tickLine={false} axisLine={false} tickFormatter={tickFmt} interval={xInterval} />
                  <YAxis tick={{ fontSize: 11, fill: '#aaa' }} tickLine={false} axisLine={false} width={32} />
                  <RTooltip content={<ChartTip fmt={tickFmt} unit=" tr" />} cursor={{ fill: 'rgba(82,196,26,0.06)' }} />
                  <Bar dataKey="amount" fill="#52c41a" radius={[3, 3, 0, 0]} name="GMV" />
                </BarChart>
              </ResponsiveContainer>
              {!gmvChart?.length && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <span style={{ color: '#ccc', fontSize: 13 }}>Chưa có dữ liệu trong kỳ</span>
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* ── Leaderboards ──────────────────────── */}
      <SectionLabel>Top hiệu suất</SectionLabel>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Top đối tác">
            {(topPartners ?? []).map((p, i) => (
              <div key={p.userId} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: i < (topPartners.length - 1) ? '1px solid #f5f5f5' : 'none', gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: i < 3 ? ['#faad14','#aaa','#d46b08'][i] : '#ccc', width: 18, textAlign: 'center' }}>{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name || p.phone}</div>
                  <div style={{ fontSize: 11, color: '#aaa' }}>{p.orderCount} đơn</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#52c41a', flexShrink: 0 }}>{fmtM(p.revenue)} tr</div>
              </div>
            ))}
            {!topPartners?.length && <Typography.Text type="secondary" style={{ fontSize: 12 }}>Chưa có dữ liệu</Typography.Text>}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Top khóa học">
            {(topItems ?? []).map((item, i) => (
              <div key={item.itemId} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: i < (topItems.length - 1) ? '1px solid #f5f5f5' : 'none', gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: i < 3 ? ['#faad14','#aaa','#d46b08'][i] : '#ccc', width: 18, textAlign: 'center' }}>{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                  {item.ownerName && <div style={{ fontSize: 11, color: '#aaa' }}>{item.ownerName}</div>}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1677ff', flexShrink: 0 }}>{item.orderCount} đơn</div>
              </div>
            ))}
            {!topItems?.length && <Typography.Text type="secondary" style={{ fontSize: 12 }}>Chưa có dữ liệu</Typography.Text>}
          </Card>
        </Col>
      </Row>
    </div>
  )
}
