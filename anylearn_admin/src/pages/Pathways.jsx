import { Button, Card, Drawer, Form, Input, Popconfirm, Select, Space, Switch, Table, Tag, Typography, message } from 'antd'
import { ArrowDownOutlined, ArrowUpOutlined, CloseOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import ImageUpload from '../components/ImageUpload'
import CollectionCoursePicker from '../components/CollectionCoursePicker'
import { fmtVND } from '../utils/format'

const FRONT_URL_PATH = '/pathways/'

const SOURCE_LABELS = {
  pathway: 'Lộ trình (khóa tiếp theo)',
  sibling: 'Anh chị em (cùng đối tác)',
  free_slot: 'Khung giờ trống',
  season: 'Theo mùa (bộ sưu tập)',
  interest: 'Sở thích của bé',
}

// "Bóng đá U13 → U17" -> "bong-da-u13-u17" (same rule as the server)
function slugOf(title) {
  return title.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function move(list, index, delta) {
  const target = index + delta
  if (target < 0 || target >= list.length) return list
  const copy = [...list]
  ;[copy[index], copy[target]] = [copy[target], copy[index]]
  return copy
}

function PathwayEditor({ id, onClose }) {
  const qc = useQueryClient()
  const [form] = Form.useForm()
  const [steps, setSteps] = useState([]) // [{ key, note, courses: [{ id, title, image, price }] }]
  const [target, setTarget] = useState('merge') // where the picked courses go: merge (one new step) | split (a step each) | a step key
  const [slugTouched, setSlugTouched] = useState(false)
  const [loadedId, setLoadedId] = useState(null)

  const { isLoading } = useQuery({
    queryKey: ['admin-pathway', id],
    enabled: id !== 'new' && loadedId !== id,
    queryFn: async () => {
      const data = await client.get(`/admin/pathways/${id}`).then(r => r.data?.data)
      form.setFieldsValue(data)
      setSteps((data.steps ?? []).map(s => ({
        key: `s${s.stepNo}`, note: s.note ?? '',
        courses: (s.items ?? []).map(i => ({ id: i.itemId, title: i.title, image: i.image, price: i.price })),
      })))
      setSlugTouched(true)
      setLoadedId(id)
      return data
    },
  })

  const save = useMutation({
    mutationFn: (values) => {
      const body = {
        title: values.title, slug: values.slug, subtitle: values.subtitle, cover: values.cover,
        active: values.active !== false, steps: steps.map(s => ({ itemIds: s.courses.map(c => c.id), note: s.note })),
      }
      return (id === 'new' ? client.post('/admin/pathways', body) : client.put(`/admin/pathways/${id}`, body)).then(r => r.data)
    },
    onSuccess: (res) => {
      if (res.resultCode !== 1) return message.error(res.message)
      message.success('Đã lưu lộ trình')
      qc.invalidateQueries({ queryKey: ['admin-pathways'] })
      onClose()
    },
  })

  const addedIds = steps.flatMap(s => s.courses.map(c => c.id))
  let keySeed = Date.now()
  const addItems = (picked) => {
    const fresh = picked.filter(p => !addedIds.includes(p.id)).map(p => ({ id: p.id, title: p.title, image: p.image, price: p.price }))
    if (fresh.length === 0) return
    setSteps(current => {
      if (target === 'merge') return [...current, { key: `n${keySeed++}`, note: '', courses: fresh }]
      if (target === 'split') return [...current, ...fresh.map(course => ({ key: `n${keySeed++}`, note: '', courses: [course] }))]
      return current.map(step => (step.key === target ? { ...step, courses: [...step.courses, ...fresh] } : step))
    })
  }
  const removeCourse = (stepKey, courseId) => setSteps(current => current
    .map(step => (step.key === stepKey ? { ...step, courses: step.courses.filter(c => c.id !== courseId) } : step))
    .filter(step => step.courses.length > 0))
  const slug = Form.useWatch('slug', form)

  return (
    <Drawer open width={920} onClose={onClose} title={id === 'new' ? 'Lộ trình mới' : 'Sửa lộ trình'} loading={isLoading}
      extra={<Button type="primary" loading={save.isPending} onClick={() => form.validateFields().then(save.mutate)}>Lưu</Button>}>
      <Form form={form} layout="vertical" initialValues={{ active: true }}
        onValuesChange={(changed) => { if (changed.title !== undefined && !slugTouched) form.setFieldValue('slug', slugOf(changed.title)) }}>
        <Form.Item name="title" label="Tên lộ trình" rules={[{ required: true, message: 'Nhập tên' }]}>
          <Input placeholder="Bóng đá: từ U13 đến U17" maxLength={200} />
        </Form.Item>
        <Form.Item name="subtitle" label="Mô tả ngắn">
          <Input placeholder="Ba cấp độ, học liên tục cùng một sân" maxLength={300} />
        </Form.Item>
        <Form.Item name="slug" label="Đường dẫn" extra={slug ? `${FRONT_URL_PATH}${slug}` : 'Tự tạo từ tên'}>
          <Input onChange={() => setSlugTouched(true)} maxLength={120} />
        </Form.Item>
        <Space align="start" size={24} wrap>
          <Form.Item name="cover" label="Ảnh bìa">
            <ImageUpload value={Form.useWatch('cover', form)} onChange={url => form.setFieldValue('cover', url)} />
          </Form.Item>
          <Form.Item name="active" label="Đang dùng" valuePropName="checked"
            extra="Tắt thì lộ trình không còn dùng để gợi ý khóa tiếp theo."><Switch /></Form.Item>
        </Space>
      </Form>

      <Typography.Title level={5} style={{ marginTop: 8 }}>Các bước theo thứ tự ({steps.length})</Typography.Title>
      <Typography.Paragraph type="secondary">
        Mỗi bước có một hoặc nhiều khóa để khách chọn. Bé có một khóa bất kỳ của bước là coi như đã qua bước đó; khi gợi ý, hệ thống chọn khóa liên quan nhất trong bước kế tiếp (ưu tiên cùng đối tác với khóa bé đã học ở bước trước). Dùng mũi tên để sắp xếp các bước.
      </Typography.Paragraph>
      {steps.length === 0 && <Typography.Paragraph type="secondary">Chưa có bước nào. Tìm và thêm ở bên dưới.</Typography.Paragraph>}
      {steps.map((step, index) => (
        <Card key={step.key} size="small" style={{ marginBottom: 10 }}
          title={`Bước ${index + 1}`}
          extra={(
            <Space size={2}>
              <Button size="small" type="text" icon={<ArrowUpOutlined />} disabled={index === 0} onClick={() => setSteps(move(steps, index, -1))} />
              <Button size="small" type="text" icon={<ArrowDownOutlined />} disabled={index === steps.length - 1} onClick={() => setSteps(move(steps, index, 1))} />
              <Popconfirm title="Xóa cả bước này?" okText="Xóa" cancelText="Thôi" onConfirm={() => setSteps(steps.filter((_, i) => i !== index))}>
                <Button size="small" type="text" danger icon={<CloseOutlined />} />
              </Popconfirm>
            </Space>
          )}>
          <Input size="small" value={step.note} maxLength={300} placeholder="Ghi chú của bước, ví dụ: dành cho bé đã thạo kỹ thuật cơ bản" style={{ marginBottom: 8 }}
            onChange={e => setSteps(steps.map((s, i) => (i === index ? { ...s, note: e.target.value } : s)))} />
          <Table size="small" rowKey="id" dataSource={step.courses} pagination={false} showHeader={false}
            columns={[
              { key: 'title', render: (_, r) => (
                <Space>
                  {r.image ? <img src={r.image} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6 }} /> : <div style={{ width: 36, height: 36, background: '#f0f0f0', borderRadius: 6 }} />}
                  <div style={{ fontWeight: 500 }}>{r.title}</div>
                </Space>
              ) },
              { key: 'price', dataIndex: 'price', width: 100, align: 'right', render: fmtVND },
              { key: 'x', width: 48, render: (_, r) => <Button size="small" type="text" danger icon={<CloseOutlined />} onClick={() => removeCourse(step.key, r.id)} /> },
            ]} />
        </Card>
      ))}

      <Typography.Title level={5} style={{ marginTop: 24 }}>Thêm khóa học</Typography.Title>
      <Space style={{ marginBottom: 8 }} wrap>
        <span>Khóa đã chọn sẽ được:</span>
        <Select value={target} onChange={setTarget} style={{ minWidth: 340 }}
          options={[
            { value: 'merge', label: 'Thêm thành một bước mới (các khóa vừa chọn là lựa chọn thay thế nhau)' },
            { value: 'split', label: 'Thêm thành các bước riêng (mỗi khóa một bước)' },
            ...steps.map((s, i) => ({ value: s.key, label: `Thêm vào Bước ${i + 1}` })),
          ]} />
      </Space>
      <CollectionCoursePicker addedIds={addedIds} onAdd={addItems} />
    </Drawer>
  )
}

