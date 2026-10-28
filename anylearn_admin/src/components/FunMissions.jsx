import { Alert, Button, Card, InputNumber, Space, Switch, Table, Tag, Typography, message } from 'antd'
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'

// One row per mission: the fields of the backend come as "{key}/target", "{key}/reward", "{key}/enabled" grouped by mission label.
function rowsOf(fields) {
  const rows = []
  for (const f of fields ?? []) {
    if (!f.key.includes('/')) continue
    const key = f.key.split('/')[0]
    if (!rows.find(r => r.key === key)) rows.push({ key, label: f.group })
  }
  return rows
}

/** Weekly missions of Vui học (plan 15): target, reward and switch of each mission, and how many must be done for the free sticker. */
export default function FunMissions() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['admin-fun-missions'],
    queryFn: () => client.get('/admin/fun/missions-config').then(r => r.data?.data ?? null),
  })
  const [numbers, setNumbers] = useState({})

  useEffect(() => { if (data) setNumbers(data.numbers) }, [data])

  const save = useMutation({
    mutationFn: () => client.put('/admin/fun/missions-config', { numbers }).then(r => r.data),
    onSuccess: res => {
      if (res.resultCode !== 1) return message.error(res.message)
      message.success('Đã lưu nhiệm vụ tuần')
      qc.invalidateQueries({ queryKey: ['admin-fun-missions'] })
    },
  })

  const coin = data?.coinName ?? 'Leo Xu'
  const rows = rowsOf(data?.fields)
  const bonusField = (data?.fields ?? []).find(f => f.key === 'bonus_needed')
  const set = (name, value) => setNumbers(prev => ({ ...prev, [name]: value }))
  // The most one player can earn from missions in a week, as a rough budget figure.
  const weekMax = rows.reduce((sum, r) => sum + (numbers[`${r.key}/enabled`] === 1 ? (numbers[`${r.key}/reward`] ?? 0) : 0), 0)

  return (
    <Card title="Nhiệm vụ tuần" loading={isLoading} style={{ marginTop: 16 }}>
      <Typography.Paragraph type="secondary">
        Mỗi tuần (từ thứ Hai 00:00) người chơi làm các nhiệm vụ dưới đây rồi bấm Nhận để lấy {coin}. Tiến độ tính từ nhật ký sự kiện game của tuần đó. Làm xong đủ số nhiệm vụ thì nhận thêm 1 sticker miễn phí.
      </Typography.Paragraph>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Table rowKey="key" size="small" pagination={false} dataSource={rows} columns={[
          { title: 'Nhiệm vụ', dataIndex: 'label' },
          { title: 'Mục tiêu', key: 't', render: (_, r) => <InputNumber min={1} max={1000} value={numbers[`${r.key}/target`]} onChange={v => set(`${r.key}/target`, v ?? 1)} /> },
          { title: `Thưởng (${coin})`, key: 'r', render: (_, r) => <InputNumber min={0} max={100000} value={numbers[`${r.key}/reward`]} onChange={v => set(`${r.key}/reward`, v ?? 0)} /> },
          { title: 'Bật', key: 'e', render: (_, r) => <Switch checked={numbers[`${r.key}/enabled`] === 1} onChange={v => set(`${r.key}/enabled`, v ? 1 : 0)} /> },
        ]} />
        {bonusField && (
          <div>
            <Typography.Text strong>{bonusField.label}</Typography.Text>
            <div style={{ marginTop: 8 }}>
              <InputNumber min={bonusField.min} max={bonusField.max} value={numbers.bonus_needed} onChange={v => set('bonus_needed', v ?? 1)} />
              <span style={{ marginLeft: 8, color: '#888' }}>Nếu đặt cao hơn số nhiệm vụ đang bật thì hệ thống tự hạ xuống bằng số nhiệm vụ đang bật.</span>
            </div>
          </div>
        )}
        <div>
          <Tag>Tuần này: {data?.claimsThisWeek ?? 0} lượt nhận, {data?.coinsThisWeek ?? 0} {coin}, {data?.bonusThisWeek ?? 0} sticker thưởng</Tag>
          <Tag>Tối đa mỗi người mỗi tuần: {weekMax} {coin}</Tag>
        </div>
        <Alert type="info" showIcon message="Nhiệm vụ tính theo tuần ISO (thứ Hai đến Chủ nhật, giờ Việt Nam). Đổi mục tiêu giữa tuần có hiệu lực ngay, phần đã nhận không bị thu lại." />
        <Button type="primary" loading={save.isPending} onClick={() => save.mutate()}>Lưu nhiệm vụ tuần</Button>
      </Space>
    </Card>
  )
}
