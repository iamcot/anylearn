import { Alert, Button, Card, Checkbox, Form, Input, InputNumber, Modal, Popconfirm, Radio, Select, Space, Switch, Table, Tag, Typography, message } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'

const STATUS = { pending: ['Chờ duyệt', 'gold'], active: ['Đang dùng', 'green'], hidden: ['Đã ẩn', 'default'] }
const pct = v => (v == null ? '–' : `${Math.round(v * 100)}%`)

function Matrix({ data, onGenerate, generating }) {
  const levels = data?.levels ?? []
  const topics = (data?.topics ?? []).filter(t => t.active)
  const byKey = Object.fromEntries((data?.cells ?? []).map(c => [`${c.topic}:${c.difficulty}`, c]))
  const columns = [
    { title: 'Chủ đề', dataIndex: 'label', width: 170, render: v => <b>{v}</b> },
    ...levels.map(level => ({
      title: level.label,
      render: (_, topic) => {
        const cell = byKey[`${topic.key}:${level.value}`]
        if (!cell) return null
        const key = `${cell.topic}:${cell.difficulty}`
        return (
          <div>
            <span style={{ color: cell.active >= cell.target ? '#2f9e44' : '#e8590c', fontWeight: 600 }}>{cell.active}/{cell.target}</span>
            {cell.pending > 0 && <Tag color="gold" style={{ marginLeft: 6 }}>{cell.pending} chờ</Tag>}
            <div style={{ fontSize: 12, color: '#888' }}>
              {cell.served ? `đúng ${pct(cell.correctRate)}` : 'chưa ai chơi'}{cell.returned ? ` · trùng ${pct(cell.duplicateRate)}` : ''}
            </div>
            <Button size="small" type="link" style={{ padding: 0 }} disabled={cell.shortfall <= 0} loading={generating.includes(key)}
              onClick={() => onGenerate(cell.topic, cell.difficulty, Math.min(cell.shortfall, data.settings.batchSize))}>
              {cell.shortfall > 0 ? `Tạo thêm (thiếu ${cell.shortfall})` : 'Đủ'}
            </Button>
          </div>
        )
      },
    })),
  ]
  return <Table size="small" pagination={false} rowKey="key" dataSource={topics} columns={columns} scroll={{ x: 900 }} />
}

function TopicsCard({ topics }) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(null) // topic being edited, {} = new
  const [form] = Form.useForm()
  useEffect(() => { if (editing) form.setFieldsValue({ label: '', hint: '', sortOrder: 0, active: true, ...editing }) }, [editing, form])
  const save = useMutation({
    mutationFn: v => (editing.key
      ? client.put(`/admin/quiz-bank/topics/${editing.key}`, v)
      : client.post('/admin/quiz-bank/topics', v)).then(r => r.data),
    onSuccess: res => {
      if (res.resultCode !== 1) return message.error(res.message)
      message.success('Đã lưu chủ đề')
      setEditing(null)
      qc.invalidateQueries({ queryKey: ['admin-quiz-bank'] })
    },
  })
  const columns = [
    { title: 'Chủ đề', dataIndex: 'label', width: 180, render: (v, t) => <span style={{ opacity: t.active ? 1 : 0.5 }}>{v}</span> },
    { title: 'Mô tả cho AI', dataIndex: 'hint' },
    { title: 'Trạng thái', dataIndex: 'active', width: 100, render: v => (v ? <Tag color="green">Đang dùng</Tag> : <Tag>Đã ẩn</Tag>) },
    { title: '', width: 70, render: (_, t) => <Button size="small" onClick={() => setEditing(t)}>Sửa</Button> },
  ]
  return (
    <Card title="Chủ đề" style={{ marginBottom: 16 }} extra={<Button type="primary" onClick={() => setEditing({})}>Thêm chủ đề</Button>}>
      <Table size="small" rowKey="key" pagination={false} dataSource={topics} columns={columns} />
      <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
        "Mô tả cho AI" nói chủ đề gồm những gì; AI viết câu hỏi đúng theo đó. Ẩn một chủ đề thì không tạo thêm câu và không ra câu mới, câu cũ vẫn giữ.
      </Typography.Paragraph>
      <Modal open={!!editing} title={editing?.key ? 'Sửa chủ đề' : 'Thêm chủ đề'} onCancel={() => setEditing(null)} onOk={() => form.submit()}
        confirmLoading={save.isPending} okText="Lưu" cancelText="Hủy">
        <Form form={form} layout="vertical" onFinish={v => save.mutate(v)}>
          <Form.Item name="label" label="Tên chủ đề"><Input maxLength={60} /></Form.Item>
          <Form.Item name="hint" label="Mô tả cho AI (gồm những gì)"><Input.TextArea rows={3} maxLength={400} showCount /></Form.Item>
          {editing?.key && (
            <Space>
              <Form.Item name="sortOrder" label="Thứ tự"><InputNumber min={0} /></Form.Item>
              <Form.Item name="active" label="Đang dùng" valuePropName="checked"><Switch /></Form.Item>
            </Space>
          )}
        </Form>
      </Modal>
    </Card>
  )
}