function Stats() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-recommendation-stats'],
    queryFn: () => client.get('/admin/recommendations/stats').then(r => r.data?.data ?? []),
  })
  return (
    <Card title="Hiệu quả gợi ý (30 ngày gần nhất)" style={{ margin: '0 24px 24px' }}>
      <Typography.Paragraph type="secondary">
        Lượt xem là số lần gợi ý hiện cho phụ huynh (mỗi bé, mỗi khóa tính một lần mỗi ngày); "Có đơn" là số bé bấm vào gợi ý rồi đặt khóa đó trong 30 ngày.
        Loại nào kém hiệu quả thì tắt ở Cài đặt &gt; Vận hành &gt; Gợi ý khóa học.
      </Typography.Paragraph>
      <Table rowKey="source" loading={isLoading} dataSource={data ?? []} pagination={false} size="small"
        columns={[
          { title: 'Loại gợi ý', dataIndex: 'source', key: 'source', render: s => SOURCE_LABELS[s] ?? s },
          { title: 'Đang bật', dataIndex: 'enabled', key: 'enabled', width: 100, render: on => (on ? <Tag color="green">Bật</Tag> : <Tag>Tắt</Tag>) },
          { title: 'Lượt xem', dataIndex: 'views', key: 'views', width: 100, align: 'right' },
          { title: 'Lượt bấm', dataIndex: 'clicks', key: 'clicks', width: 100, align: 'right' },
          { title: 'Tỷ lệ bấm', dataIndex: 'clickRate', key: 'clickRate', width: 100, align: 'right', render: v => `${v}%` },
          { title: 'Có đơn', dataIndex: 'orders', key: 'orders', width: 90, align: 'right' },
        ]} />
    </Card>
  )
}

