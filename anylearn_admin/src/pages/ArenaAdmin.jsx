import { Alert, Button, Card, Checkbox, Col, DatePicker, Flex, Form, Input, InputNumber, Popconfirm, Row, Select, Space, Statistic, Switch, Table, Tabs, Tag, Typography, message } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import { fmtDateTime } from '../utils/format'

const STATUS = {
  waiting: ['Chưa bắt đầu', 'orange'], scheduled: ['Chờ mở phòng', 'blue'], live: ['Đang chạy', 'green'], done: ['Đã xong', 'default'], cancelled: ['Đã hủy', 'red'],
}
const PHASE_TEXT = {
  before: 'Chưa mở phòng', open: 'Phòng đã mở, chờ câu 1', countdown: 'Đang đếm ngược', question: 'Đang có câu hỏi', reveal: 'Đang xem đáp án', lobby: 'Giữa hai câu', ended: 'Đã kết thúc',
}
const DAYS = [[1, 'Thứ Hai'], [2, 'Thứ Ba'], [3, 'Thứ Tư'], [4, 'Thứ Năm'], [5, 'Thứ Sáu'], [6, 'Thứ Bảy'], [7, 'Chủ nhật']]
const LEVELS = [[1, 'Rất dễ'], [2, 'Dễ'], [3, 'Vừa'], [4, 'Khó'], [5, 'Rất khó']]
const csv = v => String(v ?? '').split(',').map(s => s.trim()).filter(Boolean)

function useAdminGet(key, url, options = {}) {
  return useQuery({ queryKey: key, queryFn: () => client.get(url).then(r => r.data?.data ?? null), ...options })
}

