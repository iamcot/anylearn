import { Alert, Button, Card, Col, Form, Input, InputNumber, Popconfirm, Row, Segmented, Select, Space, Statistic, Switch, Table, Tabs, Tag, Typography, message } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import { fmtDateTime } from '../utils/format'

const OUTCOMES = { correct: 'Đúng', wrong: 'Sai', timeout: 'Hết giờ', forfeit: 'Bỏ dở', open: 'Đang mở' }
const BOARD_TYPES = [
  { label: 'Tuần này', value: 'week' },
  { label: 'Tháng này', value: 'month' },
  { label: 'Cùng hạng', value: 'rank' },
  { label: 'Mọi thời', value: 'all' },
]

function SettingsTab() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['admin-quiz-settings'],
    queryFn: () => client.get('/admin/quiz/settings').then(r => r.data?.data ?? null),
  })
  const [form] = Form.useForm()
  useEffect(() => {
    if (!data) return
    form.setFieldsValue({ enabled: data.enabled, rankStars: data.rankStars, boardWeekItems: data.boardWeekItems, boardMonthItems: data.boardMonthItems, numbers: data.numbers })
  }, [data, form])
  const groups = useMemo(() => {
    const out = []
    for (const f of data?.fields ?? []) {
      let g = out.find(x => x.name === f.group)
      if (!g) { g = { name: f.group, fields: [] }; out.push(g) }
      g.fields.push(f)
    }
    return out
  }, [data])
  const save = useMutation({
    mutationFn: values => client.put('/admin/quiz/settings', values).then(r => r.data),
    onSuccess: res => {
      if (res.resultCode !== 1) return message.error(res.message)
      message.success('Đã lưu cấu hình Leo rank')
      qc.invalidateQueries({ queryKey: ['admin-quiz-settings'] })
    },
  })
  return (
    <Form form={form} layout="vertical" onFinish={values => save.mutate(values)} disabled={isLoading}>
      <Card size="small" title="Chung" style={{ marginBottom: 12 }}>
        <Form.Item name="enabled" label="Bật game Leo rank" valuePropName="checked"><Switch /></Form.Item>
        <Form.Item name="rankStars" label={`Số sao để rời mỗi hạng (${(data?.ranks ?? []).slice(0, 7).join(', ')}), cách nhau bằng dấu phẩy`}
          extra="Thanh đầy thì cần trả lời đúng thêm một câu để lên hạng. Hạng cuối không có trần."><Input style={{ maxWidth: 320 }} /></Form.Item>
      </Card>
      <Card size="small" title="Thưởng top 3 bảng xếp hạng" style={{ marginBottom: 12 }}>
        <Row gutter={12}>
          <Col xs={24} md={8}><Form.Item name="boardWeekItems" label="Vật phẩm ngẫu nhiên cho hạng 1, 2, 3 của tuần" extra="Ví dụ 3,2,1"><Input /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item name="boardMonthItems" label="Vật phẩm ngẫu nhiên cho hạng 1, 2, 3 của tháng"><Input /></Form.Item></Col>
        </Row>
      </Card>
      {groups.map(g => (
        <Card key={g.name} size="small" title={g.name} style={{ marginBottom: 12 }}>
          <Row gutter={12}>
            {g.fields.map(f => (
              <Col xs={24} md={12} key={f.key}>
                <Form.Item name={['numbers', f.key]} label={f.label} extra={`Mặc định ${f.def}, từ ${f.min} đến ${f.max}`}>
                  <InputNumber min={f.min} max={f.max} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            ))}
          </Row>
        </Card>
      ))}
      <Button type="primary" htmlType="submit" loading={save.isPending}>Lưu cấu hình</Button>
    </Form>
  )
}