export default function Pathways() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(null)
  const { data, isLoading } = useQuery({
    queryKey: ['admin-pathways'],
    queryFn: () => client.get('/admin/pathways').then(r => r.data?.data ?? []),
  })
  const toggle = useMutation({
    mutationFn: ({ r, active }) => client.put(`/admin/pathways/${r.id}`, { title: r.title, slug: r.slug, subtitle: r.subtitle, cover: r.cover, active }).then(x => x.data),
    onSuccess: (res) => { if (res.resultCode !== 1) message.error(res.message); qc.invalidateQueries({ queryKey: ['admin-pathways'] }) },
  })
  const remove = useMutation({
    mutationFn: (id) => client.delete(`/admin/pathways/${id}`).then(r => r.data),
    onSuccess: () => { message.success('Đã xóa'); qc.invalidateQueries({ queryKey: ['admin-pathways'] }) },
  })

  return (
    <>
      <Card
        title="Lộ trình khóa học"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing('new')}>Tạo lộ trình</Button>}
        style={{ margin: 24 }}
      >
        <Table
          rowKey="id" loading={isLoading} dataSource={data ?? []} pagination={false}
          columns={[
            { title: 'Tên', key: 'title', render: (_, r) => <div><div style={{ fontWeight: 500 }}>{r.title}</div><Typography.Text type="secondary" style={{ fontSize: 12 }}>{FRONT_URL_PATH}{r.slug}</Typography.Text></div> },
            { title: 'Số bước', dataIndex: 'stepCount', key: 'stepCount', width: 90, align: 'right', render: n => n < 2 ? <Tag color="orange">{n}</Tag> : n },
            { title: 'Đang dùng', key: 'active', width: 100, render: (_, r) => <Switch size="small" checked={!!r.active} onChange={active => toggle.mutate({ r, active })} /> },
            { title: '', key: 'actions', width: 110, render: (_, r) => (
              <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => setEditing(r.id)} />
                <Popconfirm title="Xóa lộ trình này?" okText="Xóa" cancelText="Hủy" onConfirm={() => remove.mutate(r.id)}>
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            ) },
          ]}
        />
        {editing !== null && <PathwayEditor key={editing} id={editing} onClose={() => setEditing(null)} />}
      </Card>
      <Stats />
    </>
  )
}
