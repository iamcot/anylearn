import { Button, Card, Form, Input, InputNumber, Switch, Table, Typography, message } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import { fmtDateTime } from '../utils/format'

const TYPES = { rankup: 'Lên hạng Leo rank', streak: 'Chuỗi điểm danh', board: 'Top bảng xếp hạng', sticker_set: 'Đủ bộ sticker' }

export default function Achievements() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [form] = Form.useForm()
  const { data: settings } = useQuery({ queryKey: ['admin-ach-settings'], queryFn: () => client.get('/admin/achievements/settings').then(r => r.data?.data ?? null) })
  const { data: stats } = useQuery({ queryKey: ['admin-ach-stats'], queryFn: () => client.get('/admin/achievements/stats').then(r => r.data?.data ?? null) })

  useEffect(() => {
    if (settings) form.setFieldsValue({ enabled: settings.enabled, streakDays: settings.streakDays, shareCoins: settings.shareCoins, shareDailyMax: settings.shareDailyMax, ...Object.fromEntries(Object.entries(settings.types).map(([k, v]) => [`type_${k}`, v])) })
  }, [settings, form])

  const save = useMutation({
    mutationFn: values => client.put('/admin/achievements/settings', {
      enabled: values.enabled,
      streakDays: values.streakDays,
      shareCoins: values.shareCoins,
      shareDailyMax: values.shareDailyMax,
      types: Object.fromEntries(Object.keys(TYPES).map(k => [k, !!values[`type_${k}`]])),
    }).then(r => r.data),
    onSuccess: res => {
      if (res.resultCode !== 1) return message.error(res.message)
      message.success('Đã lưu')
      qc.invalidateQueries({ queryKey: ['admin-ach-settings'] })
    },
  })

  return (
    <div style={{ padding: 24 }}>
      <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/fun-events')}>Vui học</Button>
      <Typography.Title level={4}>Banner thành tích</Typography.Title>
      <Typography.Paragraph type="secondary">Khi người chơi lên hạng, đạt mốc điểm danh, đứng top bảng xếp hạng hoặc đủ bộ sticker, hệ thống tạo một banner để họ chia sẻ. Bảng dưới cho thấy chia sẻ mang về bao nhiêu lượt xem và người đăng ký.</Typography.Paragraph>

      <Card title="Cấu hình" style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical" onFinish={v => save.mutate(v)}>
          <Form.Item name="enabled" label="Bật banner thành tích" valuePropName="checked"><Switch /></Form.Item>
          {Object.entries(TYPES).map(([k, label]) => (
            <Form.Item key={k} name={`type_${k}`} label={label} valuePropName="checked"><Switch /></Form.Item>
          ))}
          <Form.Item name="streakDays" label="Các mốc chuỗi điểm danh (ngày, cách nhau bằng dấu phẩy)"><Input placeholder="7,14,30,60,100" /></Form.Item>
          <Form.Item name="shareCoins" label="Leo Xu thưởng khi chia sẻ một banner lần đầu (0 = không thưởng)"><InputNumber min={0} max={1000} /></Form.Item>
          <Form.Item name="shareDailyMax" label="Số lần được thưởng chia sẻ tối đa mỗi người mỗi ngày"><InputNumber min={0} max={20} /></Form.Item>
          <Button type="primary" htmlType="submit" loading={save.isPending}>Lưu</Button>
        </Form>
      </Card>

      <Card title="Hiệu quả theo loại" style={{ marginBottom: 16 }}>
        <Table rowKey="type" pagination={false} dataSource={stats?.byType ?? []} columns={[
          { title: 'Loại', dataIndex: 'type', render: t => TYPES[t] ?? t },
          { title: 'Banner đã tạo', dataIndex: 'made' },
          { title: 'Lượt bấm chia sẻ', dataIndex: 'shares' },
          { title: 'Lượt mở trang chia sẻ', dataIndex: 'opens' },
          { title: 'Đăng ký mới', dataIndex: 'signups' },
          { title: 'Đã chơi sau khi đăng ký', dataIndex: 'played' },
        ]} />
      </Card>

      <Card title="Banner gần đây">
        <Table rowKey="id" pagination={false} dataSource={stats?.recent ?? []} columns={[
          { title: 'Người chơi', dataIndex: 'userName' },
          { title: 'Loại', dataIndex: 'type', render: t => TYPES[t] ?? t },
          { title: 'Tiêu đề', dataIndex: 'title' },
          { title: 'Chia sẻ', dataIndex: 'shares' },
          { title: 'Mở', dataIndex: 'opens' },
          { title: 'Đăng ký', dataIndex: 'signups' },
          { title: 'Lúc', dataIndex: 'createdAt', render: fmtDateTime },
        ]} />
      </Card>
    </div>
  )
}
