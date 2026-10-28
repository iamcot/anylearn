import { Alert, Button, Card, Col, Form, Input, InputNumber, Row, Space, Statistic, Table, Tag, Typography, message } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import { fmtDateTime } from '../utils/format'

const SOURCES = { checkin: 'Điểm danh', sticker_set: 'Đủ bộ sticker', quiz_rank: 'Thưởng lên hạng', quiz_item: 'Mua vật phẩm quiz', admin: 'Admin điều chỉnh' }
const num = v => (v ?? 0).toLocaleString('vi-VN')

export default function FunCoins() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['admin-fun-coins'],
    queryFn: () => client.get('/admin/fun/coins').then(r => r.data?.data ?? null),
  })
  const name = data?.name ?? 'Leo Xu'
  const [newName, setNewName] = useState('')
  useEffect(() => { if (data?.name) setNewName(data.name) }, [data?.name])

  const rename = useMutation({
    mutationFn: () => client.put('/admin/fun/coins/name', { name: newName }).then(r => r.data),
    onSuccess: res => {
      if (res.resultCode !== 1) return message.error(res.message)
      message.success('Đã đổi tên tiền')
      qc.invalidateQueries({ queryKey: ['admin-fun-coins'] })
    },
  })

  const [q, setQ] = useState('')
  const [picked, setPicked] = useState(null)
  const { data: found, isFetching } = useQuery({
    queryKey: ['admin-fun-coin-members', q],
    queryFn: () => client.get('/admin/fun/coins/members', { params: { q } }).then(r => r.data?.data ?? []),
  })
  const [ledgerPage, setLedgerPage] = useState(1)
  const { data: ledger, isLoading: ledgerLoading } = useQuery({
    queryKey: ['admin-fun-coin-ledger', picked?.id ?? null, ledgerPage],
    queryFn: () => client.get('/admin/fun/coins/ledger', { params: { userId: picked?.id, page: ledgerPage } }).then(r => r.data?.data ?? null),
  })
  const [form] = Form.useForm()
  const adjust = useMutation({
    mutationFn: values => client.post('/admin/fun/coins/adjust', { userId: picked.id, ...values }).then(r => r.data),
    onSuccess: res => {
      if (res.resultCode !== 1) return message.error(res.message)
      message.success(`Đã điều chỉnh. Số dư mới: ${num(res.data?.balance)} ${name}`)
      form.resetFields()
      setPicked(p => ({ ...p, balance: res.data?.balance }))
      qc.invalidateQueries({ queryKey: ['admin-fun-coins'] })
      qc.invalidateQueries({ queryKey: ['admin-fun-coin-members'] })
      qc.invalidateQueries({ queryKey: ['admin-fun-coin-ledger'] })
    },
  })

  return (
    <div style={{ padding: 24 }}>
      <Button type="link" icon={<ArrowLeftOutlined />} style={{ padding: 0, marginBottom: 8 }} onClick={() => navigate('/fun-events')}>Vui học</Button>
      <Typography.Title level={4} style={{ marginTop: 0 }}>Tiền Vui học ({name})</Typography.Title>
      <Typography.Paragraph type="secondary">
        Đây là đồng tiền riêng của các game, <b>không phải anyPoint</b>: phát ra từ điểm danh và thưởng đủ bộ sticker, không tạo giao dịch ví và không gửi thông báo anyPoint.
        Việc đổi {name} sang anyPoint hay quà sẽ thiết kế sau, nên hiện tại {name} chưa quy ra tiền.
      </Typography.Paragraph>

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}><Card size="small" loading={isLoading}><Statistic title={`${name} đang lưu hành`} value={data?.circulation ?? 0} /></Card></Col>
        <Col xs={12} md={6}><Card size="small" loading={isLoading}><Statistic title="Người đang giữ" value={data?.holders ?? 0} /></Card></Col>
        <Col xs={12} md={6}><Card size="small" loading={isLoading}><Statistic title="Phát ra hôm nay" value={data?.issuedToday ?? 0} /></Card></Col>
        <Col xs={12} md={6}><Card size="small" loading={isLoading}><Statistic title="Phát ra 7 ngày qua" value={data?.issued7 ?? 0} /></Card></Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card size="small" title="Tên đồng tiền" style={{ marginBottom: 16 }}>
            <Space.Compact>
              <Input value={newName} onChange={e => setNewName(e.target.value)} maxLength={20} style={{ width: 200 }} />
              <Button type="primary" loading={rename.isPending} disabled={!newName.trim() || newName.trim() === data?.name} onClick={() => rename.mutate()}>Lưu</Button>
            </Space.Compact>
            <div style={{ color: '#888', marginTop: 6 }}>Hiện ở mọi màn hình của game (ví dụ "+10 {name}"). Số dư không đổi khi đổi tên.</div>
          </Card>
          <Card size="small" title="7 ngày qua theo nguồn" style={{ marginBottom: 16 }}>
            <Table size="small" rowKey="source" pagination={false} dataSource={data?.bySource ?? []} locale={{ emptyText: 'Chưa có phát sinh' }}
              columns={[
                { title: 'Nguồn', dataIndex: 'source', render: s => SOURCES[s] ?? s },
                { title: 'Phát ra', dataIndex: 'issued', align: 'right', render: num },
                { title: 'Đã tiêu', dataIndex: 'spent', align: 'right', render: num },
              ]} />
          </Card>
          <Card size="small" title="10 người giữ nhiều nhất">
            <Table size="small" rowKey="userId" pagination={false} dataSource={data?.top ?? []} locale={{ emptyText: 'Chưa ai có' }}
              columns={[
                { title: 'Thành viên', render: (_, r) => `${r.userName ?? r.userId} ${r.userPhone ?? ''}` },
                { title: 'Số dư', dataIndex: 'balance', align: 'right', render: num },
              ]} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card size="small" title="Tra cứu và điều chỉnh một thành viên" style={{ marginBottom: 16 }}>
            <Input.Search placeholder="Tên hoặc số điện thoại" allowClear onSearch={v => { setQ(v); setPicked(null); setLedgerPage(1) }} loading={isFetching} />
            <Table size="small" rowKey="id" style={{ marginTop: 8 }} pagination={false} showHeader={false} dataSource={found ?? []}
              onRow={row => ({ onClick: () => { setPicked(row); setLedgerPage(1) }, style: { cursor: 'pointer', background: row.id === picked?.id ? '#f1f8f4' : undefined } })}
              columns={[
                { render: (_, r) => <div><b>{r.name}</b> <span style={{ color: '#888' }}>{r.phone}</span></div> },
                { width: 120, align: 'right', render: (_, r) => `${num(r.balance)} ${name}` },
              ]} />
            {picked && (
              <Form form={form} layout="inline" style={{ marginTop: 12, rowGap: 8 }} onFinish={values => adjust.mutate(values)}>
                <Form.Item name="amount" rules={[{ required: true, message: 'Nhập số' }]} extra="Số dương = cộng, số âm = trừ">
                  <InputNumber placeholder="Số lượng" style={{ width: 130 }} />
                </Form.Item>
                <Form.Item name="reason" rules={[{ required: true, message: 'Ghi lý do' }]}><Input placeholder="Lý do (bắt buộc)" style={{ width: 200 }} /></Form.Item>
                <Button type="primary" htmlType="submit" loading={adjust.isPending}>Điều chỉnh cho {picked.name}</Button>
              </Form>
            )}
          </Card>
          <Card size="small" title={picked ? `Lịch sử của ${picked.name}` : 'Lịch sử mới nhất'}>
            {picked && <Tag style={{ marginBottom: 8 }}>Số dư: {num(picked.balance)} {name}</Tag>}
            <Table size="small" rowKey="id" loading={ledgerLoading} dataSource={ledger?.items ?? []}
              pagination={{ current: ledgerPage, pageSize: 30, total: ledger?.total ?? 0, onChange: setLedgerPage, showSizeChanger: false }}
              columns={[
                { title: 'Lúc', dataIndex: 'createdAt', width: 140, render: fmtDateTime },
                ...(picked ? [] : [{ title: 'Thành viên', render: (_, r) => r.userName ?? r.userId }]),
                { title: 'Nguồn', dataIndex: 'source', width: 110, render: s => SOURCES[s] ?? s },
                { title: 'Thay đổi', dataIndex: 'delta', width: 90, align: 'right', render: d => <span style={{ color: d > 0 ? '#2f9e44' : '#e03131' }}>{d > 0 ? '+' : ''}{num(d)}</span> },
                { title: 'Ghi chú', dataIndex: 'detail' },
              ]} />
          </Card>
        </Col>
      </Row>
      <Alert type="info" showIcon style={{ marginTop: 16 }} message="Mức thưởng điểm danh và thưởng đủ bộ sticker đổi ở 'Điểm danh & quà' và 'Sticker' > Cấu hình; chúng được tính bằng đồng tiền này." />
    </div>
  )
}