function OverviewTab() {
  const { data } = useQuery({ queryKey: ['admin-quiz-overview'], queryFn: () => client.get('/admin/quiz/overview').then(r => r.data?.data ?? null) })
  return (
    <>
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={4}><Card size="small"><Statistic title="Người đã chơi" value={data?.players ?? 0} /></Card></Col>
        <Col xs={12} md={4}><Card size="small"><Statistic title="Chơi hôm nay" value={data?.playersToday ?? 0} /></Card></Col>
        <Col xs={12} md={4}><Card size="small"><Statistic title="Câu trả lời hôm nay" value={data?.answersToday ?? 0} /></Card></Col>
        <Col xs={12} md={4}><Card size="small"><Statistic title="Câu trả lời 7 ngày" value={data?.answers7 ?? 0} /></Card></Col>
        <Col xs={12} md={4}><Card size="small"><Statistic title="Câu bị gắn cờ" value={data?.flagged ?? 0} /></Card></Col>
        <Col xs={12} md={4}><Card size="small"><Statistic title="Bị chặn khỏi BXH" value={data?.blocked ?? 0} /></Card></Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} md={10}>
          <Card size="small" title="Phân bố hạng của người chơi">
            <Table size="small" pagination={false} rowKey="key" dataSource={data?.rankSpread ?? []}
              columns={[{ title: 'Hạng', dataIndex: 'label' }, { title: 'Người chơi', dataIndex: 'players', align: 'right' }]} />
          </Card>
        </Col>
        <Col xs={24} md={14}>
          <Card size="small" title="Tỉ lệ đúng theo chủ đề (30 ngày)">
            <Table size="small" pagination={false} rowKey="topic" dataSource={data?.byTopic ?? []}
              columns={[
                { title: 'Chủ đề', dataIndex: 'label' },
                { title: 'Lượt trả lời', dataIndex: 'answers', align: 'right' },
                { title: 'Tỉ lệ đúng', align: 'right', render: (_, r) => (r.answers ? `${Math.round((100 * r.correct) / r.answers)}%` : '-') },
              ]} />
          </Card>
        </Col>
      </Row>
    </>
  )
}

function BoardTab() {
  const [type, setType] = useState('week')
  const [rank, setRank] = useState(0)
  const { data: settings } = useQuery({ queryKey: ['admin-quiz-settings'], queryFn: () => client.get('/admin/quiz/settings').then(r => r.data?.data ?? null) })
  const { data, isLoading } = useQuery({
    queryKey: ['admin-quiz-board', type, rank],
    queryFn: () => client.get('/admin/quiz/board', { params: { type, rank: type === 'rank' ? rank : undefined } }).then(r => r.data?.data ?? null),
  })
  return (
    <>
      <Space wrap style={{ marginBottom: 12 }}>
        <Segmented options={BOARD_TYPES} value={type} onChange={setType} />
        {type === 'rank' && <Select value={rank} onChange={setRank} style={{ width: 140 }} options={(settings?.ranks ?? []).map((label, value) => ({ label, value }))} />}
        {data?.period && <Tag color="green">{data.period}</Tag>}
      </Space>
      <Typography.Paragraph type="secondary">Đây là bảng người chơi thấy (tên hiển thị rút gọn, không có người ẩn hoặc bị chặn), nhớ tạm một phút.</Typography.Paragraph>
      <Table size="small" loading={isLoading} rowKey="place" pagination={false} dataSource={data?.entries ?? []}
        columns={[
          { title: '#', dataIndex: 'place', width: 60 },
          { title: 'Tên hiển thị', dataIndex: 'name' },
          { title: 'Hạng', dataIndex: 'rankName' },
          { title: 'Sao', dataIndex: 'stars', align: 'right' },
          { title: 'Sao tăng ròng', dataIndex: 'netStars', align: 'right', render: v => (type === 'week' || type === 'month' ? v : '-') },
        ]} />
    </>
  )
}

