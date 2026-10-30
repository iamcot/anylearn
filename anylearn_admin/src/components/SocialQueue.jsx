import { Alert, Button, DatePicker, Form, Input, Modal, Popconfirm, Segmented, Select, Space, Table, Tag, Typography, message } from 'antd'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import client from '../api/client'
import { fmtDateTime } from '../utils/format'

const CHANNELS = { facebook: 'Facebook', zalo: 'Zalo OA', tiktok: 'TikTok', youtube: 'YouTube', instagram: 'Instagram' }
const STATUS = { waiting: ['Chờ đăng', 'orange'], posted: ['Đã đăng', 'green'], skipped: ['Bỏ qua', 'default'] }

// The queue of social posts (plan 19.A6): what to post where, with which caption and tracked link, and when.
// The first version is a list the team posts by hand; t2m can add proposals for its own posts.
export default function SocialQueue({ posts }) {
  const qc = useQueryClient()
  const [status, setStatus] = useState('waiting')
  const [editing, setEditing] = useState(null)
  const [posting, setPosting] = useState(null)
  const [form] = Form.useForm()
  const [postedForm] = Form.useForm()
  const { data, isLoading } = useQuery({
    queryKey: ['admin-social-queue', status],
    queryFn: () => client.get('/admin/social-queue', { params: { status } }).then(r => r.data?.data ?? []),
  })
  const refresh = () => { qc.invalidateQueries({ queryKey: ['admin-social-queue'] }); qc.invalidateQueries({ queryKey: ['admin-badges'] }) }
  const done = res => {
    if (res.resultCode !== 1) { message.error(res.message); return false }
    refresh()
    return true
  }

  const save = useMutation({
    mutationFn: values => {
      const body = { ...values, scheduledAt: values.scheduledAt ? values.scheduledAt.format('YYYY-MM-DDTHH:mm:ss') : null }
      return (editing?.id ? client.put(`/admin/social-queue/${editing.id}`, body) : client.post('/admin/social-queue', body)).then(r => r.data)
    },
    onSuccess: res => { if (done(res)) { message.success('Đã lưu'); setEditing(null) } },
  })
  const setLineStatus = useMutation({
    mutationFn: ({ id, ...body }) => client.put(`/admin/social-queue/${id}/status`, body).then(r => r.data),
    onSuccess: res => { if (done(res)) { message.success('Đã cập nhật'); setPosting(null) } },
  })
  const del = useMutation({ mutationFn: id => client.delete(`/admin/social-queue/${id}`).then(r => r.data), onSuccess: res => { if (done(res)) message.success('Đã xóa') } })

  const open = line => {
    setEditing(line)
    form.setFieldsValue({ postId: line.postId ?? undefined, channel: line.channel ?? 'facebook', caption: line.caption ?? '', link: line.link ?? '', campaign: '', scheduledAt: line.scheduledAt ? dayjs(line.scheduledAt) : null })
  }
  const fillLink = async () => {
    const { postId, channel, campaign } = form.getFieldsValue()
    if (!postId || !channel) return message.info('Chọn bài và kênh trước')
    const res = await client.get('/admin/social-queue/link', { params: { postId, channel, campaign } }).then(r => r.data)
    if (res.resultCode === 1) form.setFieldValue('link', res.data.link)
  }
  const copy = text => navigator.clipboard?.writeText(text).then(() => message.success('Đã chép'))
  const postOptions = (posts ?? []).filter(p => p.status === 'published' || p.status === 'pending').map(p => ({ value: p.id, label: `#${p.id} ${p.title}` }))

  return (
    <>
      <Alert type="info" showIcon style={{ marginBottom: 12 }}
        message="Danh sách bài cần đăng lên Facebook, Zalo, TikTok, YouTube. Mỗi dòng có sẵn link gắn UTM để trang Nguồn khách biết khách đến từ bài nào."
        description="Bản đầu đăng tay: chép nội dung và link, đăng lên kênh, rồi bấm Đã đăng và dán link bài vừa đăng. Tool t2m cũng có thể đề xuất dòng cho bài của nó." />
      <Space wrap style={{ marginBottom: 12 }}>
        <Segmented value={status} onChange={setStatus} options={[{ label: 'Chờ đăng', value: 'waiting' }, { label: 'Đã đăng', value: 'posted' }, { label: 'Bỏ qua', value: 'skipped' }, { label: 'Tất cả', value: 'all' }]} />
        <Button type="primary" onClick={() => open({})}>+ Thêm dòng</Button>
      </Space>
      <Table rowKey="id" loading={isLoading} dataSource={data ?? []} pagination={{ pageSize: 20 }} scroll={{ x: 900 }} columns={[
        { title: 'Giờ đăng', dataIndex: 'scheduledAt', width: 150, render: v => (v ? fmtDateTime(v) : <Typography.Text type="secondary">Chưa hẹn</Typography.Text>) },
        { title: 'Kênh', dataIndex: 'channel', width: 100, render: c => CHANNELS[c] ?? c },
        { title: 'Bài Khám phá', key: 'post', render: (_, r) => (r.postId ? `#${r.postId} ${r.postTitle ?? ''}` : '') },
        { title: 'Nội dung', dataIndex: 'caption', render: (c, r) => (
          <Space direction="vertical" size={2} style={{ maxWidth: 360 }}>
            <Typography.Paragraph ellipsis={{ rows: 3, expandable: true }} style={{ margin: 0 }}>{c}</Typography.Paragraph>
            <Space size={8}>
              {c && <a onClick={() => copy(c)}>Chép nội dung</a>}
              {r.link && <a onClick={() => copy(r.link)}>Chép link</a>}
            </Space>
          </Space>
        ) },
        { title: 'Trạng thái', dataIndex: 'status', width: 140, render: (s, r) => (
          <Space direction="vertical" size={2}>
            <Tag color={STATUS[s]?.[1]}>{STATUS[s]?.[0] ?? s}</Tag>
            {r.postedUrl && <a href={r.postedUrl} target="_blank" rel="noreferrer">Xem bài đã đăng</a>}
          </Space>
        ) },
        { title: '', key: 'a', width: 200, render: (_, r) => (
          <Space wrap>
            {r.status === 'waiting' && <a onClick={() => { setPosting(r); postedForm.resetFields() }}>Đã đăng</a>}
            {r.status === 'waiting' && <a onClick={() => setLineStatus.mutate({ id: r.id, status: 'skipped' })}>Bỏ qua</a>}
            {r.status !== 'waiting' && <a onClick={() => setLineStatus.mutate({ id: r.id, status: 'waiting' })}>Về chờ đăng</a>}
            <a onClick={() => open(r)}>Sửa</a>
            <Popconfirm title="Xóa dòng này?" onConfirm={() => del.mutate(r.id)}><a>Xóa</a></Popconfirm>
          </Space>
        ) },
      ]} />

      <Modal title={editing?.id ? 'Sửa dòng đăng social' : 'Thêm dòng đăng social'} open={!!editing} onCancel={() => setEditing(null)} onOk={() => form.submit()} confirmLoading={save.isPending} okText="Lưu">
        <Form form={form} layout="vertical" onFinish={values => save.mutate(values)}>
          <Form.Item name="postId" label="Bài Khám phá (không bắt buộc)">
            <Select allowClear showSearch optionFilterProp="label" options={postOptions} placeholder="Chọn bài để có sẵn link gắn UTM" />
          </Form.Item>
          <Form.Item name="channel" label="Kênh" rules={[{ required: true }]}>
            <Select options={Object.entries(CHANNELS).map(([value, label]) => ({ value, label }))} />
          </Form.Item>
          <Form.Item name="campaign" label="Chiến dịch (utm_campaign)" extra="Để trống = kham-pha. Ví dụ ra-mat-v2.">
            <Input placeholder="kham-pha" />
          </Form.Item>
          <Form.Item name="link" label={<Space>Link<Button size="small" onClick={fillLink}>Tạo link từ bài</Button></Space>} extra="Để trống khi có bài: hệ thống tự tạo link gắn UTM.">
            <Input placeholder="https://anylearn.vn/..." />
          </Form.Item>
          <Form.Item name="caption" label="Nội dung đăng">
            <Input.TextArea rows={5} maxLength={5000} showCount />
          </Form.Item>
          <Form.Item name="scheduledAt" label="Giờ đăng">
            <DatePicker showTime={{ format: 'HH:mm' }} format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Đánh dấu đã đăng" open={!!posting} onCancel={() => setPosting(null)} onOk={() => postedForm.submit()} confirmLoading={setLineStatus.isPending} okText="Lưu">
        <Form form={postedForm} layout="vertical" onFinish={({ postedUrl }) => setLineStatus.mutate({ id: posting.id, status: 'posted', postedUrl })}>
          <Form.Item name="postedUrl" label="Link bài vừa đăng (không bắt buộc)">
            <Input placeholder="https://www.facebook.com/..." />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