function Live({ onGoQuestions }) {
  const qc = useQueryClient()
  const { data, isLoading } = useAdminGet(['admin-arena-overview'], '/admin/arena/overview', { refetchInterval: 5000 })
  const s = data?.session
  const act = useMutation({
    mutationFn: ({ url }) => client.post(url).then(r => r.data),
    onSuccess: res => {
      if (res.resultCode !== 1) return message.error(res.message)
      message.success('Đã xong')
      qc.invalidateQueries({ queryKey: ['admin-arena-overview'] })
    },
  })
  const [statusText, color] = STATUS[s?.status] ?? [s?.status, 'default']
  const phaseText = s ? (s.phase === 'question' ? `Câu ${s.qNo}/${s.questionCount} đang mở, còn ${s.secondsLeft ?? 0} giây` : s.phase === 'countdown' ? `Đếm ngược câu ${s.qNo}` : PHASE_TEXT[s.phase]) : ''
  const canSettle = s && s.status !== 'cancelled' && s.phase === 'ended' && !s.settledAt

  const qCols = [
    { title: 'Câu', dataIndex: 'qNo', width: 56 },
    { title: 'Giờ', dataIndex: 'at', width: 90, render: v => new Date(v).toLocaleTimeString('vi-VN') },
    { title: 'Chủ đề · mức', render: (_, r) => `${r.topic} · ${r.levelLabel}` },
    { title: 'Trả lời', dataIndex: 'answers', align: 'right', width: 80 },
    { title: 'Đúng', dataIndex: 'correctPct', align: 'right', width: 70, render: v => (v == null ? '–' : `${v}%`) },
    { title: 'TB giây', dataIndex: 'avgSeconds', align: 'right', width: 80, render: v => (v == null ? '–' : String(v).replace('.', ',')) },
    { title: 'Trạng thái', dataIndex: 'state', width: 100, render: v => (v === 'live' ? <Tag color="green">Đang mở</Tag> : v === 'done' ? <Tag>Xong</Tag> : <Tag color="blue">Chờ</Tag>) },
  ]
  const tCols = [
    { title: '#', dataIndex: 'rank', width: 50 },
    { title: 'Người chơi', render: (_, r) => <span>{r.name} <span style={{ color: '#999' }}>{r.phone}</span> {r.flagged && <Tag color="red">cờ</Tag>}</span> },
    { title: 'Điểm', dataIndex: 'score', align: 'right', width: 70 },
    { title: 'Giây', dataIndex: 'correctMs', align: 'right', width: 80, render: v => (v / 1000).toFixed(1).replace('.', ',') },
  ]

  if (!isLoading && !s) return <Alert type="warning" showIcon message={data?.warning ?? 'Chưa có trận nào.'} />
  return (
    <div>
      {data?.warning && <Alert type="warning" showIcon style={{ marginBottom: 12 }} message={data.warning} />}
      {s && (
        <Flex align="center" gap={12} wrap style={{ background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 10, padding: '10px 12px', marginBottom: 14 }}>
          <Tag color={color}>{statusText}</Tag>
          <b>Ngày {s.day}</b>
          <span>{phaseText}</span>
          <span>Giờ bắt đầu {new Date(s.startsAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
          <span style={{ flex: 1 }} />
          <Button onClick={() => window.open('/fun/arena', '_blank')}>Xem như người chơi</Button>
          {canSettle && <Popconfirm title="Chốt trận và trao quà ngay?" okText="Chốt" cancelText="Không" onConfirm={() => act.mutate({ url: `/admin/arena/sessions/${s.id}/settle` })}><Button type="primary">Chốt trận thủ công</Button></Popconfirm>}
          {(s.status === 'scheduled' || s.status === 'live') && (
            <Popconfirm title="Hủy trận này? Không ai nhận quà." okText="Hủy trận" cancelText="Không" okButtonProps={{ danger: true }} onConfirm={() => act.mutate({ url: `/admin/arena/sessions/${s.id}/cancel` })}>
              <Button danger>Dừng trận hôm nay</Button>
            </Popconfirm>
          )}
        </Flex>
      )}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}><Card size="small"><Statistic title="Đã nhấn Nhắc tôi" value={s?.registered ?? 0} /></Card></Col>
        <Col xs={12} md={6}><Card size="small"><Statistic title="Đang trong phòng" value={s?.inRoom ?? 0} /></Card></Col>
        <Col xs={12} md={6}><Card size="small"><Statistic title={s?.qNo ? `Đã trả lời câu ${s.qNo}` : 'Đã trả lời'} value={s?.answeredCurrent ?? 0} /></Card></Col>
        <Col xs={12} md={6}><Card size="small"><Statistic title="Đúng ở câu hiện tại" value={s?.correctRate ?? 0} suffix="%" /></Card></Col>
      </Row>
      {data?.reminders && (
        <Typography.Paragraph type="secondary">
          Thông báo nhắc: {data.reminders.sentAt ? `đã gửi lúc ${fmtDateTime(data.reminders.sentAt)} cho ${data.reminders.reminded} người` : 'chưa gửi'}
          {' '}· kênh: {[data.reminders.app && 'app', data.reminders.email && 'email', data.reminders.zns && 'ZNS'].filter(Boolean).join(', ') || 'không kênh nào bật'}.
        </Typography.Paragraph>
      )}
      <Row gutter={16}>
        <Col xs={24} lg={14}>
          <Flex justify="space-between"><Typography.Title level={5}>Từng câu</Typography.Title><Button type="link" onClick={onGoQuestions}>Đổi câu hỏi</Button></Flex>
          <Table size="small" rowKey="qNo" columns={qCols} dataSource={data?.questions ?? []} pagination={false} scroll={{ x: 560, y: 360 }} loading={isLoading} />
        </Col>
        <Col xs={24} lg={10}>
          <Typography.Title level={5}>Top hiện tại</Typography.Title>
          <Table size="small" rowKey="userId" columns={tCols} dataSource={data?.top ?? []} pagination={false} scroll={{ x: 320 }} loading={isLoading} />
        </Col>
      </Row>
    </div>
  )
}

function Config() {
  const qc = useQueryClient()
  const [form] = Form.useForm()
  const { data, isLoading } = useAdminGet(['admin-arena-settings'], '/admin/arena/settings')
  useEffect(() => {
    if (!data) return
    const v = { ...data.values }
    v.days = csv(v.days).map(Number)
    v.levels = csv(v.levels).map(Number)
    v.topics = csv(v.topics)
    form.setFieldsValue(v)
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
    mutationFn: values => {
      const body = { ...values, days: (values.days ?? []).join(','), levels: (values.levels ?? []).join(','), topics: (values.topics ?? []).join(',') }
      return client.put('/admin/arena/settings', body).then(r => r.data)
    },
    onSuccess: res => {
      if (res.resultCode !== 1) return message.error(res.message)
      message.success('Đã lưu cấu hình Đấu trường')
      qc.invalidateQueries({ queryKey: ['admin-arena-settings'] })
      qc.invalidateQueries({ queryKey: ['admin-arena-overview'] })
    },
  })
  const test = useMutation({
    mutationFn: () => client.post('/admin/arena/settings/test-notification').then(r => r.data),
    onSuccess: res => (res.resultCode === 1 ? message.success('Đã gửi thử cho bạn (nhớ lưu trước nếu vừa sửa kênh)') : message.error(res.message)),
  })

  const control = f => {
    if (f.key === 'days') return <Checkbox.Group options={DAYS.map(([value, label]) => ({ value, label }))} />
    if (f.key === 'levels') return <Checkbox.Group options={LEVELS.map(([value, label]) => ({ value, label }))} />
    if (f.key === 'topics') return <Select mode="multiple" allowClear placeholder="Mọi chủ đề đang bật" options={(data?.topics ?? []).map(t => ({ value: t.key, label: t.label }))} />
    if (f.type === 'bool') return <Switch />
    if (f.type === 'int') return <InputNumber min={f.min} max={f.max} style={{ width: '100%' }} />
    return f.key === 'notify_body' ? <Input.TextArea rows={2} /> : <Input />
  }

  return (
    <Form form={form} layout="vertical" onFinish={values => save.mutate(values)} disabled={isLoading}>
      {groups.map(g => (
        <Card key={g.name} size="small" title={g.name} style={{ marginBottom: 12 }}>
          {g.name === 'Câu hỏi' && data?.plan && <Alert type="info" showIcon style={{ marginBottom: 12 }} message={`Bộ câu mỗi trận: ${data.plan}`} />}
          <Row gutter={16}>
            {g.fields.map(f => (
              <Col xs={24} md={['days', 'levels', 'topics', 'notify_body', 'notify_title'].includes(f.key) ? 24 : 12} key={f.key}>
                <Form.Item name={f.key} label={f.label} valuePropName={f.type === 'bool' ? 'checked' : 'value'}
                  extra={f.type === 'int' ? `Mặc định ${f.def}, từ ${f.min} đến ${f.max}` : f.type === 'csv' && f.max > 0 && !['days', 'levels'].includes(f.key) ? `Mặc định ${f.def}` : undefined}>
                  {control(f)}
                </Form.Item>
              </Col>
            ))}
          </Row>
          {g.name === 'Thông báo' && <Button onClick={() => test.mutate()} loading={test.isPending}>Gửi thử cho tôi</Button>}
          {g.name === 'Thông báo' && <Typography.Paragraph type="secondary" style={{ margin: '8px 0 0' }}>ZNS chỉ gửi khi có mã mẫu đã được Zalo duyệt (xem docs/zns-templates.md, mẫu &quot;Nhắc Đấu trường Leo&quot;). Chưa có thì chỉ ghi log, không gửi.</Typography.Paragraph>}
        </Card>
      ))}
      <Button type="primary" htmlType="submit" loading={save.isPending}>Lưu cấu hình</Button>
    </Form>
  )
}

function Questions() {
  const { data: overview } = useAdminGet(['admin-arena-overview'], '/admin/arena/overview')
  const rooms = overview?.session
  if (!rooms?.id) return <Alert type="warning" showIcon message="Chưa có trận nào." />
  return <QuestionsPanel id={rooms.id} intro={<>Trận ngày <b>{rooms.day}</b>. Mỗi câu khóa lại khi bắt đầu đếm ngược của câu đó.</>} canRepick={rooms.status === 'scheduled' && rooms.phase === 'before'} />
}

/** The question table of one session: swap a question for another of the same level and topic, or by id; pick the whole set again when allowed. */
function QuestionsPanel({ id, intro, canRepick }) {
  const qc = useQueryClient()
  const { data, isLoading } = useAdminGet(['admin-arena-session', id], `/admin/arena/sessions/${id}`, { enabled: !!id, refetchInterval: 10000 })
  const [pick, setPick] = useState({})
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-arena-session', id] })
  const replace = useMutation({
    mutationFn: ({ qNo, questionId }) => client.put(`/admin/arena/sessions/${id}/questions/${qNo}`, questionId ? { questionId } : {}).then(r => r.data),
    onSuccess: res => (res.resultCode === 1 ? (message.success('Đã đổi câu'), refresh()) : message.error(res.message)),
  })
  const repick = useMutation({
    mutationFn: () => client.post(`/admin/arena/sessions/${id}/repick`).then(r => r.data),
    onSuccess: res => (res.resultCode === 1 ? (message.success('Đã chọn lại cả trận'), refresh()) : message.error(res.message)),
  })
  const columns = [
    { title: 'Câu', dataIndex: 'qNo', width: 56 },
    { title: 'Giờ', dataIndex: 'at', width: 80, render: v => new Date(v).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) },
    { title: 'Câu hỏi', render: (_, r) => (
      <div style={{ whiteSpace: 'normal', minWidth: 260 }}>
        <div><b>{r.body}</b></div>
        <div style={{ fontSize: 12, color: '#666' }}>{['A', 'B', 'C', 'D'].map((l, i) => <span key={l} style={{ marginRight: 10, fontWeight: i === r.correct ? 700 : 400, color: i === r.correct ? '#389e0d' : undefined }}>{l}. {r[['a', 'b', 'c', 'd'][i]]}</span>)}</div>
      </div>
    ) },
    { title: 'Chủ đề · mức', width: 150, render: (_, r) => `${r.topic} · ${r.levelLabel}` },
    { title: 'Mã', dataIndex: 'questionId', width: 70 },
    { title: '', width: 230, render: (_, r) => r.locked ? <Tag>Đã khóa</Tag> : (
      <Space size={4}>
        <Button size="small" onClick={() => replace.mutate({ qNo: r.qNo })}>Đổi câu khác</Button>
        <InputNumber size="small" placeholder="Mã" style={{ width: 72 }} controls={false} value={pick[r.qNo]} onChange={v => setPick(p => ({ ...p, [r.qNo]: v }))} />
        <Button size="small" disabled={!pick[r.qNo]} onClick={() => replace.mutate({ qNo: r.qNo, questionId: pick[r.qNo] })}>Dùng mã</Button>
      </Space>
    ) },
  ]
  return (
    <div>
      <Flex justify="space-between" align="center" style={{ marginBottom: 8 }} wrap gap={8}>
        <Typography.Text>{intro}</Typography.Text>
        <Popconfirm title="Chọn lại toàn bộ câu hỏi của trận?" okText="Chọn lại" cancelText="Không" onConfirm={() => repick.mutate()} disabled={!canRepick}>
          <Button disabled={!canRepick} loading={repick.isPending}>Chọn lại cả trận</Button>
        </Popconfirm>
      </Flex>
      <Table size="small" rowKey="qNo" columns={columns} dataSource={data?.questions ?? []} pagination={false} loading={isLoading} scroll={{ x: 900 }} />
    </div>
  )
}

