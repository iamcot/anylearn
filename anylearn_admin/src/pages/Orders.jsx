import { App, Button, Drawer, Input, Popconfirm, Select, Space, Table, Tag } from 'antd'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import { usePagination } from '../hooks/usePagination'
import { Field } from '../components/Field'

const statusColor = { delivered: 'green', cancelled: 'red', pending: 'orange' }

export default function Orders() {
  const { message } = App.useApp()
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [payment, setPayment] = useState('')
  const { page, setPage, paginationProps } = usePagination()
  const [selectedKeys, setSelectedKeys] = useState([])
  const [drawerOrder, setDrawerOrder] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', q, status, payment, page],
    queryFn: () => client.get('/admin/orders', { params: { q, ...(status && { status }), ...(payment && { payment }), page: page - 1, size: 20 } }).then(r => r.data?.data ?? r.data),
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
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: 'Người mua', dataIndex: 'buyerName' },
    { title: 'SĐT', dataIndex: 'buyerPhone' },
    { title: 'Số tiền', dataIndex: 'amount', render: v => Number(v ?? 0).toLocaleString() },
    { title: 'Thanh toán', dataIndex: 'payment' },
    { title: 'Trạng thái', dataIndex: 'status', render: v => <Tag color={statusColor[v] ?? 'default'}>{v}</Tag> },
    { title: 'Ngày đặt', dataIndex: 'createdAt', render: v => v?.split('T')[0] },
  ]

  const rowSelection = { selectedRowKeys: selectedKeys, onChange: setSelectedKeys }

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <Input.Search placeholder="Tìm người mua" value={q} onChange={e => { setQ(e.target.value); setPage(1) }} onSearch={() => {}} allowClear style={{ width: 200 }} />
        <Select value={status} onChange={v => { setStatus(v); setPage(1) }} style={{ width: 150 }}
          options={[{ value: '', label: 'Tất cả trạng thái' }, { value: 'pending', label: 'pending' }, { value: 'delivered', label: 'delivered' }, { value: 'cancelled', label: 'cancelled' }]}
        />
        <Select value={payment} onChange={v => { setPayment(v); setPage(1) }} style={{ width: 150 }}
          options={[{ value: '', label: 'Tất cả PTTT' }, { value: 'bank_transfer', label: 'bank_transfer' }, { value: 'vnpay', label: 'vnpay' }, { value: 'momo', label: 'momo' }]}
        />
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
      <Table
        columns={columns} dataSource={data?.content ?? []} rowKey="id" loading={isLoading} size="small"
        rowSelection={rowSelection}
        pagination={paginationProps(data?.content)}
        onRow={row => ({ onClick: () => setDrawerOrder(row), style: { cursor: 'pointer' } })}
      />
      <Drawer title={`Đơn hàng #${drawerOrder?.id}`} open={!!drawerOrder} onClose={() => setDrawerOrder(null)} size="large">
        <Field label="Người mua" viewValue={orderDetail?.order?.deliveryName || drawerOrder?.buyerName} />
        <Field label="SĐT" viewValue={drawerOrder?.buyerPhone} />
        <Field label="Thanh toán" viewValue={drawerOrder?.payment} />
        <Field label="Tổng tiền" viewValue={`${Number(drawerOrder?.amount ?? 0).toLocaleString()}đ`} />
        <Field label="Trạng thái" viewValue={<Tag color={statusColor[drawerOrder?.status] ?? 'default'}>{drawerOrder?.status}</Tag>} />
        <Field label="Ngày đặt" viewValue={drawerOrder?.createdAt?.split('T')[0]} />
        {orderDetail?.items?.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Sản phẩm</div>
            {orderDetail.items.map(item => (
              <div key={item.id} style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
                <div>{item.title}</div>
                <div style={{ color: '#666' }}>{Number(item.paidPrice ?? 0).toLocaleString()}đ · {item.status}</div>
              </div>
            ))}
          </div>
        )}
      </Drawer>
    </div>
  )
}
