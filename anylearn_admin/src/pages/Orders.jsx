import { App, Button, Drawer, Input, Popconfirm, Select, Space, Table, Tag, Typography } from 'antd'
import { RightOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import { fmtVND, fmtDate, fmtDateTime } from '../utils/format'
import { Field } from '../components/Field'

const STATUS_MAP = {
  new:           ['Mới',            'default'],
  pay_pending:   ['Chờ thanh toán', 'orange'],
  delivered:     ['Hoàn thành',     'green'],
  cancel_buyer:  ['Đã hủy',         'red'],
  cancel_seller: ['Đã hủy',         'red'],
  cancel_system: ['Đã hủy',         'red'],
  refund:        ['Hoàn tiền',      'blue'],
}
const statusTag = (v) => {
  const [label, color] = STATUS_MAP[v] ?? [v, 'default']
  return <Tag color={color}>{label}</Tag>
}

export default function Orders() {
  const { message } = App.useApp()
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [payment, setPayment] = useState('')
  const [partnerId, setPartnerId] = useState('')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)
  const [selectedKeys, setSelectedKeys] = useState([])
  const [drawerOrder, setDrawerOrder] = useState(null)

  const { data: partners } = useQuery({
    queryKey: ['admin-partners'],
    queryFn: () => client.get('/admin/partners').then(r => r.data?.data ?? []),
    staleTime: 5 * 60_000,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', q, status, payment, partnerId, sortDir, page],
    queryFn: () => client.get('/admin/orders', {
      params: {
        q,
        ...(status && { status }),
        ...(payment && { payment }),
        ...(partnerId && { partnerId }),
        sortDir,
        page: page - 1,
        size: 20,
      }
    }).then(r => r.data?.data ?? r.data),
  })

  const { data: orderDetail } = useQuery({
    queryKey: ['admin-order', drawerOrder?.id],
    queryFn: () => client.get(`/admin/orders/${drawerOrder.id}`).then(r => r.data?.data),
    enabled: !!drawerOrder,
  })

  const confirm = useMutation({
    mutationFn: (ids) => client.post('/admin/orders/confirm', { ids }),
    onSuccess: () => { qc.invalidateQueries(['admin-orders']); setSelectedKeys([]); message.success('Đã xác nhận') },
  })

  const cancel = useMutation({
    mutationFn: (ids) => client.post('/admin/orders/cancel', { ids }),
    onSuccess: () => { qc.invalidateQueries(['admin-orders']); setSelectedKeys([]); message.success('Đã huỷ') },
  })

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
    { title: 'Người mua', dataIndex: 'buyerName' },
    { title: 'SĐT', dataIndex: 'buyerPhone' },
    { title: 'Số tiền', dataIndex: 'amount', render: v => fmtVND(v) },
    { title: 'Thanh toán', dataIndex: 'payment' },
    {
      title: 'Đối tác', dataIndex: 'partnerNames', ellipsis: true,
      render: (names, row) => {
        if (!names) return null
        const nameArr = String(names).split(', ')
        const idArr = row.partnerIds ? String(row.partnerIds).split(',') : []
        return (
          <Space size={4} wrap>
            {nameArr.map((n, i) => (
              <Tag key={i} style={{ cursor: 'pointer' }}
                onClick={e => { e.stopPropagation(); setPartnerId(idArr[i] || ''); setPage(1) }}>
                {n}
              </Tag>
            ))}
          </Space>
        )
      }
    },
    { title: 'Trạng thái', dataIndex: 'status', render: statusTag },
    { title: 'Ngày đặt', dataIndex: 'createdAt', render: v => fmtDateTime(v) },
    { dataIndex: 'id', width: 36, align: 'center', render: () => <RightOutlined style={{ color: '#bbb', fontSize: 11 }} /> },
  ]

  const rowSelection = { selectedRowKeys: selectedKeys, onChange: setSelectedKeys }

  return (
    <div style={{ padding: 24 }}>
      <div className="page-header">
        <div className="page-title">Đơn hàng</div>
        <span className="page-subtitle">Quản lý và duyệt đơn hàng</span>
      </div>
      <div className="page-content">
      <Space style={{ marginBottom: 16, flexWrap: 'wrap', width: '100%', justifyContent: 'space-between' }}>
        <Space wrap>
          <Input.Search placeholder="Tìm người mua" value={q} onChange={e => { setQ(e.target.value); setPage(1) }} onSearch={() => {}} allowClear style={{ width: 200 }} />
          <Select value={status} onChange={v => { setStatus(v); setPage(1) }} style={{ width: 150 }}
            options={[{ value: '', label: 'Tất cả trạng thái' }, { value: 'new', label: 'Mới' }, { value: 'pay_pending', label: 'Chờ thanh toán' }, { value: 'delivered', label: 'Hoàn thành' }, { value: 'cancel_buyer', label: 'Đã hủy' }]}
          />
          <Select value={payment} onChange={v => { setPayment(v); setPage(1) }} style={{ width: 150 }}
            options={[{ value: '', label: 'Tất cả PTTT' }, { value: 'bank_transfer', label: 'bank_transfer' }, { value: 'vnpay', label: 'vnpay' }, { value: 'momo', label: 'momo' }]}
          />
          <Select value={partnerId || undefined} onChange={v => { setPartnerId(v ?? ''); setPage(1) }}
            style={{ width: 180 }} showSearch optionFilterProp="label" allowClear
            placeholder="Tất cả đối tác"
            options={(partners ?? []).map(p => ({ value: String(p.id), label: p.name || p.phone }))}
          />
        </Space>
        <Space>
          {data?.total != null && <Typography.Text type="secondary">{data.total.toLocaleString('vi-VN')} đơn hàng</Typography.Text>}
          {selectedKeys.length > 0 && (
            <>
              <Popconfirm title={`Xác nhận ${selectedKeys.length} đơn?`} onConfirm={() => confirm.mutate(selectedKeys)}>
                <Button type="primary" loading={confirm.isPending}>Xác nhận ({selectedKeys.length})</Button>
              </Popconfirm>
              <Popconfirm title={`Huỷ ${selectedKeys.length} đơn?`} onConfirm={() => cancel.mutate(selectedKeys)} okButtonProps={{ danger: true }}>
                <Button danger loading={cancel.isPending}>Huỷ đơn ({selectedKeys.length})</Button>
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
        onRow={row => ({ onClick: () => setDrawerOrder(row), style: { cursor: 'pointer' } })}
      />
      </div>
      <Drawer title={`Đơn hàng #${drawerOrder?.id}`} open={!!drawerOrder} onClose={() => setDrawerOrder(null)} size="large">
        <Field label="Người mua" viewValue={orderDetail?.order?.deliveryName || drawerOrder?.buyerName} />
        <Field label="SĐT" viewValue={drawerOrder?.buyerPhone} />
        <Field label="Thanh toán" viewValue={drawerOrder?.payment} />
        <Field label="Tổng tiền" viewValue={`${Number(drawerOrder?.amount ?? 0).toLocaleString()}đ`} />
        <Field label="Trạng thái" viewValue={statusTag(drawerOrder?.status)} />
        <Field label="Ngày đặt" viewValue={fmtDateTime(drawerOrder?.createdAt)} />
        {orderDetail?.items?.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Sản phẩm</div>
            {orderDetail?.items?.map(item => (
              <div key={item.id} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, fontSize: 13 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500 }}>{item.title}</div>
                  {item.studentName && (
                    <div style={{ color: '#1677ff', fontSize: 12 }}>
                      Học sinh: {item.studentName}{item.isChild ? ' (tài khoản con)' : ''}
                    </div>
                  )}
                  {item.ownerName && <div style={{ color: '#888', fontSize: 12 }}>Đối tác: {item.ownerName}</div>}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 600 }}>{Number(item.paidPrice ?? 0).toLocaleString()}đ</div>
                  <div style={{ marginTop: 2 }}>{statusTag(item.status)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Drawer>
    </div>
  )
}