const CUSTOM_PHASE = { ...PHASE_TEXT, before: 'Phòng đang mở, chờ bắt đầu', open: 'Đếm ngược 1 phút trước câu 1' }

/** "Đấu trường riêng": the arena the back office creates, starts and closes by hand. */
function Custom() {
  const qc = useQueryClient()
  const { data, isLoading } = useAdminGet(['admin-arena-custom'], '/admin/arena/custom', { refetchInterval: 5000 })
  const [form] = Form.useForm()
  const s = data?.session
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-arena-custom'] })
  const call = useMutation({
    mutationFn: ({ method = 'post', url, body }) => client[method](url, body).then(r => r.data),
    onSuccess: (res, v) => {
      if (res.resultCode !== 1) return message.error(res.message)
      message.success(v.done ?? 'Đã xong')
      if (v.reset) form.resetFields()
      refresh()
    },
  })

  const create = values => call.mutate({
    url: '/admin/arena/custom', done: 'Đã tạo đấu trường riêng, banner cam đã hiện ở trang Vui học', reset: true,
    body: { title: values.title, expectedAt: values.expectedAt ? values.expectedAt.valueOf() : null, questionCount: values.questionCount, answerSeconds: values.answerSeconds },
  })

  if (!isLoading && !s) {
    return (
      <div>
        <Alert type="info" showIcon style={{ marginBottom: 16 }}
          message="Tạo một trận riêng (cho một lớp, một sự kiện…). Banner màu cam hiện ngay ở trang Vui học, phía trên banner tự động; người chơi vào phòng chờ được liền. Bạn bấm Bắt đầu khi sẵn sàng, sau đó có 1 phút đếm ngược rồi vào câu 1. Bảng xếp hạng chỉ có người chơi trận này, không tự trao quà." />
        <Form form={form} layout="vertical" onFinish={create} initialValues={{ questionCount: 20, answerSeconds: 15 }} style={{ maxWidth: 520 }}>
          <Form.Item name="title" label="Tên đấu trường (hiện trên banner)" rules={[{ required: true, message: 'Nhập tên' }]}><Input maxLength={80} placeholder="Ví dụ: Thi đấu lớp Sao Mai" showCount /></Form.Item>
          <Form.Item name="expectedAt" label="Thời gian dự kiến bắt đầu (chỉ để thông báo, không tự chạy)"><DatePicker showTime={{ format: 'HH:mm' }} format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} /></Form.Item>
          <Flex gap={12}>
            <Form.Item name="questionCount" label="Số câu hỏi" rules={[{ required: true }]}><InputNumber min={3} max={50} /></Form.Item>
            <Form.Item name="answerSeconds" label="Giây trả lời mỗi câu" rules={[{ required: true }]}><InputNumber min={5} max={120} /></Form.Item>
          </Flex>
          <Button type="primary" htmlType="submit" loading={call.isPending}>Tạo đấu trường riêng</Button>
        </Form>
        {(data?.history ?? []).length > 0 && (
          <Card size="small" title="Các đấu trường riêng gần đây" style={{ marginTop: 20 }}>
            <Table size="small" rowKey="id" pagination={false} dataSource={data.history}
              columns={[{ title: 'Tên', dataIndex: 'title' }, { title: 'Ngày', dataIndex: 'day', width: 110 }, { title: 'Người chơi', dataIndex: 'players', width: 100, align: 'right' }, { title: 'Trạng thái', dataIndex: 'status', width: 120, render: v => <Tag>{v === 'cancelled' ? 'Đã đóng' : (STATUS[v] ?? [v])[0]}</Tag> }]} />
          </Card>
        )}
      </div>
    )
  }
  if (!s) return null
  const [statusText, color] = s.waiting ? STATUS.waiting : (STATUS[s.status] ?? [s.status, 'default'])
  const phaseText = s.waiting ? 'Chờ bạn bấm Bắt đầu' : s.phase === 'question' ? `Câu ${s.qNo}/${s.questionCount} đang mở, còn ${s.secondsLeft ?? 0} giây` : s.phase === 'countdown' ? `Đếm ngược câu ${s.qNo}` : CUSTOM_PHASE[s.phase]
  const tCols = [
    { title: '#', dataIndex: 'rank', width: 50 },
    { title: 'Người chơi', render: (_, r) => <span>{r.name} <span style={{ color: '#999' }}>{r.phone}</span> {r.flagged && <Tag color="red">cờ</Tag>}</span> },
    { title: 'Điểm', dataIndex: 'score', align: 'right', width: 70 },
    { title: 'Giây', dataIndex: 'correctMs', align: 'right', width: 80, render: v => (v / 1000).toFixed(1).replace('.', ',') },
  ]
  return (
    <div>
      <Flex align="center" gap={12} wrap style={{ background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 10, padding: '10px 12px', marginBottom: 14 }}>
        <Tag color={color}>{statusText}</Tag>
        <b>{s.title}</b>
        {s.expectedAt && <span>Dự kiến {fmtDateTime(s.expectedAt)}</span>}
        <span>{phaseText}</span>
        {!s.waiting && <span>Câu 1 lúc {new Date(s.startsAt).toLocaleTimeString('vi-VN')}</span>}
        <span style={{ flex: 1 }} />
        <Button onClick={() => window.open(`/fun/arena?custom=${s.id}`, '_blank')}>Xem như người chơi</Button>
        {s.waiting && (
          <Popconfirm title="Bắt đầu ngay? Có 1 phút đếm ngược rồi vào câu 1, không đổi câu hỏi được nữa." okText="Bắt đầu" cancelText="Không" onConfirm={() => call.mutate({ url: `/admin/arena/custom/${s.id}/start`, done: 'Đã bắt đầu, còn 1 phút' })}>
            <Button type="primary" loading={call.isPending}>Bắt đầu (đếm ngược 1 phút)</Button>
          </Popconfirm>
        )}
        <Popconfirm title="Đóng đấu trường? Banner biến mất và những người đang trong phòng bị đưa về trang Vui học." okText="Đóng" cancelText="Không" okButtonProps={{ danger: true }} onConfirm={() => call.mutate({ url: `/admin/arena/custom/${s.id}/close`, done: 'Đã đóng đấu trường riêng' })}>
          <Button danger>Đóng đấu trường</Button>
        </Popconfirm>
      </Flex>
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}><Card size="small"><Statistic title="Đang trong phòng" value={s.inRoom ?? 0} /></Card></Col>
        <Col xs={12} md={6}><Card size="small"><Statistic title="Đã trả lời" value={s.players ?? 0} /></Card></Col>
        <Col xs={12} md={6}><Card size="small"><Statistic title={s.qNo ? `Trả lời câu ${s.qNo}` : 'Trả lời câu hiện tại'} value={s.answeredCurrent ?? 0} /></Card></Col>
        <Col xs={12} md={6}><Card size="small"><Statistic title="Đúng ở câu hiện tại" value={s.correctRate ?? 0} suffix="%" /></Card></Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} lg={15}>
          <Typography.Title level={5}>Câu hỏi</Typography.Title>
          <QuestionsPanel id={s.id} intro={s.waiting ? 'Đổi câu hoặc chọn lại cả bộ trước khi bắt đầu.' : 'Mỗi câu khóa lại khi bắt đầu đếm ngược của câu đó.'} canRepick={s.waiting} />
        </Col>
        <Col xs={24} lg={9}>
          <Typography.Title level={5}>Bảng xếp hạng (chỉ trận này)</Typography.Title>
          <Table size="small" rowKey="userId" columns={tCols} dataSource={data?.top ?? []} pagination={false} scroll={{ x: 320 }} />
        </Col>
      </Row>
    </div>
  )
}

