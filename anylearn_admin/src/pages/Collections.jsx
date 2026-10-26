import { Button, Card, DatePicker, Drawer, Form, Input, InputNumber, Popconfirm, Space, Switch, Table, Tag, Typography, message } from 'antd'
import { ArrowDownOutlined, ArrowUpOutlined, CloseOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import client from '../api/client'
import ImageUpload from '../components/ImageUpload'
import CollectionCoursePicker from '../components/CollectionCoursePicker'
import { fmtVND } from '../utils/format'

const FRONT_URL_PATH = '/collections/'

// "Hè không màn hình!" -> "he-khong-man-hinh" (same rule as the server)
function slugOf(title) {
  return title.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

const seasonText = (r) => (r.seasonFrom || r.seasonTo
  ? `${r.seasonFrom ? dayjs(r.seasonFrom).format('DD/MM/YYYY') : '...'} - ${r.seasonTo ? dayjs(r.seasonTo).format('DD/MM/YYYY') : '...'}`
  : 'Luôn hiện')

function move(list, index, delta) {
  const target = index + delta
  if (target < 0 || target >= list.length) return list
  const copy = [...list]
  ;[copy[index], copy[target]] = [copy[target], copy[index]]
  return copy
}

function CollectionEditor({ id, onClose }) {
  const qc = useQueryClient()
  const [form] = Form.useForm()
  const [items, setItems] = useState([])
  const [slugTouched, setSlugTouched] = useState(false)
  const [loadedId, setLoadedId] = useState(null)

  const { isLoading } = useQuery({
    queryKey: ['admin-collection', id],
    enabled: id !== 'new' && loadedId !== id,
    queryFn: async () => {
      const data = await client.get(`/admin/collections/${id}`).then(r => r.data?.data)
      form.setFieldsValue({
        ...data, season: data.seasonFrom || data.seasonTo ? [data.seasonFrom ? dayjs(data.seasonFrom) : null, data.seasonTo ? dayjs(data.seasonTo) : null] : null,
      })
      setItems(data.items ?? [])
      setSlugTouched(true)
      setLoadedId(id)
      return data
    },
  })

  const save = useMutation({
    mutationFn: (values) => {
      const [from, to] = values.season ?? []
      const body = {
        title: values.title, slug: values.slug, subtitle: values.subtitle, cover: values.cover,
        seasonFrom: from ? from.format('YYYY-MM-DD') : null, seasonTo: to ? to.format('YYYY-MM-DD') : null,
        sortOrder: values.sortOrder ?? 0, active: values.active !== false, itemIds: items.map(item => item.id),
      }
      return (id === 'new' ? client.post('/admin/collections', body) : client.put(`/admin/collections/${id}`, body)).then(r => r.data)
    },
    onSuccess: (res) => {
      if (res.resultCode !== 1) return message.error(res.message)
      message.success('Đã lưu bộ sưu tập')
      qc.invalidateQueries({ queryKey: ['admin-collections'] })
      onClose()
    },
  })

  const addItems = (picked) => setItems(current => [...current, ...picked.filter(p => !current.some(c => c.id === p.id))])
  const slug = Form.useWatch('slug', form)

  return (
    <Drawer open width={920} onClose={onClose} title={id === 'new' ? 'Bộ sưu tập mới' : 'Sửa bộ sưu tập'} loading={isLoading}
      extra={<Button type="primary" loading={save.isPending} onClick={() => form.validateFields().then(save.mutate)}>Lưu</Button>}>
      <Form form={form} layout="vertical" initialValues={{ active: true, sortOrder: 0 }}
        onValuesChange={(changed) => { if (changed.title !== undefined && !slugTouched) form.setFieldValue('slug', slugOf(changed.title)) }}>
        <Form.Item name="title" label="Tên bộ sưu tập" rules={[{ required: true, message: 'Nhập tên' }]}>
          <Input placeholder="Hè không màn hình" maxLength={200} />
        </Form.Item>
        <Form.Item name="subtitle" label="Mô tả ngắn">
          <Input placeholder="Hoạt động ngoài trời cho bé nghỉ hè" maxLength={300} />
        </Form.Item>
        <Form.Item name="slug" label="Đường dẫn" extra={slug ? `${FRONT_URL_PATH}${slug}` : 'Tự tạo từ tên'}>
          <Input onChange={() => setSlugTouched(true)} maxLength={120} />
        </Form.Item>
        <Space align="start" size={24} wrap>
          <Form.Item name="cover" label="Ảnh bìa">
            <ImageUpload value={Form.useWatch('cover', form)} onChange={url => form.setFieldValue('cover', url)} />
          </Form.Item>
          <Form.Item name="season" label="Hiển thị từ ngày - đến ngày" extra="Để trống = luôn hiện">
            <DatePicker.RangePicker format="DD/MM/YYYY" allowEmpty={[true, true]} />
          </Form.Item>
          <Form.Item name="sortOrder" label="Thứ tự"><InputNumber style={{ width: 80 }} /></Form.Item>
          <Form.Item name="active" label="Hiện" valuePropName="checked"><Switch /></Form.Item>
        </Space>
      </Form>

      <Typography.Title level={5} style={{ marginTop: 8 }}>Khóa học trong bộ sưu tập ({items.length})</Typography.Title>
      <Table
        size="small" rowKey="id" dataSource={items} pagination={false} locale={{ emptyText: 'Chưa có khóa nào. Tìm và thêm ở bên dưới.' }}
        columns={[
          { title: '#', key: 'n', width: 40, render: (_, __, index) => index + 1 },
          { title: 'Khóa học', key: 'title', render: (_, r) => (
            <Space>
              {r.image ? <img src={r.image} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} /> : <div style={{ width: 40, height: 40, background: '#f0f0f0', borderRadius: 6 }} />}
              <div><div style={{ fontWeight: 500 }}>{r.title}</div><Typography.Text type="secondary" style={{ fontSize: 12 }}>{r.authorName}</Typography.Text></div>
            </Space>
          ) },
          { title: 'Giá', dataIndex: 'price', key: 'price', width: 110, align: 'right', render: fmtVND },
          { title: '', key: 'actions', width: 120, render: (_, __, index) => (
            <Space size={2}>
              <Button size="small" type="text" icon={<ArrowUpOutlined />} disabled={index === 0} onClick={() => setItems(move(items, index, -1))} />
              <Button size="small" type="text" icon={<ArrowDownOutlined />} disabled={index === items.length - 1} onClick={() => setItems(move(items, index, 1))} />
              <Button size="small" type="text" danger icon={<CloseOutlined />} onClick={() => setItems(items.filter((_, i) => i !== index))} />
            </Space>
          ) },
        ]}
      />

      <Typography.Title level={5} style={{ marginTop: 24 }}>Thêm khóa học</Typography.Title>
      <CollectionCoursePicker addedIds={items.map(item => item.id)} onAdd={addItems} />
    </Drawer>
  )
}

export default function Collections() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(null)
  const { data, isLoading } = useQuery({
    queryKey: ['admin-collections'],
    queryFn: () => client.get('/admin/collections').then(r => r.data?.data ?? []),
  })
  const toggle = useMutation({
    mutationFn: ({ r, active }) => client.put(`/admin/collections/${r.id}`, { title: r.title, slug: r.slug, subtitle: r.subtitle, cover: r.cover, seasonFrom: r.seasonFrom, seasonTo: r.seasonTo, sortOrder: r.sortOrder, active }).then(x => x.data),
    onSuccess: (res) => { if (res.resultCode !== 1) message.error(res.message); qc.invalidateQueries({ queryKey: ['admin-collections'] }) },
  })
  const remove = useMutation({
    mutationFn: (id) => client.delete(`/admin/collections/${id}`).then(r => r.data),
    onSuccess: () => { message.success('Đã xóa'); qc.invalidateQueries({ queryKey: ['admin-collections'] }) },
  })

  return (
    <Card
      title="Bộ sưu tập"
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing('new')}>Tạo bộ sưu tập</Button>}
      style={{ margin: 24 }}
    >
      <Table
        rowKey="id" loading={isLoading} dataSource={data ?? []} pagination={false}
        columns={[
          { title: 'Thứ tự', dataIndex: 'sortOrder', key: 'sortOrder', width: 80 },
          { title: 'Tên', key: 'title', render: (_, r) => <div><div style={{ fontWeight: 500 }}>{r.title}</div><Typography.Text type="secondary" style={{ fontSize: 12 }}>{FRONT_URL_PATH}{r.slug}</Typography.Text></div> },
          { title: 'Số khóa', dataIndex: 'itemCount', key: 'itemCount', width: 90, align: 'right', render: n => n === 0 ? <Tag color="orange">0</Tag> : n },
          { title: 'Thời gian hiện', key: 'season', width: 210, render: (_, r) => seasonText(r) },
          { title: 'Hiện', key: 'active', width: 80, render: (_, r) => <Switch size="small" checked={r.active} onChange={active => toggle.mutate({ r, active })} /> },
          { title: '', key: 'actions', width: 110, render: (_, r) => (
            <Space>
              <Button size="small" icon={<EditOutlined />} onClick={() => setEditing(r.id)} />
              <Popconfirm title="Xóa bộ sưu tập này?" okText="Xóa" cancelText="Hủy" onConfirm={() => remove.mutate(r.id)}>
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Space>
          ) },
        ]}
      />
      {editing !== null && <CollectionEditor key={editing} id={editing} onClose={() => setEditing(null)} />}
    </Card>
  )
}