function MixCard({ ranks, levels }) {
  const qc = useQueryClient()
  const [mix, setMix] = useState({})
  useEffect(() => { setMix(Object.fromEntries((ranks ?? []).map(r => [r.key, r.mix]))) }, [ranks])
  const sum = row => (row ?? []).reduce((a, b) => a + (b ?? 0), 0)
  const allOk = (ranks ?? []).every(r => sum(mix[r.key]) === 100)
  const save = useMutation({
    mutationFn: () => client.put('/admin/quiz-bank/rank-mix', mix).then(r => r.data),
    onSuccess: res => {
      if (res.resultCode !== 1) return message.error(res.message)
      message.success('Đã lưu tỉ lệ')
      qc.invalidateQueries({ queryKey: ['admin-quiz-bank'] })
    },
  })
  const columns = [
    { title: 'Rank', dataIndex: 'label', width: 130, render: v => <b>{v}</b> },
    ...(levels ?? []).map((level, i) => ({
      title: `${level.label} (%)`,
      render: (_, r) => (
        <InputNumber min={0} max={100} value={mix[r.key]?.[i]} style={{ width: 80 }}
          onChange={v => setMix(prev => ({ ...prev, [r.key]: prev[r.key].map((x, j) => (j === i ? (v ?? 0) : x)) }))} />
      ),
    })),
    { title: 'Tổng', width: 90, render: (_, r) => <span style={{ color: sum(mix[r.key]) === 100 ? '#2f9e44' : '#e03131', fontWeight: 600 }}>{sum(mix[r.key])}%</span> },
  ]
  return (
    <Card title="Tỉ lệ độ khó theo rank" style={{ marginBottom: 16 }}
      extra={<Button type="primary" disabled={!allOk} loading={save.isPending} onClick={() => save.mutate()}>Lưu tỉ lệ</Button>}>
      <Typography.Paragraph type="secondary">
        Mỗi câu của một rank được bốc ngẫu nhiên theo tỉ lệ này (ví dụ Bạc: 80% Rất dễ, 20% Dễ). Mỗi dòng phải cộng đúng 100%.
        Cần kho đủ câu ở mọi mức mà rank đó dùng.
      </Typography.Paragraph>
      <Table size="small" rowKey="key" pagination={false} dataSource={ranks ?? []} columns={columns} scroll={{ x: 800 }} />
    </Card>
  )
}