function History() {
  const [page, setPage] = useState(0)
  const [open, setOpen] = useState(null)
  const { data, isLoading } = useAdminGet(['admin-arena-sessions', page], `/admin/arena/sessions?page=${page}`)
  const { data: detail } = useAdminGet(['admin-arena-session', open], `/admin/arena/sessions/${open}`, { enabled: !!open })
  const columns = [
    { title: 'Ngày', dataIndex: 'day', width: 110 },
    { title: 'Loại', width: 150, render: (_, r) => (r.kind === 'custom' ? <Tag color="orange">Riêng: {r.title}</Tag> : <Tag color="green">Tự động</Tag>) },
    { title: 'Trạng thái', dataIndex: 'status', width: 120, render: v => <Tag color={(STATUS[v] ?? [])[1]}>{(STATUS[v] ?? [v])[0]}</Tag> },
    { title: 'Nhắc tôi', dataIndex: 'registered', align: 'right', width: 90 },
    { title: 'Người chơi', dataIndex: 'players', align: 'right', width: 100 },
    { title: 'Chơi hết', dataIndex: 'finishedAll', align: 'right', width: 90 },
    { title: 'Đúng TB', dataIndex: 'avgScore', align: 'right', width: 90, render: (v, r) => (v == null ? '–' : `${String(v).replace('.', ',')}/${r.questionCount}`) },
    { title: 'Top 1', dataIndex: 'top1', render: v => v ?? '–' },
    { title: 'Quà', width: 140, render: (_, r) => (r.settled ? <Tag color="green">Đã trao ({r.rewarded})</Tag> : <Tag>Chưa trao</Tag>) },
    { title: '', width: 90, render: (_, r) => <Button size="small" onClick={() => setOpen(open === r.id ? null : r.id)}>Xem bảng</Button> },
  ]
  return (
    <div>
      <Table size="small" rowKey="id" columns={columns} dataSource={data?.rows ?? []} loading={isLoading} scroll={{ x: 900 }}
        pagination={{ current: page + 1, pageSize: data?.size ?? 20, total: data?.total ?? 0, onChange: p => setPage(p - 1), showSizeChanger: false }} />
      {open && (
        <Card size="small" title={`Bảng trận ${detail?.session?.day ?? ''}`} style={{ marginTop: 12 }}>
          <Table size="small" rowKey="userId" pagination={{ pageSize: 20 }} dataSource={detail?.top ?? []}
            columns={[
              { title: '#', dataIndex: 'rank', width: 50 },
              { title: 'Người chơi', render: (_, r) => <span>{r.name} <span style={{ color: '#999' }}>{r.phone}</span> {r.flagged && <Tag color="red">cờ</Tag>}</span> },
              { title: 'Điểm', dataIndex: 'score', align: 'right', width: 70 },
              { title: 'Giây', dataIndex: 'correctMs', align: 'right', width: 80, render: v => (v / 1000).toFixed(1).replace('.', ',') },
            ]} />
        </Card>
      )}
    </div>
  )
}

