import { Alert, App as AntApp, Button, Card, Input, InputNumber, Switch, Table } from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'

const QUERY_KEY = ['admin-payment-methods']

export default function PaymentMethods() {
  const { message } = AntApp.useApp()
  const queryClient = useQueryClient()
  const [rows, setRows] = useState([])

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => client.get('/admin/payment-methods').then(r => r.data?.data ?? []),
  })
  useEffect(() => { if (data) setRows(data) }, [data])

  const save = useMutation({
    mutationFn: () => client.put('/admin/payment-methods', { methods: rows }).then(r => {
      if (r.data?.resultCode === 0) throw new Error(r.data.message)
      return r.data?.data
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      message.success('Đã lưu phương thức thanh toán')
    },
    onError: error => message.error(error.message || 'Không lưu được'),
  })

  const change = (key, patch) => setRows(current => current.map(row => (row.key === key ? { ...row, ...patch } : row)))

  const columns = [
    { title: 'Bật', dataIndex: 'enabled', width: 80, render: (value, row) => <Switch checked={value} onChange={checked => change(row.key, { enabled: checked })} /> },
    { title: 'Mã', dataIndex: 'key', width: 130, render: value => <code>{value}</code> },
    {
      title: 'Tên hiện cho khách', dataIndex: 'label',
      render: (value, row) => <Input value={value} placeholder={row.defaultLabel} onChange={event => change(row.key, { label: event.target.value })} />,
    },
    {
      title: 'Từ đơn (đ)', dataIndex: 'min', width: 170,
      render: (value, row) => <InputNumber min={0} step={100000} style={{ width: '100%' }} value={value} onChange={next => change(row.key, { min: next ?? 0 })} />,
    },
    {
      title: 'Đến đơn (đ)', dataIndex: 'max', width: 170,
      render: (value, row) => <InputNumber min={0} step={100000} style={{ width: '100%' }} value={value} onChange={next => change(row.key, { max: next ?? 0 })} />,
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div className="page-header">
        <div className="page-title">Phương thức thanh toán</div>
        <span className="page-subtitle">Bật tắt các cách thanh toán khách thấy ở trang thanh toán và khi thử lại thanh toán đơn.</span>
      </div>

      <div className="page-content">
        <Card>
          <Alert
            type="info" showIcon style={{ marginBottom: 16 }}
            message="Cột “Từ đơn” và “Đến đơn” là tổng tiền các khóa trong giỏ (trước khi trừ mã giảm giá và anyPoint) mà phương thức đó mới hiện. Để 0 ở “Đến đơn” là không giới hạn. Mặc định Trả góp 0% chỉ hiện từ 3.000.000đ."
          />
          <Table rowKey="key" loading={isLoading} dataSource={rows} columns={columns} pagination={false} size="middle" scroll={{ x: 760 }} />
          <Button type="primary" icon={<SaveOutlined />} loading={save.isPending} onClick={() => save.mutate()} style={{ marginTop: 16 }}>Lưu</Button>
        </Card>
      </div>
    </div>
  )
}