function Settings({ settings }) {
  const qc = useQueryClient()
  const [form] = Form.useForm()
  useEffect(() => { if (settings) form.setFieldsValue(settings) }, [settings, form])
  const save = useMutation({
    mutationFn: values => client.put('/admin/quiz-bank/settings', values).then(r => r.data),
    onSuccess: res => {
      if (res.resultCode !== 1) return message.error(res.message)
      message.success('Đã lưu')
      qc.invalidateQueries({ queryKey: ['admin-quiz-bank'] })
    },
  })
  return (
    <Form form={form} layout="inline" onFinish={v => save.mutate(v)} style={{ rowGap: 12 }}>
      <Form.Item name="genEnabled" label="Tự tạo mỗi đêm" valuePropName="checked"><Switch /></Form.Item>
      <Form.Item name="targetPerCell" label="Mục tiêu mỗi ô"><InputNumber min={20} max={5000} /></Form.Item>
      <Form.Item name="batchSize" label="Câu mỗi lần gọi"><InputNumber min={5} max={40} /></Form.Item>
      <Form.Item name="nightlyBatches" label="Lần gọi tối đa mỗi đêm"><InputNumber min={1} max={30} /></Form.Item>
      <Form.Item name="autoApprove" label="Câu AI chấm khớp vào dùng ngay, không cần duyệt" valuePropName="checked"><Switch /></Form.Item>
      <Button type="primary" htmlType="submit" loading={save.isPending}>Lưu</Button>
    </Form>
  )
}

function EditModal({ row, onClose, topics, levels }) {
  const qc = useQueryClient()
  const [form] = Form.useForm()
  useEffect(() => { if (row) form.setFieldsValue(row) }, [row, form])
  const save = useMutation({
    mutationFn: values => client.put(`/admin/quiz-bank/questions/${row.id}`, values).then(r => r.data),
    onSuccess: res => {
      if (res.resultCode !== 1) return message.error(res.message)
      message.success('Đã lưu (câu cần được duyệt lại)')
      qc.invalidateQueries({ queryKey: ['admin-quiz-questions'] })
      onClose()
    },
  })
  return (
    <Modal open={!!row} title={`Sửa câu #${row?.id}`} onCancel={onClose} onOk={() => form.submit()} confirmLoading={save.isPending} okText="Lưu" cancelText="Hủy" width={640}>
      <Form form={form} layout="vertical" onFinish={v => save.mutate(v)}>
        <Space>
          <Form.Item name="topic" label="Chủ đề"><Select style={{ width: 160 }} options={topics} /></Form.Item>
          <Form.Item name="difficulty" label="Độ khó"><Select style={{ width: 120 }} options={levels} /></Form.Item>
          <Form.Item name="searchable" label="Cho tra cứu" valuePropName="checked"><Switch /></Form.Item>
        </Space>
        <Form.Item name="body" label="Câu hỏi"><Input.TextArea rows={2} maxLength={300} showCount /></Form.Item>
        <Form.Item name="correct" label="Đáp án đúng">
          <Radio.Group>
            {['optA', 'optB', 'optC', 'optD'].map((key, i) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Radio value={i}>{String.fromCharCode(65 + i)}</Radio>
                <Form.Item name={key} noStyle><Input maxLength={120} style={{ width: 480 }} /></Form.Item>
              </div>
            ))}
          </Radio.Group>
        </Form.Item>
        <Form.Item name="explanation" label="Giải thích"><Input.TextArea rows={2} maxLength={300} /></Form.Item>
      </Form>
    </Modal>
  )
}

