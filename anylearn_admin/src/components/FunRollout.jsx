import { Button, Card, Col, Form, Input, InputNumber, Row, Select, Statistic, Table, Typography, message } from 'antd'
import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'

const GAMES = { checkin: 'Điểm danh', quiz: 'Quiz Leo rank', sticker: 'Sticker', explore: 'Khám phá' }
const MODES = [
  { value: 'all', label: 'Mở cho mọi người' },
  { value: 'testers', label: 'Chỉ nhóm thử' },
  { value: 'off', label: 'Đóng (admin vẫn vào được)' },
]

/** Roll-out switches per game, the daily earning cap and the last 7 days of numbers to tune rates by (plan 14, phase 8). */
export default function FunRollout() {
  const qc = useQueryClient()
  const [form] = Form.useForm()
  const { data: access } = useQuery({ queryKey: ['admin-fun-access'], queryFn: () => client.get('/admin/fun/access').then(r => r.data?.data ?? null) })
  const { data: health } = useQuery({ queryKey: ['admin-fun-health'], queryFn: () => client.get('/admin/fun/health').then(r => r.data?.data ?? null) })

  useEffect(() => {
    if (access) form.setFieldsValue({ ...Object.fromEntries(Object.entries(access.modes).map(([g, m]) => [`mode_${g}`, m])), testers: access.testers, dailyEarnCap: access.dailyEarnCap })
  }, [access, form])

  const save = useMutation({
    mutationFn: v => client.put('/admin/fun/access', {
      modes: Object.fromEntries(Object.keys(GAMES).map(g => [g, v[`mode_${g}`]])),
      testers: v.testers ?? '',
      dailyEarnCap: v.dailyEarnCap ?? 0,
    }).then(r => r.data),
    onSuccess: res => {
      if (res.resultCode !== 1) return message.error(res.message)
      message.success('Đã lưu')
      qc.invalidateQueries({ queryKey: ['admin-fun-access'] })
    },
  })

  const quiz = health?.quiz
  return (
    <>
      <Card title="Mở dần từng game" size="small" style={{ marginTop: 16 }}>
        <Typography.Paragraph type="secondary">Chọn "Chỉ nhóm thử" để game chỉ mở cho các số điện thoại trong danh sách (và admin); người khác thấy game biến mất khỏi trang Vui học. Đổi sang "Mở cho mọi người" khi đã yên tâm.</Typography.Paragraph>
        <Form form={form} layout="vertical" onFinish={v => save.mutate(v)}>
          <Row gutter={12}>
            {Object.entries(GAMES).map(([g, label]) => (
              <Col xs={24} md={6} key={g}><Form.Item name={`mode_${g}`} label={label}><Select options={MODES} /></Form.Item></Col>
            ))}
          </Row>
          <Form.Item name="testers" label="Số điện thoại nhóm thử (cách nhau bằng dấu phẩy hoặc xuống dòng)"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="dailyEarnCap" label="Trần Leo Xu một người nhận được mỗi ngày từ game (0 = không giới hạn; điều chỉnh của admin không bị cắt)"><InputNumber min={0} /></Form.Item>
          <Button type="primary" htmlType="submit" loading={save.isPending}>Lưu</Button>
        </Form>
      </Card>

      <Card title="Sức khỏe game, 7 ngày qua" size="small" style={{ marginTop: 16 }}>
        <Row gutter={[12, 12]}>
          <Col xs={12} md={6}><Statistic title="Leo Xu phát ra" value={health?.coinsIssued ?? 0} /></Col>
          <Col xs={12} md={6}><Statistic title="Leo Xu đã tiêu" value={health?.coinsSpent ?? 0} /></Col>
          <Col xs={12} md={6}><Statistic title="Quiz: tỉ lệ đúng" value={quiz?.correctRate ?? 0} suffix="%" /></Col>
          <Col xs={12} md={6}><Statistic title="Quiz: vật phẩm rơi / câu đúng" value={quiz?.dropRatePerCorrect ?? 0} suffix="%" /></Col>
          <Col xs={12} md={6}><Statistic title="Câu bị gắn cờ" value={quiz?.flagged ?? 0} suffix={`(${quiz?.flaggedRate ?? 0}%)`} /></Col>
          <Col xs={12} md={6}><Statistic title="Tài khoản rủi ro chờ xem" value={health?.openRisk ?? 0} /></Col>
          <Col xs={12} md={6}><Statistic title="Gói quà chờ duyệt" value={health?.welcomeReview ?? 0} /></Col>
          <Col xs={12} md={6}><Statistic title="Chạm trần hôm nay" value={health?.cappedToday ?? 0} /></Col>
        </Row>
        <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
          <Col xs={24} md={12}>
            <Table size="small" rowKey="game" pagination={false} title={() => 'Người chơi theo game'} dataSource={health?.playersByGame ?? []} columns={[
              { title: 'Game', dataIndex: 'game' }, { title: 'Người chơi', dataIndex: 'players' }, { title: 'Sự kiện', dataIndex: 'events' }]} />
          </Col>
          <Col xs={24} md={12}>
            <Table size="small" rowKey="source" pagination={false} title={() => 'Leo Xu theo nguồn (dương = phát, âm = tiêu)'} dataSource={health?.coinsBySource ?? []} columns={[
              { title: 'Nguồn', dataIndex: 'source' }, { title: 'Leo Xu', dataIndex: 'coins' }]} />
          </Col>
          <Col xs={24}>
            <Table size="small" rowKey="userId" pagination={false} title={() => 'Người có nhiều câu bị gắn cờ nhất'} dataSource={health?.topFlagged ?? []} columns={[
              { title: 'Người chơi', dataIndex: 'name' }, { title: 'Điện thoại', dataIndex: 'phone' }, { title: 'Số câu gắn cờ', dataIndex: 'flagged' }]} />
          </Col>
        </Row>
      </Card>
    </>
  )
}
