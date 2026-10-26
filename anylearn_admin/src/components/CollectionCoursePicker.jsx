import { Button, Checkbox, Collapse, Empty, Input, InputNumber, Select, Space, Table, Tag, Typography } from 'antd'
import { PlusOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import client from '../api/client'
import { fmtVND } from '../utils/format'

const PAGE_SIZE = 30

const PARTNER_TYPES = [
  { value: 'school', label: 'Trường học' }, { value: 'center', label: 'Trung tâm' }, { value: 'club', label: 'Câu lạc bộ' },
  { value: 'tutor', label: 'Gia sư' }, { value: 'expert', label: 'Chuyên gia' },
]
const TIME_SLOTS = [
  { value: 'weekday_morning', label: 'Sáng trong tuần' }, { value: 'weekday_afternoon', label: 'Chiều trong tuần' },
  { value: 'weekday_evening', label: 'Tối trong tuần' }, { value: 'weekend_morning', label: 'Sáng cuối tuần' },
  { value: 'weekend_afternoon', label: 'Chiều cuối tuần' }, { value: 'weekend_evening', label: 'Tối cuối tuần' },
]
const PROVINCES = [{ value: '79', label: 'TP.HCM' }, { value: '01', label: 'Hà Nội' }]
const FORMATS = [{ value: 'offline', label: 'Offline' }, { value: 'online', label: 'Online' }, { value: 'digital', label: 'Mã code' }]

const EMPTY_FILTERS = { ageFrom: null, ageTo: null, tag: [], partnerType: undefined, timeSlot: [], location: undefined, mode: undefined, priceMax: null, freeTrial: false, onSale: false }

function toParams(q, filters, page) {
  return {
    q: q || undefined, page, pageSize: PAGE_SIZE, sort: 'popular',
    ageFrom: filters.ageFrom ?? undefined, ageTo: filters.ageTo ?? undefined,
    tag: filters.tag, partnerType: filters.partnerType, timeSlot: filters.timeSlot, location: filters.location,
    mode: filters.mode, priceMax: filters.priceMax ?? undefined,
    freeTrial: filters.freeTrial || undefined, onSale: filters.onSale || undefined,
  }
}

// Finds courses for a collection: a keyword, and/or filters ("Gợi ý"), then tick the ones to add. Courses already in the
// collection are shown but cannot be ticked.
export default function CollectionCoursePicker({ addedIds, onAdd }) {
  const [q, setQ] = useState('')
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [submitted, setSubmitted] = useState(null)
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState([])

  const { data: tagData } = useQuery({
    queryKey: ['admin-tags-picker'],
    queryFn: () => client.get('/admin/tags').then(r => r.data?.data?.tags ?? []),
    staleTime: 5 * 60 * 1000,
  })
  const tagOptions = (tagData ?? []).filter(tag => tag.status === 1).map(tag => ({ value: tag.id, label: tag.name }))

  const { data, isFetching } = useQuery({
    queryKey: ['collection-course-search', submitted, page],
    queryFn: () => client.get('/admin/collections/course-search', {
      params: toParams(submitted.q, submitted.filters, page),
      paramsSerializer: { indexes: null },
    }).then(r => r.data?.data ?? { items: [], total: 0 }),
    enabled: submitted !== null,
  })

  const run = () => { setSelected([]); setPage(0); setSubmitted({ q, filters }) }
  const set = (patch) => setFilters(current => ({ ...current, ...patch }))
  const items = data?.items ?? []
  const addable = items.filter(item => !addedIds.includes(item.id))

  const addSelected = () => {
    onAdd(items.filter(item => selected.includes(item.id)))
    setSelected([])
  }

  const columns = [
    { title: 'Khóa học', key: 'title', render: (_, r) => (
      <Space>
        {r.image ? <img src={r.image} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6 }} /> : <div style={{ width: 44, height: 44, background: '#f0f0f0', borderRadius: 6 }} />}
        <div><div style={{ fontWeight: 500 }}>{r.title}</div><Typography.Text type="secondary" style={{ fontSize: 12 }}>{r.authorName}</Typography.Text></div>
      </Space>
    ) },
    { title: 'Giá', dataIndex: 'price', key: 'price', width: 110, align: 'right', render: fmtVND },
    { title: '', key: 'added', width: 90, render: (_, r) => addedIds.includes(r.id) ? <Tag color="green">Đã thêm</Tag> : null },
  ]

  return (
    <div>
      <Space.Compact style={{ width: '100%', marginBottom: 8 }}>
        <Input placeholder="Tìm khóa học theo tên, kỹ năng, đối tác..." value={q} onChange={e => setQ(e.target.value)} onPressEnter={run} allowClear />
        <Button type="primary" onClick={run}>Tìm</Button>
      </Space.Compact>

      <Collapse size="small" style={{ marginBottom: 12 }} items={[{
        key: 'filters',
        label: <span><ThunderboltOutlined /> Gợi ý theo bộ lọc</span>,
        children: (
          <Space direction="vertical" style={{ width: '100%' }} size={10}>
            <Space wrap>
              <span>Độ tuổi</span>
              <InputNumber min={0} max={30} placeholder="từ" value={filters.ageFrom} onChange={v => set({ ageFrom: v })} style={{ width: 70 }} />
              <span>đến</span>
              <InputNumber min={0} max={30} placeholder="đến" value={filters.ageTo} onChange={v => set({ ageTo: v })} style={{ width: 70 }} />
              <Select allowClear placeholder="Khu vực" style={{ width: 130 }} options={PROVINCES} value={filters.location} onChange={v => set({ location: v })} />
              <Select allowClear placeholder="Hình thức" style={{ width: 130 }} options={FORMATS} value={filters.mode} onChange={v => set({ mode: v })} />
              <Select allowClear placeholder="Loại đối tác" style={{ width: 150 }} options={PARTNER_TYPES} value={filters.partnerType} onChange={v => set({ partnerType: v })} />
            </Space>
            <Select mode="multiple" allowClear placeholder="Kỹ năng (tag)" style={{ width: '100%' }} options={tagOptions} optionFilterProp="label" value={filters.tag} onChange={v => set({ tag: v })} />
            <Select mode="multiple" allowClear placeholder="Khung giờ học" style={{ width: '100%' }} options={TIME_SLOTS} value={filters.timeSlot} onChange={v => set({ timeSlot: v })} />
            <Space wrap>
              <InputNumber min={0} step={500000} placeholder="Học phí tối đa" value={filters.priceMax} onChange={v => set({ priceMax: v })} style={{ width: 160 }} />
              <Checkbox checked={filters.freeTrial} onChange={e => set({ freeTrial: e.target.checked })}>Có học thử</Checkbox>
              <Checkbox checked={filters.onSale} onChange={e => set({ onSale: e.target.checked })}>Đang giảm giá</Checkbox>
              <Button onClick={() => setFilters(EMPTY_FILTERS)}>Xóa bộ lọc</Button>
              <Button type="primary" icon={<ThunderboltOutlined />} onClick={run}>Gợi ý</Button>
            </Space>
          </Space>
        ),
      }]} />

      {submitted === null ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nhập từ khóa hoặc bấm Gợi ý để xem các khóa học" />
      ) : (
        <>
          <Space style={{ marginBottom: 8 }}>
            <Button type="primary" icon={<PlusOutlined />} disabled={selected.length === 0} onClick={addSelected}>Thêm {selected.length || ''} khóa đã chọn</Button>
            <Button disabled={addable.length === 0} onClick={() => setSelected(addable.map(item => item.id))}>Chọn tất cả trang này ({addable.length})</Button>
            <Typography.Text type="secondary">{data?.total ?? 0} khóa phù hợp</Typography.Text>
          </Space>
          <Table
            size="small" rowKey="id" loading={isFetching} dataSource={items} columns={columns}
            rowSelection={{ selectedRowKeys: selected, onChange: setSelected, getCheckboxProps: r => ({ disabled: addedIds.includes(r.id) }) }}
            pagination={{ current: page + 1, pageSize: PAGE_SIZE, total: data?.total ?? 0, showSizeChanger: false, onChange: p => setPage(p - 1) }}
          />
        </>
      )}
    </div>
  )
}