function Questions({ topics, levels }) {
  const qc = useQueryClient()
  const [filters, setFilters] = useState({ status: 'pending', topic: undefined, difficulty: undefined, q: '', reported: false })
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState([])
  const [editing, setEditing] = useState(null)
  const topicLabel = Object.fromEntries(topics.map(t => [t.value, t.label]))
  const levelLabel = Object.fromEntries(levels.map(l => [l.value, l.label]))
  const { data, isLoading } = useQuery({
    queryKey: ['admin-quiz-questions', filters, page],
    queryFn: () => client.get('/admin/quiz-bank/questions', { params: { ...filters, page, size: 20 } }).then(r => r.data?.data ?? { items: [], total: 0 }),
  })
  const setStatus = useMutation({
    mutationFn: ({ ids, status }) => client.post('/admin/quiz-bank/questions/status', { ids, status }).then(r => r.data),
    onSuccess: res => {
      if (res.resultCode !== 1) return message.error(res.message)
      setSelected([])
      qc.invalidateQueries({ queryKey: ['admin-quiz-questions'] })
      qc.invalidateQueries({ queryKey: ['admin-quiz-bank'] })
    },
  })
  const change = patch => { setFilters(f => ({ ...f, ...patch })); setPage(1); setSelected([]) }

  const columns = [
    {
      title: 'Câu hỏi', dataIndex: 'body', render: (v, r) => (
        <div>
          <div><b>{v}</b></div>
          {['optA', 'optB', 'optC', 'optD'].map((key, i) => (
            <div key={key} style={{ color: r.correct === i ? '#2f9e44' : undefined }}>{String.fromCharCode(65 + i)}. {r[key]}{r.correct === i ? ' ✓' : ''}</div>
          ))}
          {r.explanation && <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>{r.explanation}</div>}
        </div>
      ),
    },
    {
      title: 'Ô', width: 130, render: (_, r) => (
        <div>{topicLabel[r.topic] ?? r.topic}<br />{levelLabel[r.difficulty]}</div>
      ),
    },
    {
      title: 'Trạng thái', width: 150, render: (_, r) => (
        <Space direction="vertical" size={2}>
          <Tag color={STATUS[r.status][1]}>{STATUS[r.status][0]}</Tag>
          {r.verified ? <Tag color="blue">AI chấm khớp</Tag> : null}
          {r.reportCount > 0 && <Tag color="red">{r.reportCount} báo lỗi</Tag>}
          {r.reviewNote && <span style={{ fontSize: 12, color: '#888' }}>{r.reviewNote}</span>}
        </Space>
      ),
    },
    { title: 'Dùng', width: 90, render: (_, r) => (r.timesServed ? `${r.timesServed} lượt, ${Math.round(100 * r.timesCorrect / r.timesServed)}% đúng` : '–') },
    {
      title: '', width: 190, render: (_, r) => (
        <Space>
          {r.status !== 'active' && <Button size="small" type="primary" onClick={() => setStatus.mutate({ ids: [r.id], status: 'active' })}>Duyệt</Button>}
          {r.status !== 'hidden' && <Button size="small" onClick={() => setStatus.mutate({ ids: [r.id], status: 'hidden' })}>Ẩn</Button>}
          <Button size="small" onClick={() => setEditing(r)}>Sửa</Button>
        </Space>
      ),
    },
  ]

  return (
    <>
      <Space wrap style={{ marginBottom: 12 }}>
        <Select style={{ width: 140 }} value={filters.status} onChange={v => change({ status: v })} allowClear placeholder="Trạng thái"
          options={Object.entries(STATUS).map(([value, [label]]) => ({ value, label }))} />
        <Select style={{ width: 150 }} value={filters.topic} onChange={v => change({ topic: v })} allowClear placeholder="Chủ đề"
          options={topics} />
        <Select style={{ width: 110 }} value={filters.difficulty} onChange={v => change({ difficulty: v })} allowClear placeholder="Độ khó"
          options={levels} />
        <Input.Search style={{ width: 220 }} allowClear placeholder="Tìm trong câu hỏi" onSearch={v => change({ q: v })} />
        <Checkbox checked={filters.reported} onChange={e => change({ reported: e.target.checked })}>Chỉ câu bị báo lỗi</Checkbox>
        {selected.length > 0 && (
          <>
            <Popconfirm title={`Duyệt ${selected.length} câu đã chọn?`} onConfirm={() => setStatus.mutate({ ids: selected, status: 'active' })}>
              <Button type="primary">Duyệt {selected.length} câu</Button>
            </Popconfirm>
            <Button onClick={() => setStatus.mutate({ ids: selected, status: 'hidden' })}>Ẩn {selected.length} câu</Button>
          </>
        )}
      </Space>
      <Table size="small" rowKey="id" loading={isLoading} dataSource={data?.items ?? []} columns={columns}
        rowSelection={{ selectedRowKeys: selected, onChange: setSelected }}
        pagination={{ current: page, pageSize: 20, total: data?.total ?? 0, showSizeChanger: false, onChange: p => { setPage(p); setSelected([]) } }} />
      <EditModal row={editing} onClose={() => setEditing(null)} topics={topics} levels={levels} />
    </>
  )
}

