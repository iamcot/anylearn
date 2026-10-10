import { App, Button, Drawer, Input, Popconfirm, Select, Space, Table, Tag, Typography } from 'antd'
import { RightOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import { fmtVND, fmtDate, fmtDateTime } from '../utils/format'
import { Field } from '../components/Field'

const STATUS = { 0: ['Chờ duyệt', 'orange'], 1: ['Đã duyệt', 'green'], 99: ['Từ chối', 'red'], '-1': ['Từ chối', 'red'] }
const statusTag = (v) => { const [label, color] = STATUS[String(v)] ?? ['?', 'default']; return <Tag color={color}>{label}</Tag> }

export default function Transactions() {
  const { message } = App.useApp()
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [phone, setPhone] = useState('')
  const [partnerId, setPartnerId] = useState('')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)
  const [selectedKeys, setSelectedKeys] = useState([])
  const [drawerTxn, setDrawerTxn] = useState(null)

  const { data: partners } = useQuery({
    queryKey: ['admin-partners'],
    queryFn: () => client.get('/admin/partners').then(r => r.data?.data ?? []),
    staleTime: 5 * 60_000,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-txns', statusFilter, typeFilter, phone, partnerId, sortDir, page],
    queryFn: () => client.get('/admin/transactions', {
      params: {
        ...(statusFilter !== '' && { status: statusFilter }),
        ...(typeFilter && { type: typeFilter }),
        ...(phone && { phone }),
        ...(partnerId && { userId: partnerId }),
        sortDir,
        page: page - 1, size: 20,
      }
    }).then(r => r.data?.data ?? r.data),
  })

  const approve = useMutation({
    mutationFn: (ids) => client.post('/admin/transactions/approve', { ids }),
    onSuccess: () => { qc.invalidateQueries(['admin-txns']); setSelectedKeys([]); message.success('Đã duyệt') },
  })

  const reject = useMutation({
    mutationFn: (ids) => client.post('/admin/transactions/reject', { ids }),
    onSuccess: () => { qc.invalidateQueries(['admin-txns']); setSelectedKeys([]); message.success('Đã từ chối') },
  })

const VND_TYPES = new Set(['order', 'net_revenue', 'deposit', 'withdraw'])
const unitOf = (type) => VND_TYPES.has(type) ? 'VND' : 'anyPoint'

  const columns = [
    {
      title: () => (
        <span onClick={() => { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); setPage(1) }}
          style={{ cursor: 'pointer', userSelect: 'none' }}>
          ID <span style={{ color: '#1677ff', fontSize: 10 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
        </span>
      ),
      dataIndex: 'id', width: 70,
    },
    {
      title: 'Người dùng', dataIndex: 'userName',
      render: (v, row) => v || <span style={{ color: '#bbb' }}>ID {row.userId}</span>,
    },
    { title: 'Loại', dataIndex: 'type' },
    {
      title: 'Giá trị', dataIndex: 'amount', align: 'right',
      render: (v) => fmtVND(v),
    },
    {
      title: 'Đơn vị', dataIndex: 'type', width: 90,
      render: (type) => <span style={{ fontSize: 11, color: '#888' }}>{unitOf(type)}</span>,
    },
    { title: 'Trạng thái', dataIndex: 'status', render: statusTag },
    { title: 'Ngày tạo', dataIndex: 'createdAt', render: v => fmtDateTime(v) },
    { dataIndex: 'id', width: 36, align: 'center', render: () => <RightOutlined style={{ color: '#bbb', fontSize: 11 }} /> },
  ]

  const rowSelection = { selectedRowKeys: selectedKeys, onChange: setSelectedKeys }

  return (
    <div style={{ padding: 24 }}>
      <div className="page-header">
        <div className="page-title">Giao dịch anyPoint</div>
        <span className="page-subtitle">Duyệt và quản lý giao dịch điểm</span>
      </div>
      <div className="page-content">
      <Space style={{ marginBottom: 16, flexWrap: 'wrap', width: '100%', justifyContent: 'space-between' }}>
        <Space wrap>
          <Select value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1) }} style={{ width: 150 }}
            options={[{ value: '', label: 'Tất cả trạng thái' }, { value: '0', label: 'Chờ duyệt' }, { value: '1', label: 'Đã duyệt' }, { value: '-1', label: 'Từ chối' }]}
          />
          <Select value={typeFilter} onChange={v => { setTypeFilter(v); setPage(1) }} style={{ width: 160 }}
            options={[
              { value: '', label: 'Tất cả loại' },
              { value: 'deposit', label: 'deposit' },
              { value: 'withdraw', label: 'withdraw' },
              { value: 'partner', label: 'partner' },
              { value: 'commission', label: 'commission' },
              { value: 'commission_add', label: 'commission_add' },
              { value: 'exchange', label: 'exchange' },
              { value: 'exchange_refund', label: 'exchange_refund' },
              { value: 'order', label: 'order' },
              { value: 'net_revenue', label: 'net_revenue' },
              { value: 'foundation', label: 'foundation' },
            ]}
          />
          <Select
            value={partnerId || undefined}
            onChange={v => {
              const val = v ?? ''
              setPartnerId(val)
              setTypeFilter(val ? 'partner' : '')
              setPage(1)
            }}
            style={{ width: 180 }} showSearch optionFilterProp="label" allowClear
            placeholder="Tất cả đối tác"
            options={(partners ?? []).map(p => ({ value: String(p.id), label: p.name || p.phone }))}
          />
          <Input.Search
            placeholder="SĐT người dùng"
            value={phone}
            onChange={e => { setPhone(e.target.value); setPage(1) }}
            onSearch={() => {}}
            allowClear
            style={{ width: 180 }}
          />
        </Space>
        <Space>
          {data?.total != null && <Typography.Text type="secondary">{data.total.toLocaleString('vi-VN')} giao dịch</Typography.Text>}
          {selectedKeys.length > 0 && (
            <>
              <Popconfirm title={`Duyệt ${selectedKeys.length} giao dịch?`} onConfirm={() => approve.mutate(selectedKeys)}>
                <Button type="primary" loading={approve.isPending}>Duyệt ({selectedKeys.length})</Button>
              </Popconfirm>
              <Popconfirm title={`Từ chối ${selectedKeys.length} giao dịch?`} onConfirm={() => reject.mutate(selectedKeys)} okButtonProps={{ danger: true }}>
                <Button danger loading={reject.isPending}>Từ chối ({selectedKeys.length})</Button>
              </Popconfirm>
            </>
          )}
        </Space>
      </Space>
      <Table
        columns={columns} dataSource={data?.content ?? []} rowKey="id" loading={isLoading} size="small"
        rowSelection={rowSelection}
        scroll={{ x: 'max-content' }}
        pagination={{
          current: page, pageSize: 20, total: data?.total,
          showSizeChanger: false, onChange: setPage,
          showTotal: (t, range) => `${range[0]}–${range[1]} / ${t}`,
        }}
        onChange={(_, __, sorter) => {
          setPage(1)
        }}
        onRow={row => ({ onClick: () => setDrawerTxn(row), style: { cursor: 'pointer' } })}
      />
      </div>
      <Drawer title={`Giao dịch #${drawerTxn?.id}`} open={!!drawerTxn} onClose={() => setDrawerTxn(null)} size="large">
        <Field label="Loại" viewValue={drawerTxn?.type} />
        <Field label="Giá trị" viewValue={`${Number(drawerTxn?.amount ?? 0).toLocaleString()} ${unitOf(drawerTxn?.type)}`} />
        <Field label="Trạng thái" viewValue={statusTag(drawerTxn?.status)} />
        <Field label="Thông tin TT" viewValue={<pre style={{ margin: 0, fontSize: 12, whiteSpace: 'pre-wrap' }}>{drawerTxn?.payInfo}</pre>} />
        <Field label="Nội dung" viewValue={drawerTxn?.content} />
        {drawerTxn?.orderId && <Field label="Đơn hàng #" viewValue={drawerTxn.orderId} />}
        <Field label="Người dùng" viewValue={drawerTxn?.userName} />
        <Field label="Ngày tạo" viewValue={fmtDateTime(drawerTxn?.createdAt)} />
      </Drawer>
    </div>
  )
}
