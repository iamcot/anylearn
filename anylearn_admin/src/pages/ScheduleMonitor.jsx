import { Button, Card, DatePicker, Dropdown, Input, Select, Space, Table, Tag, Tooltip, Typography } from 'antd'
import { CalendarOutlined, DownOutlined, SearchOutlined } from '@ant-design/icons'
import { useState, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import client from '../api/client'
import { fmtDateTime } from '../utils/format'

const { RangePicker } = DatePicker

const WD_VN = { mon:'T2', tue:'T3', wed:'T4', thu:'T5', fri:'T6', sat:'T7', sun:'CN' }
const SCHED_TYPE = { recurring:'Định kỳ', event:'Một buổi', open:'Linh hoạt', billing:'Học phí', '':'—' }
const SCHED_COLOR = { recurring:'blue', event:'purple', open:'orange', billing:'green', '':'default' }

function fmtWeekdays(wds) {
  if (!wds) return null
  return wds.split(',').map(w => WD_VN[w.trim()] ?? w.trim()).join(' · ')
}

function thisWeekRange() {
  const now = dayjs()
  const mon = now.startOf('week').add(1, 'day') // Monday
  return [mon, mon.add(6, 'day')]
}
function thisMonthRange() {
  const now = dayjs()
  return [now.startOf('month'), now.endOf('month')]
}

export default function ScheduleMonitor() {
  const today = dayjs()
  const [range, setRange] = useState(thisWeekRange())
  const [search, setSearch] = useState('')
  const [searchVal, setSearchVal] = useState('')
  const [partnerId, setPartnerId] = useState(null)
  const qc = useQueryClient()

  const fromStr = range[0].format('YYYY-MM-DD')
  const toStr   = range[1].format('YYYY-MM-DD')

  const { data: partners } = useQuery({
    queryKey: ['admin-partners'],
    queryFn: () => client.get('/admin/partners').then(r => r.data?.data ?? []),
    staleTime: 10 * 60_000,
  })

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['admin-schedule-monitor', fromStr, toStr, search, partnerId],
    queryFn: () => client.get('/admin/enrollments/schedule', {
      params: { from: fromStr, to: toStr, search: search || undefined, partnerId: partnerId || undefined },
    }).then(r => r.data?.data ?? []),
    enabled: !!fromStr && !!toStr,
  })

  const remindMutation = useMutation({
    mutationFn: (enrollmentId) => client.post(`/admin/enrollments/${enrollmentId}/remind`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-schedule-monitor'] }),
  })

  // Group events by date
  const grouped = useMemo(() => {
    const map = new Map()
    for (const ev of events) {
      if (!map.has(ev.date)) map.set(ev.date, [])
      map.get(ev.date).push(ev)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [events])

  const columns = [
    {
      title: 'Học sinh', key: 'student', width: 150,
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
          <div style={{ fontSize: 13, fontWeight: 500 }}>{r.itemTitle}</div>
          {r.partnerName && <div style={{ fontSize: 11, color: '#888' }}>{r.partnerName}</div>}
        </div>
      ),
    },
    {
      title: 'Loại lịch', key: 'type', width: 110,
      render: (_, r) => (
        <div>
          <Tag color={SCHED_COLOR[r.scheduleType] ?? 'default'} style={{ marginBottom: 2 }}>
            {SCHED_TYPE[r.scheduleType] ?? r.scheduleType}
          </Tag>
          {r.scheduleTitle && <div style={{ fontSize: 11, color: '#666' }}>{r.scheduleTitle}</div>}
        </div>
      ),
    },
    {
      title: 'Giờ học', key: 'time', width: 110,
      render: (_, r) => (
        <div style={{ fontSize: 12 }}>
          {r.timeStart ? `${r.timeStart}${r.timeEnd ? '–'+r.timeEnd : ''}` : '—'}
          {r.weekdays && <div style={{ color: '#888', fontSize: 11 }}>{fmtWeekdays(r.weekdays)}</div>}
        </div>
      ),
    },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 90,
      render: v => <Tag color={v === 'active' ? 'green' : 'orange'}>{v === 'active' ? 'Đang học' : 'Chờ KG'}</Tag>,
    },
    {
      title: 'Nhắc nhở', key: 'remind', width: 130,
      render: (_, r) => (
        <div>
          {r.remindSentAt
            ? <Tooltip title={`Lần cuối: ${fmtDateTime(r.remindSentAt)}`}>
                <Tag color="green">Đã gửi ×{r.remindCount}</Tag>
              </Tooltip>
            : <Tag color="default">Chưa gửi</Tag>
          }
        </div>
      ),
    },
    {
      title: '', key: 'actions', width: 60,
      render: (_, r) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'remind',
                label: 'Gửi nhắc nhở',
                onClick: () => remindMutation.mutate(r.enrollmentId),
              },
            ],
          }}
          trigger={['click']}
        >
          <Button size="small" icon={<DownOutlined />} />
        </Dropdown>
      ),
    },
  ]

  // Summary stats
  const totalEnrollments = new Set(events.map(e => e.enrollmentId)).size
  const pendingCount = events.filter(e => e.status === 'pending').length
  const notReminded = events.filter(e => !e.remindSentAt).length

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <CalendarOutlined style={{ fontSize: 20, color: '#1677ff' }} />
        <Typography.Title level={4} style={{ margin: 0 }}>Theo dõi lịch học</Typography.Title>
      </div>

      <Card styles={{ body: { padding: '16px 20px' } }}>
        {/* Filters */}
        <Space wrap style={{ marginBottom: 16 }}>
          {/* Quick range buttons */}
          <Space.Compact>
            <Button size="small" type={range[0].isSame(thisWeekRange()[0],'day') ? 'primary' : 'default'}
              onClick={() => setRange(thisWeekRange())}>Tuần này</Button>
            <Button size="small" onClick={() => setRange([dayjs().add(1,'week').startOf('week').add(1,'day'), dayjs().add(1,'week').startOf('week').add(7,'day')])}>
              Tuần tới</Button>
            <Button size="small" type={range[0].isSame(thisMonthRange()[0],'day') ? 'primary' : 'default'}
              onClick={() => setRange(thisMonthRange())}>Tháng này</Button>
            <Button size="small" onClick={() => setRange([dayjs().add(1,'month').startOf('month'), dayjs().add(1,'month').endOf('month')])}>
              Tháng tới</Button>
          </Space.Compact>
          <RangePicker
            value={range} onChange={v => v && setRange(v)}
            format="DD/MM/YYYY" size="small" allowClear={false}
          />
          <Input.Search
            placeholder="Tìm tên / SĐT học viên"
            allowClear style={{ width: 220 }} prefix={<SearchOutlined />}
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            onSearch={v => setSearch(v)}
            onClear={() => setSearch('')}
            size="small"
          />
          <Select allowClear placeholder="Đối tác / Trường" style={{ width: 200 }} value={partnerId}
            onChange={setPartnerId} showSearch optionFilterProp="label" size="small"
            options={(partners ?? []).map(p => ({ value: p.id, label: p.name || p.phone }))}
          />
        </Space>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12, color: '#666' }}>
            <strong style={{ color: '#111' }}>{totalEnrollments}</strong> học sinh đang học
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            <strong style={{ color: '#fa8c16' }}>{pendingCount}</strong> chờ chọn ngày khai giảng
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            <strong style={{ color: '#1677ff' }}>{notReminded}</strong> chưa được nhắc nhở
          </div>
        </div>

        {/* Tables grouped by date */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Đang tải...</div>
        ) : grouped.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>Không có lịch học nào trong khoảng thời gian này</div>
        ) : (
          grouped.map(([date, rows]) => {
            const d = dayjs(date)
            const isToday = d.isSame(today, 'day')
            const label = isToday
              ? `Hôm nay — ${d.format('dddd, DD/MM/YYYY')}`
              : d.format('dddd, DD/MM/YYYY')
            return (
              <div key={date} style={{ marginBottom: 24 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
                  padding: '6px 12px', borderRadius: 8,
                  background: isToday ? '#e6f4ff' : '#fafafa',
                  border: `1px solid ${isToday ? '#91caff' : '#e8e8e8'}`,
                }}>
                  <CalendarOutlined style={{ color: isToday ? '#1677ff' : '#888' }} />
                  <span style={{ fontWeight: 700, fontSize: 13, color: isToday ? '#1677ff' : '#555', textTransform: 'capitalize' }}>
                    {label}
                  </span>
                  <Tag style={{ marginLeft: 'auto' }}>{rows.length} lớp</Tag>
                </div>
                <Table
                  columns={columns}
                  dataSource={rows}
                  rowKey={(r, i) => `${r.enrollmentId}-${r.date}-${i}`}
                  size="small"
                  pagination={false}
                  style={{ marginLeft: 8 }}
                />
              </div>
            )
          })
        )}
      </Card>
    </div>
  )
}