function Flags() {
  const qc = useQueryClient()
  const { data, isLoading } = useAdminGet(['admin-arena-flags'], '/admin/arena/flags')
  const act = useMutation({
    mutationFn: ({ r, what }) => client.post(`/admin/arena/sessions/${r.sessionId}/entries/${r.userId}/${what}`).then(x => x.data),
    onSuccess: res => {
      if (res.resultCode !== 1) return message.error(res.message)
      message.success('Đã xử lý')
      qc.invalidateQueries({ queryKey: ['admin-arena-flags'] })
      qc.invalidateQueries({ queryKey: ['admin-badges'] })
    },
  })
  const columns = [
    { title: 'Ngày', dataIndex: 'day', width: 110 },
    { title: 'Người chơi', render: (_, r) => <span>{r.name} <span style={{ color: '#999' }}>{r.phone}</span></span> },
    { title: 'Hạng', dataIndex: 'rank', width: 70, render: v => v ?? '–' },
    { title: 'Điểm', dataIndex: 'score', width: 70, align: 'right' },
    { title: 'Lý do', dataIndex: 'reason' },
    { title: 'Tình trạng', width: 150, render: (_, r) => (r.disqualified ? <Tag color="red">Đã loại</Tag> : r.waiting ? <Tag color="orange">Quà đang chờ</Tag> : <Tag>Chỉ ghi nhận</Tag>) },
    { title: '', width: 260, render: (_, r) => r.disqualified ? null : (
      <Space>
        <Popconfirm title="Bỏ cờ và trao quà (nếu đang chờ)?" okText="Đồng ý" cancelText="Không" onConfirm={() => act.mutate({ r, what: 'clear' })}><Button size="small" type="primary">Bỏ cờ, trao quà</Button></Popconfirm>
        <Popconfirm title="Loại người này khỏi bảng xếp hạng của trận?" okText="Loại" cancelText="Không" okButtonProps={{ danger: true }} onConfirm={() => act.mutate({ r, what: 'disqualify' })}><Button size="small" danger>Loại khỏi BXH</Button></Popconfirm>
      </Space>
    ) },
  ]
  return <Table size="small" rowKey={r => `${r.sessionId}-${r.userId}`} columns={columns} dataSource={data ?? []} loading={isLoading} scroll={{ x: 900 }} pagination={{ pageSize: 20 }} />
}

