import { Alert, Button, Card, InputNumber, Space, Switch, Tag, Typography, message } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'

const DAY_COUNT = 7

export default function FunCheckin() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['admin-fun-checkin'],
    queryFn: () => client.get('/admin/fun/checkin-config').then(r => r.data?.data ?? null),
  })
  const [enabled, setEnabled] = useState(true)
  const [dayPoints, setDayPoints] = useState(Array(DAY_COUNT).fill(0))
  const [cap, setCap] = useState(0)

  useEffect(() => {
    if (!data) return
    setEnabled(data.enabled)
    setDayPoints(data.dayPoints)
    setCap(data.dailyCap)
  }, [data])

  const save = useMutation({
    mutationFn: () => client.put('/admin/fun/checkin-config', { enabled, dayPoints, dailyCap: cap }).then(r => r.data),
    onSuccess: res => {
      if (res.resultCode !== 1) return message.error(res.message)
      message.success('Đã lưu cấu hình điểm danh')
      qc.invalidateQueries({ queryKey: ['admin-fun-checkin'] })
    },
  })

  // A rough cost per day: the average of the week's gifts for the people who opened it in the last 7 days.
  const weekAverage = dayPoints.reduce((sum, p) => sum + (p ?? 0), 0) / DAY_COUNT
  const estimate = Math.round(weekAverage * (data?.claimsPerDay7 ?? 0))
  const coin = data?.coinName ?? 'Leo Xu'
  const overCap = cap > 0 && estimate > cap

  return (
    <div style={{ padding: 24 }}>
      <Button type="link" icon={<ArrowLeftOutlined />} style={{ padding: 0, marginBottom: 8 }} onClick={() => navigate('/fun-events')}>Vui học</Button>
      <Typography.Title level={4} style={{ marginTop: 0 }}>Điểm danh và quà</Typography.Title>
      <Typography.Paragraph type="secondary">
        Mỗi thành viên mở một quà mỗi ngày. Chuỗi ngày liên tiếp quyết định mức {coin} trong tuần; ngày 7 là quà lớn, sau đó quay lại ngày 1.
      </Typography.Paragraph>
      <Card loading={isLoading} style={{ marginBottom: 16 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Space>
            <Switch checked={enabled} onChange={setEnabled} />
            <span>{enabled ? 'Đang bật quà điểm danh' : 'Đang tắt, thành viên không mở được quà'}</span>
          </Space>
          <div>
            <Typography.Text strong>{coin} mỗi ngày trong chuỗi</Typography.Text>
            <Space wrap size="middle" style={{ display: 'flex', marginTop: 8 }}>
              {dayPoints.map((value, i) => (
                <div key={i}>
                  <div style={{ fontSize: 12, color: '#888' }}>Ngày {i + 1}{i === DAY_COUNT - 1 ? ' (quà lớn)' : ''}</div>
                  <InputNumber min={0} max={1000} value={value}
                    onChange={v => setDayPoints(prev => prev.map((p, j) => (j === i ? (v ?? 0) : p)))} />
                </div>
              ))}
            </Space>
          </div>
          <div>
            <Typography.Text strong>Trần {coin} phát ra mỗi ngày</Typography.Text>
            <div style={{ marginTop: 8 }}>
              <InputNumber min={0} step={1000} value={cap} onChange={v => setCap(v ?? 0)} style={{ width: 160 }} />
              <span style={{ marginLeft: 8, color: '#888' }}>0 = không giới hạn. Khi chạm trần, người mở quà sau đó vẫn giữ chuỗi nhưng không nhận {coin} hôm đó.</span>
            </div>
          </div>
          <div>
            <Tag>Hôm nay: {data?.claimsToday ?? 0} lượt mở, {data?.pointsToday ?? 0} {coin}</Tag>
            <Tag>7 ngày qua: trung bình {Math.round(data?.claimsPerDay7 ?? 0)} lượt và {Math.round(data?.pointsPerDay7 ?? 0)} {coin} mỗi ngày</Tag>
          </div>
          <Alert
            type={overCap ? 'warning' : 'info'} showIcon
            message={`Chi phí ước tính mỗi ngày: khoảng ${estimate.toLocaleString('vi-VN')} ${coin}`}
            description={overCap ? 'Vượt trần đã đặt: một phần người mở quà sẽ không nhận ' + coin + '.' : 'Tính bằng mức trung bình 7 ngày trong tuần nhân số lượt mở trung bình mỗi ngày gần đây.'}
          />
          <Button type="primary" loading={save.isPending} onClick={() => save.mutate()}>Lưu cấu hình</Button>
        </Space>
      </Card>
    </div>
  )
}
