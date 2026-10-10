import { App, Input, Select, Space, Switch, Table, Tag, Tooltip, Typography } from 'antd'
import { FireOutlined, PlusOutlined, RightOutlined } from '@ant-design/icons'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import client from '../api/client'
import { fmtVND } from '../utils/format'

export default function Items() {
  const { message } = App.useApp()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const q          = searchParams.get('q') ?? ''
  const status     = searchParams.get('status') ?? ''
  const userStatus = searchParams.get('userStatus') ?? ''
  const categoryId = searchParams.get('categoryId') ?? ''
  const partnerId  = searchParams.get('partnerId') ?? ''
  const page       = Number(searchParams.get('page') ?? '1')
  const sortDir    = searchParams.get('sortDir') ?? 'desc'

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value); else next.delete(key)
    next.set('page', '1')
    if (key !== 'sortDir') next.delete('sortDir')
    setSearchParams(next)
  }
  function setPage(p) {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(p))
    setSearchParams(next)
  }

  const { data, isLoading } = useQuery({
    queryKey: ['admin-items', q, status, userStatus, categoryId, partnerId, page, sortDir],
    queryFn: () => client.get('/admin/items', {
      params: { q, ...(status !== '' && { status }), ...(userStatus !== '' && { userStatus }), ...(categoryId && { categoryId }), ...(partnerId && { userId: partnerId }), page: page - 1, size: 20, sortDir }
    }).then(r => r.data?.data ?? r.data),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  })

  const { data: categories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => client.get('/admin/categories').then(r => r.data?.data ?? []),
    staleTime: 5 * 60_000,
  })

  const { data: partners } = useQuery({
    queryKey: ['admin-partners'],
    queryFn: () => client.get('/admin/partners').then(r => r.data?.data ?? []),
    staleTime: 5 * 60_000,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, field, value }) => client.put(`/admin/items/${id}`, { [field]: value ? 1 : 0 }),
    onSuccess: () => qc.invalidateQueries(['admin-items']),
    onError: () => message.error('Cập nhật thất bại'),
  })

  const hotMutation = useMutation({
    mutationFn: (id) => client.put(`/admin/items/${id}/toggle-hot`),
    onSuccess: () => qc.invalidateQueries(['admin-items']),
  })

  const columns = [
    {
      key: 'sortById',
      title: () => (
        <span onClick={() => updateParam('sortDir', sortDir === 'asc' ? 'desc' : 'asc')}
          style={{ cursor: 'pointer', userSelect: 'none' }}>
          ID <span style={{ color: '#1677ff', fontSize: 10 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
        </span>
      ),
      dataIndex: 'id', width: 70,
    },
    {
      title: <Tooltip title="Nổi bật"><FireOutlined /></Tooltip>,
      dataIndex: 'isHot', width: 55,
      render: (v, row) => (
        <Switch
          size="small" checked={v == 1}
          onChange={() => hotMutation.mutate(row.id)}
          onClick={(_, e) => e?.stopPropagation()}
        />
      ),
    },
    {
      title: 'Platform', dataIndex: 'status', width: 100,
      render: (v, row) => (
        <Switch
          size="small" checked={v == 1}
          checkedChildren="Hiện" unCheckedChildren="Ẩn"
          loading={statusMutation.isPending}
          onChange={val => { statusMutation.mutate({ id: row.id, field: 'status', value: val }); row.status = val ? 1 : 0 }}
          onClick={(_, e) => e?.stopPropagation()}
        />
      ),
    },
    {
      title: 'Đối tác duyệt', dataIndex: 'userStatus', width: 120,
      render: (v, row) => (
        <Switch
          size="small" checked={v == 1}
          checkedChildren="Duyệt" unCheckedChildren="Chờ"
          loading={statusMutation.isPending}
          onChange={val => { statusMutation.mutate({ id: row.id, field: 'userStatus', value: val }); row.userStatus = val ? 1 : 0 }}
          onClick={(_, e) => e?.stopPropagation()}
        />
      ),
    },
    {
      title: 'Tiêu đề', dataIndex: 'title', ellipsis: true,
      render: (text, row) => (
        <Typography.Text onClick={() => navigate(`/items/${row.id}`)} style={{ cursor: 'pointer' }}>{text}</Typography.Text>
      ),
    },
    { title: 'Đối tác', dataIndex: 'ownerName' },
    { title: 'Học phí', dataIndex: 'price', width: 120, render: v => fmtVND(v) },
    { title: 'Đã bán', dataIndex: 'soldCount', width: 75 },
    { title: 'Ngày bắt đầu', dataIndex: 'dateStart', width: 115 },
    {
      dataIndex: 'id', width: 36, align: 'center',
      render: () => <RightOutlined style={{ color: '#bbb', fontSize: 11 }} />,
    },
  ]

  const total = data?.total

  return (
    <div style={{ padding: 24 }}>
      <div className="page-header">
        <div className="page-title">Khóa học</div>
        <span className="page-subtitle">Quản lý danh sách khóa học của các đối tác</span>
      </div>
      <div className="page-content">
      <Space style={{ marginBottom: 16, flexWrap: 'wrap', width: '100%', justifyContent: 'space-between' }}>
        <Space wrap>
          <Input.Search
            placeholder="Tìm tiêu đề khóa học" value={q}
            onChange={e => updateParam('q', e.target.value)}
            onSearch={() => {}} allowClear style={{ width: 240 }}
          />
          <Select value={partnerId || undefined} onChange={v => updateParam('partnerId', v ?? '')}
            style={{ width: 180 }} showSearch optionFilterProp="label" allowClear
            placeholder="Tất cả đối tác"
            options={(partners ?? []).map(p => ({ value: String(p.id), label: p.name || p.phone }))}
          />
          <Select value={status} onChange={v => updateParam('status', v)} style={{ width: 140 }}
            options={[{ value: '', label: 'Tất cả trạng thái' }, { value: '1', label: 'Hiển thị' }, { value: '0', label: 'Ẩn' }]}
          />
          <Select value={userStatus} onChange={v => updateParam('userStatus', v)} style={{ width: 150 }}
            options={[{ value: '', label: 'Tất cả duyệt' }, { value: '1', label: 'Đã duyệt' }, { value: '0', label: 'Chờ duyệt' }]}
          />
          <Select value={categoryId} onChange={v => updateParam('categoryId', v)}
            style={{ width: 160 }} showSearch optionFilterProp="label"
            options={[{ value: '', label: 'Tất cả lĩnh vực' }, ...(categories ?? []).map(c => ({ value: String(c.id), label: c.title }))]}
          />
        </Space>
        <Space>
          {total != null && <Typography.Text type="secondary">{fmtVND(total)} khóa học</Typography.Text>}
          <a href="/items/new" onClick={e => { e.preventDefault(); navigate('/items/new') }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: '#1677ff', color: '#fff', borderRadius: 6, fontSize: 14 }}>
            <PlusOutlined /> Tạo khóa học
          </a>
        </Space>
      </Space>

      <Table
          columns={columns}
          dataSource={data?.content ?? []}
          rowKey="id"
          loading={isLoading}
          size="small"
          scroll={{ x: 'max-content' }}
          onChange={() => {
          }}
          pagination={{
            current: page,
            pageSize: 20,
            total: total,
            showSizeChanger: false,
            onChange: setPage,
            showTotal: (t, range) => `${fmtVND(range[0])}–${fmtVND(range[1])} / ${fmtVND(t)}`,
          }}
          onRow={row => ({ onClick: () => navigate(`/items/${row.id}`), style: { cursor: 'pointer' } })}
        />
      </div>
    </div>
  )
}