function SettlementsTab() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['admin-quiz-settlements'], queryFn: () => client.get('/admin/quiz/settlements').then(r => r.data?.data ?? []) })
  const settle = useMutation({
    mutationFn: period => client.post('/admin/quiz/settlements', { period }).then(r => r.data),
    onSuccess: res => {
      if (res.resultCode !== 1) return message.error(res.message)
      message.success('Đã tổng kết và trao thưởng')
      qc.invalidateQueries({ queryKey: ['admin-quiz-settlements'] })
    },
  })
  return (
    <>
      <Alert type="info" showIcon style={{ marginBottom: 12 }}
        message="Top 3 của mỗi tuần (thứ Hai 00:05) và mỗi tháng (ngày 1, 00:10) được trao thưởng tự động nếu bật trong Cấu hình. Nút bên dưới trao thưởng ngay một kỳ đã kết thúc, mỗi kỳ chỉ trao một lần." />
      <Table size="small" loading={isLoading} rowKey="period" pagination={false} dataSource={data ?? []}
        columns={[
          { title: 'Kỳ', dataIndex: 'label', render: (v, r) => <span>{v} <Typography.Text type="secondary">({r.period})</Typography.Text></span> },
          { title: 'Trạng thái', render: (_, r) => (r.settled ? <Tag color="green">{r.mode === 'auto' ? 'Đã trao (tự động)' : 'Đã trao (tay)'} {fmtDateTime(r.settledAt)}</Tag> : <Tag>Chưa trao</Tag>) },
          {
            title: 'Top 3',
            render: (_, r) => (r.settled
              ? r.winners.map(w => <div key={w.place}>#{w.place} {w.name} (+{w.netStars} sao){w.reward ? `: ${w.reward}` : ''}</div>)
              : (r.preview.length ? r.preview.map((w, i) => <div key={i}>#{i + 1} {w.name} (+{w.netStars} sao)</div>) : <Typography.Text type="secondary">Chưa có ai</Typography.Text>)),
          },
          {
            title: '',
            render: (_, r) => (!r.settled && r.preview.length > 0
              ? <Popconfirm title={`Trao thưởng top 3 ${r.label}?`} okText="Trao thưởng" cancelText="Thôi" onConfirm={() => settle.mutate(r.period)}><Button size="small" type="primary">Trao thưởng</Button></Popconfirm>
              : null),
          },
        ]} />
    </>
  )
}

function FlaggedTab() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['admin-quiz-flagged'], queryFn: () => client.get('/admin/quiz/flagged').then(r => r.data?.data ?? []) })
  const refresh = () => { qc.invalidateQueries({ queryKey: ['admin-quiz-flagged'] }); qc.invalidateQueries({ queryKey: ['admin-quiz-overview'] }); qc.invalidateQueries({ queryKey: ['admin-badges'] }) }
  const clear = useMutation({ mutationFn: id => client.put(`/admin/quiz/attempts/${id}/clear`).then(r => r.data), onSuccess: refresh })
  const block = useMutation({
    mutationFn: ({ userId, blocked }) => client.put(`/admin/quiz/users/${userId}/board-block`, { blocked }).then(r => r.data),
    onSuccess: () => { message.success('Đã cập nhật'); refresh() },
  })
  return (
    <>
      <Typography.Paragraph type="secondary">Câu bị gắn cờ khi người chơi trả lời đúng dưới 1,5 giây hoặc rời trang giữa chừng. Chỉ cảnh báo, hệ thống không tự cấm. Câu bị gắn cờ không được cộng vào bảng tuần và tháng. "Bỏ cờ" khi bạn thấy không có vấn đề, "Chặn BXH" để người đó không lên bảng và không nhận thưởng top.</Typography.Paragraph>
      <Table size="small" loading={isLoading} rowKey="id" dataSource={data ?? []} scroll={{ x: 900 }}
        columns={[
          { title: 'Thời điểm', dataIndex: 'issuedAt', render: fmtDateTime, width: 150 },
          { title: 'Người chơi', render: (_, r) => <span>{r.userName} <Typography.Text type="secondary">{r.userPhone}</Typography.Text></span> },
          { title: 'Câu hỏi', dataIndex: 'question', ellipsis: true },
          { title: 'Kết quả', dataIndex: 'outcome', render: v => OUTCOMES[v] ?? v, width: 80 },
          { title: 'Thời gian trả lời', dataIndex: 'answerMs', width: 130, render: v => (v == null ? '-' : `${(v / 1000).toFixed(1)} giây`) },
          { title: 'Số lần gắn cờ', dataIndex: 'userFlagged', width: 110, align: 'right' },
          {
            title: '',
            width: 220,
            render: (_, r) => (
              <Space>
                <Button size="small" onClick={() => clear.mutate(r.id)}>Bỏ cờ</Button>
                <Button size="small" danger={!r.blocked} onClick={() => block.mutate({ userId: r.userId, blocked: !r.blocked })}>{r.blocked ? 'Bỏ chặn BXH' : 'Chặn BXH'}</Button>
              </Space>
            ),
          },
        ]} />
    </>
  )
}

export default function QuizGame() {
  const navigate = useNavigate()
  return (
    <div style={{ padding: 24 }}>
      <Button type="link" icon={<ArrowLeftOutlined />} style={{ padding: 0, marginBottom: 8 }} onClick={() => navigate('/fun-events')}>Sự kiện game</Button>
      <Typography.Title level={4} style={{ marginTop: 0 }}>Quiz Leo rank</Typography.Title>
      <Tabs
        items={[
          { key: 'overview', label: 'Tổng quan', children: <OverviewTab /> },
          { key: 'board', label: 'Bảng xếp hạng', children: <BoardTab /> },
          { key: 'settlements', label: 'Tổng kết & thưởng', children: <SettlementsTab /> },
          { key: 'flagged', label: 'Gắn cờ', children: <FlaggedTab /> },
          { key: 'settings', label: 'Cấu hình', children: <SettingsTab /> },
        ]}
      />
    </div>
  )
}
