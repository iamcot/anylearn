import { Alert, Button, Card, Col, InputNumber, Row, Space, Statistic, Switch, Table, Tag, Typography, message } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'

function groupFields(fields) {
  const out = []
  for (const f of fields ?? []) {
    let g = out.find(x => x.name === f.group)
    if (!g) { g = { name: f.group, fields: [] }; out.push(g) }
    g.fields.push(f)
  }
  return out
}

// Profit of one harvest with full care (base yield) and with fertilizer (+1), minus the seed: what the player nets per crop.
const profit = (c, extra) => (c.base_yield + extra) * c.unit_price - c.seed_price

/** Nông trại anyLEARN (plan 22): the numbers, the crop catalog with its profit per crop, and the day's totals. */
export default function FunFarm() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const settingsQ = useQuery({ queryKey: ['admin-farm-settings'], queryFn: () => client.get('/admin/farm/settings').then(r => r.data?.data ?? null) })
  const cropsQ = useQuery({ queryKey: ['admin-farm-crops'], queryFn: () => client.get('/admin/farm/crops').then(r => r.data?.data ?? []) })
  const [numbers, setNumbers] = useState({})
  const [crops, setCrops] = useState([])

  useEffect(() => { if (settingsQ.data) setNumbers(settingsQ.data.numbers) }, [settingsQ.data])
  useEffect(() => { if (cropsQ.data) setCrops(cropsQ.data) }, [cropsQ.data])

  const saveSettings = useMutation({
    mutationFn: () => client.put('/admin/farm/settings', { numbers }).then(r => r.data),
    onSuccess: res => {
      if (res.resultCode !== 1) return message.error(res.message)
      message.success('Đã lưu cài đặt Nông trại')
      qc.invalidateQueries({ queryKey: ['admin-farm-settings'] })
    },
  })
  const saveCrop = useMutation({
    mutationFn: c => client.put(`/admin/farm/crops/${c.crop_key}`, c).then(r => r.data),
    onSuccess: res => {
      if (res.resultCode !== 1) return message.error(res.message)
      message.success('Đã lưu cây')
      qc.invalidateQueries({ queryKey: ['admin-farm-crops'] })
    },
  })

  const d = settingsQ.data
  const coin = d?.coinName ?? 'Leo Xu'
  const setCrop = (key, field, value) => setCrops(prev => prev.map(c => (c.crop_key === key ? { ...c, [field]: value } : c)))
  const num = (c, field, min, max) => <InputNumber size="small" style={{ width: 72 }} min={min} max={max} value={c[field]} onChange={v => setCrop(c.crop_key, field, v ?? min)} />

  return (
    <div style={{ padding: 24 }}>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/fun-events')}>Vui học</Button>
      <Typography.Title level={4} style={{ marginTop: 12 }}>Nông trại anyLEARN</Typography.Title>
      <Alert type="info" showIcon style={{ marginBottom: 16 }}
        message={`Lãi ròng của người chơi (tiền bán trừ tiền hạt và phân) bị chặn theo ngày và theo tuần. Đây là chốt chặn chính để ${coin} từ Nông trại không làm lạm phát vì ${coin} đổi được voucher. Bật / tắt riêng game ở Vui học > "Mở dần từng game" (game farm).`} />

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} md={4}><Statistic title="Người chơi" value={d?.players ?? 0} /></Col>
        <Col xs={12} md={4}><Statistic title="Vào vườn hôm nay" value={d?.playersToday ?? 0} /></Col>
        <Col xs={12} md={4}><Statistic title={`${coin} bán hôm nay`} value={d?.coinsInToday ?? 0} /></Col>
        <Col xs={12} md={4}><Statistic title={`${coin} chi hôm nay`} value={d?.coinsSpentToday ?? 0} /></Col>
        <Col xs={12} md={4}><Statistic title="Bán 7 ngày" value={d?.coinsIn7d ?? 0} /></Col>
        <Col xs={12} md={4}><Statistic title="Chi 7 ngày" value={d?.coinsSpent7d ?? 0} /></Col>
      </Row>

      <Card title="Cây trồng" loading={cropsQ.isLoading} style={{ marginBottom: 16 }}>
        <Table rowKey="crop_key" size="small" pagination={false} scroll={{ x: 1100 }} dataSource={crops} columns={[
          { title: 'Cây', render: (_, c) => <span>{c.emoji} <b>{c.name}</b> <Tag>{c.category}</Tag></span> },
          { title: 'Lớn (phút)', render: (_, c) => num(c, 'grow_minutes', 1, 100000) },
          { title: 'Tưới', render: (_, c) => num(c, 'water_needs', 0, 10) },
          { title: 'Giá hạt', render: (_, c) => num(c, 'seed_price', 0, 100000) },
          { title: 'Giá bán / quả', render: (_, c) => num(c, 'unit_price', 0, 100000) },
          { title: 'Quả / vụ', render: (_, c) => num(c, 'base_yield', 1, 50) },
          { title: 'XP', render: (_, c) => num(c, 'xp', 0, 100000) },
          { title: 'Cấp mở', render: (_, c) => num(c, 'unlock_level', 1, 30) },
          { title: 'Lãi chăm đủ', render: (_, c) => { const v = profit(c, 0); return <Tag color={v < 0 ? 'red' : 'default'}>{v}</Tag> } },
          { title: 'Lãi có bón', render: (_, c) => { const v = profit(c, 1); const pct = c.seed_price > 0 ? Math.round((v / c.seed_price) * 100) : 0; return <Tag color={pct > 60 ? 'red' : 'green'}>{v} ({pct}%)</Tag> } },
          { title: 'Bật', render: (_, c) => <Switch checked={c.active === 1} onChange={v => setCrop(c.crop_key, 'active', v ? 1 : 0)} /> },
          { title: '', render: (_, c) => <Button size="small" type="primary" loading={saveCrop.isPending} onClick={() => saveCrop.mutate(c)}>Lưu</Button> },
        ]} />
        <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>
          Lãi = số quả × giá bán − giá hạt (giá bán là giá gốc, giá chợ mỗi ngày dao động quanh đó). Mục tiêu: chăm đủ lãi mỏng (10-20%), có bón lãi khá (35-50%); dòng đỏ là lãi có bón trên 60% hoặc lỗ khi chăm đủ.
        </Typography.Paragraph>
      </Card>

      <Card title="Cài đặt" loading={settingsQ.isLoading}
        extra={<Button type="primary" loading={saveSettings.isPending} onClick={() => saveSettings.mutate()}>Lưu cài đặt</Button>}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {groupFields(d?.fields).map(g => (
            <div key={g.name}>
              <Typography.Title level={5} style={{ marginTop: 0 }}>{g.name}</Typography.Title>
              <Row gutter={[16, 12]}>
                {g.fields.map(f => (
                  <Col xs={24} md={12} key={f.key}>
                    <div style={{ marginBottom: 4 }}>{f.label}</div>
                    {f.max === 1 && f.min === 0
                      ? <Switch checked={numbers[f.key] === 1} onChange={v => setNumbers(p => ({ ...p, [f.key]: v ? 1 : 0 }))} />
                      : <InputNumber min={f.min} max={f.max} value={numbers[f.key]} onChange={v => setNumbers(p => ({ ...p, [f.key]: v ?? f.def }))} />}
                    <Typography.Text type="secondary" style={{ marginLeft: 8 }}>mặc định {f.def}</Typography.Text>
                  </Col>
                ))}
              </Row>
            </div>
          ))}
        </Space>
      </Card>
    </div>
  )
}