export default function QuizBank() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [generating, setGenerating] = useState([]) // keys of the requests running now, several can run together
  const start = key => setGenerating(g => [...g, key])
  const stop = key => setGenerating(g => g.filter(k => k !== key))
  const { data, isLoading } = useQuery({
    queryKey: ['admin-quiz-bank'],
    queryFn: () => client.get('/admin/quiz-bank/overview').then(r => r.data?.data ?? null),
  })
  const generate = async (topic, difficulty, count) => {
    const key = `${topic}:${difficulty}`
    start(key)
    try {
      const res = (await client.post('/admin/quiz-bank/generate', { topic, difficulty, count })).data
      if (res.resultCode !== 1) message.error(res.message)
      else message.success(`Đã lưu ${res.data.saved} câu mới (trùng ${res.data.duplicates}, AI chấm lệch ${res.data.verifyFailed})`)
    } catch {
      message.error('Không tạo được, thử lại sau')
    } finally {
      stop(key)
      qc.invalidateQueries({ queryKey: ['admin-quiz-bank'] })
      qc.invalidateQueries({ queryKey: ['admin-quiz-questions'] })
    }
  }
  const totals = data?.totals

  return (
    <div style={{ padding: 24 }}>
      <Button type="link" icon={<ArrowLeftOutlined />} style={{ padding: 0, marginBottom: 8 }} onClick={() => navigate('/fun-events')}>Vui học</Button>
      <Typography.Title level={4} style={{ marginTop: 0 }}>Kho câu hỏi quiz leo rank</Typography.Title>
      <Typography.Paragraph type="secondary">
        AI viết sẵn câu hỏi theo chủ đề và độ khó, loại câu trùng, rồi tự trả lời lại để kiểm tra đáp án. Câu AI chấm khớp được duyệt nhanh; câu chấm lệch bị ẩn sẵn.
        Mỗi rank lấy câu theo tỉ lệ độ khó riêng (xem “Tỉ lệ độ khó theo rank” bên dưới).
      </Typography.Paragraph>
      {totals && !totals.aiActive && (
        <Alert type="warning" showIcon style={{ marginBottom: 12 }}
          message="AI đang tắt hoặc chưa có khóa ANTHROPIC_API_KEY, chưa tạo thêm được câu hỏi. Bật tại Cài đặt > Vận hành (Gợi ý AI)." />
      )}
      <Card loading={isLoading} title="Số câu theo chủ đề và độ khó" style={{ marginBottom: 16 }}
        extra={totals && (
          <Space>
            <Tag color="green">{totals.active} đang dùng</Tag>
            <Tag color="gold">{totals.pending} chờ duyệt</Tag>
            <Tag>{totals.hidden} đã ẩn</Tag>
            <Tag color="red">{totals.reported} bị báo lỗi</Tag>
            <Tag>Trùng: {pct(totals.duplicateRate)}</Tag>
            <Popconfirm title="Tạo thêm cho các ô thiếu nhiều nhất (tốn lượt gọi AI)?" onConfirm={async () => {
              start('all')
              try {
                const res = (await client.post('/admin/quiz-bank/top-up')).data
                if (res.resultCode !== 1) message.error(res.message); else message.success(`Đã lưu ${res.data.saved} câu mới`)
              } finally {
                stop('all')
                qc.invalidateQueries({ queryKey: ['admin-quiz-bank'] })
              }
            }}>
              <Button type="primary" loading={generating.includes('all')} disabled={!totals.aiActive}>Đề xuất AI tạo thêm</Button>
            </Popconfirm>
          </Space>
        )}>
        <Matrix data={data} onGenerate={generate} generating={generating} />
      </Card>
      <TopicsCard topics={data?.topics ?? []} />
      <MixCard ranks={data?.ranks} levels={data?.levels} />
      <Card title="Cấu hình" style={{ marginBottom: 16 }} loading={isLoading}>
        <Settings settings={data?.settings} />
      </Card>
      <Card title="Duyệt và quản lý câu hỏi">
        <Questions topics={(data?.topics ?? []).map(t => ({ value: t.key, label: t.label }))} levels={data?.levels ?? []} />
      </Card>
    </div>
  )
}
