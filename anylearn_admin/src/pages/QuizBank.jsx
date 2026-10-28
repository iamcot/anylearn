import { Alert, Button, Card, Checkbox, Form, Input, InputNumber, Modal, Popconfirm, Radio, Select, Space, Switch, Table, Tag, Typography, message } from 'antd'
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'

// Keep in step with QuizRules.TOPICS in the backend.
const TOPICS = { parenting: 'Nuôi dạy con', english: 'Tiếng Anh', music: 'Âm nhạc', art: 'Mỹ thuật', science: 'Khoa học' }
const LEVELS = { 1: 'Dễ', 2: 'Vừa', 3: 'Khó' }
const STATUS = { pending: ['Chờ duyệt', 'gold'], active: ['Đang dùng', 'green'], hidden: ['Đã ẩn', 'default'] }
const pct = v => (v == null ? '–' : `${Math.round(v * 100)}%`)

function Matrix({ data, onGenerate, generating }) {
  const cells = data?.cells ?? []
  const columns = [
    { title: 'Chủ đề', dataIndex: 'topicLabel', render: (v, row) => (row.difficulty === 1 ? <b>{v}</b> : '') },
    { title: 'Độ khó', dataIndex: 'difficulty', render: v => LEVELS[v] },
    { title: 'Đang dùng', dataIndex: 'active', render: (v, r) => <span style={{ color: v >= r.target ? '#2f9e44' : '#e8590c' }}>{v}/{r.target}</span> },
    { title: 'Chờ duyệt', dataIndex: 'pending' },
    { title: 'Đã ẩn', dataIndex: 'hidden' },
    { title: 'Lượt phát', dataIndex: 'served' },
    { title: 'Tỉ lệ trả lời đúng', dataIndex: 'correctRate', render: pct },
    { title: 'Tỉ lệ trùng (30 ngày)', dataIndex: 'duplicateRate', render: (v, r) => (r.returned ? pct(v) : '–') },
    {
      title: '', render: (_, r) => (
        <Button size="small" disabled={r.shortfall <= 0} loading={generating === `${r.topic}:${r.difficulty}`}
          onClick={() => onGenerate(r.topic, r.difficulty, Math.min(r.shortfall, data.settings.batchSize))}>
          {r.shortfall > 0 ? `Tạo thêm (thiếu ${r.shortfall})` : 'Đủ'}
        </Button>
      ),
    },
  ]
  return <Table size="small" pagination={false} rowKey={r => `${r.topic}:${r.difficulty}`} dataSource={cells} columns={columns} />
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
      <Form.Item name="autoApprove" label="Tự bật câu AI chấm đúng" valuePropName="checked"><Switch /></Form.Item>
      <Button type="primary" htmlType="submit" loading={save.isPending}>Lưu</Button>
    </Form>
  )
}

function EditModal({ row, onClose }) {
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
          <Form.Item name="topic" label="Chủ đề"><Select style={{ width: 160 }} options={Object.entries(TOPICS).map(([value, label]) => ({ value, label }))} /></Form.Item>
          <Form.Item name="difficulty" label="Độ khó"><Select style={{ width: 120 }} options={Object.entries(LEVELS).map(([value, label]) => ({ value: Number(value), label }))} /></Form.Item>
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

function Questions() {
  const qc = useQueryClient()
  const [filters, setFilters] = useState({ status: 'pending', topic: undefined, difficulty: undefined, q: '', reported: false })
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState([])
  const [editing, setEditing] = useState(null)
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
        <div>{TOPICS[r.topic]}<br />{LEVELS[r.difficulty]}</div>
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
          options={Object.entries(TOPICS).map(([value, label]) => ({ value, label }))} />
        <Select style={{ width: 110 }} value={filters.difficulty} onChange={v => change({ difficulty: v })} allowClear placeholder="Độ khó"
          options={Object.entries(LEVELS).map(([value, label]) => ({ value: Number(value), label }))} />
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
      <EditModal row={editing} onClose={() => setEditing(null)} />
    </>
  )
}

export default function QuizBank() {
  const qc = useQueryClient()
  const [generating, setGenerating] = useState(null)
  const { data, isLoading } = useQuery({
    queryKey: ['admin-quiz-bank'],
    queryFn: () => client.get('/admin/quiz-bank/overview').then(r => r.data?.data ?? null),
  })
  const generate = async (topic, difficulty, count) => {
    setGenerating(`${topic}:${difficulty}`)
    try {
      const res = (await client.post('/admin/quiz-bank/generate', { topic, difficulty, count })).data
      if (res.resultCode !== 1) message.error(res.message)
      else message.success(`Đã lưu ${res.data.saved} câu mới (trùng ${res.data.duplicates}, AI chấm lệch ${res.data.verifyFailed})`)
    } catch {
      message.error('Không tạo được, thử lại sau')
    } finally {
      setGenerating(null)
      qc.invalidateQueries({ queryKey: ['admin-quiz-bank'] })
      qc.invalidateQueries({ queryKey: ['admin-quiz-questions'] })
    }
  }
  const totals = data?.totals

  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={4} style={{ marginTop: 0 }}>Kho câu hỏi quiz leo rank</Typography.Title>
      <Typography.Paragraph type="secondary">
        AI viết sẵn câu hỏi theo chủ đề và độ khó, loại câu trùng, rồi tự trả lời lại để kiểm tra đáp án. Câu AI chấm khớp được duyệt nhanh; câu chấm lệch bị ẩn sẵn.
        Rank Đồng và Bạc lấy câu Dễ, Vàng và Bạch kim lấy câu Vừa, từ Kim cương trở lên lấy câu Khó.
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
              setGenerating('all')
              try {
                const res = (await client.post('/admin/quiz-bank/top-up')).data
                if (res.resultCode !== 1) message.error(res.message); else message.success(`Đã lưu ${res.data.saved} câu mới`)
              } finally {
                setGenerating(null)
                qc.invalidateQueries({ queryKey: ['admin-quiz-bank'] })
              }
            }}>
              <Button type="primary" loading={generating === 'all'} disabled={!totals.aiActive}>Đề xuất AI tạo thêm</Button>
            </Popconfirm>
          </Space>
        )}>
        <Matrix data={data} onGenerate={generate} generating={generating} />
      </Card>
      <Card title="Cấu hình" style={{ marginBottom: 16 }} loading={isLoading}>
        <Settings settings={data?.settings} />
      </Card>
      <Card title="Duyệt và quản lý câu hỏi">
        <Questions />
      </Card>
    </div>
  )
}