/** Đấu trường Leo (plan 18): live view of today, every setting, the questions, the history and the flagged players. */
export default function ArenaAdmin() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [tab, setTab] = useState('live')
  const { data: settings } = useAdminGet(['admin-arena-settings'], '/admin/arena/settings')
  const { data: badges } = useQuery({ queryKey: ['admin-badges'], queryFn: () => client.get('/admin/badges').then(r => r.data?.data ?? {}), refetchInterval: 60000 })
  const toggle = useMutation({
    mutationFn: enabled => client.put('/admin/arena/settings', { enabled }).then(r => r.data),
    onSuccess: res => {
      if (res.resultCode !== 1) return message.error(res.message)
      qc.invalidateQueries({ queryKey: ['admin-arena-settings'] })
      qc.invalidateQueries({ queryKey: ['admin-arena-overview'] })
    },
  })
  const { data: access } = useQuery({ queryKey: ['admin-fun-access'], queryFn: () => client.get('/admin/fun/access').then(r => r.data?.data ?? null) })
  const setMode = useMutation({
    mutationFn: mode => client.put('/admin/fun/access', { modes: { arena: mode } }).then(r => r.data),
    onSuccess: res => {
      if (res.resultCode !== 1) return message.error(res.message)
      message.success('Đã lưu chế độ mở')
      qc.invalidateQueries({ queryKey: ['admin-fun-access'] })
    },
  })
  const flagged = badges?.arenaFlagged ?? 0
  const items = [
    { key: 'custom', label: 'Đấu trường riêng', children: <Custom /> },
    { key: 'live', label: 'Theo dõi hôm nay', children: <Live onGoQuestions={() => setTab('questions')} /> },
    { key: 'config', label: 'Cấu hình', children: <Config /> },
    { key: 'questions', label: 'Câu hỏi hôm nay', children: <Questions /> },
    { key: 'history', label: 'Lịch sử', children: <History /> },
    { key: 'flags', label: <span>Gắn cờ {flagged > 0 && <Tag color="red">{flagged}</Tag>}</span>, children: <Flags /> },
  ]
  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 8 }}>
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/fun-events')}>Vui học</Button>
      </Space>
      <Flex justify="space-between" align="center" wrap gap={8}>
        <Typography.Title level={4} style={{ marginTop: 0 }}>Đấu trường Leo</Typography.Title>
        <Flex align="center" gap={8}>
          <span>Bật chức năng</span>
          <Switch checked={settings?.values?.enabled ?? false} loading={toggle.isPending} onChange={v => toggle.mutate(v)} />
          <Select style={{ width: 230 }} value={access?.modes?.arena ?? 'all'} onChange={v => setMode.mutate(v)} loading={setMode.isPending}
            options={[{ value: 'all', label: 'Mở cho mọi người' }, { value: 'testers', label: 'Chỉ nhóm thử' }, { value: 'off', label: 'Đóng (admin vẫn vào được)' }]} />
        </Flex>
      </Flex>
      <Typography.Paragraph type="secondary">Mỗi ngày hệ thống tự tạo trận, mở phòng, gửi nhắc, chấm điểm và trao quà. Bạn chỉ cần theo dõi và chỉnh khi muốn. "Chỉ nhóm thử" dùng danh sách số điện thoại ở trang Vui học, mục "Mở dần từng game".</Typography.Paragraph>
      <Tabs activeKey={tab} onChange={setTab} items={items} destroyInactiveTabPane />
    </div>
  )
}
