import { Alert, Button, Card, Drawer, Form, Input, InputNumber, Popconfirm, Progress, Radio, Select, Space, Statistic, Switch, Table, Tabs, Tag, Typography, Upload, message } from 'antd'
import { UploadOutlined, VideoCameraAddOutlined } from '@ant-design/icons'
import * as tus from 'tus-js-client'
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import { fmtDateTime } from '../utils/format'

const KINDS = { article: 'Bài viết', image: 'Hình ảnh', video: 'Clip' }
const STATUS = { draft: ['Nháp', 'default'], published: ['Đang hiện', 'green'], hidden: ['Ẩn', 'red'] }

function UploadButton({ onDone }) {
  return (
    <Upload showUploadList={false} accept="image/*" customRequest={async ({ file, onSuccess, onError }) => {
      const fd = new FormData()
      fd.append('image', file)
      try {
        const res = await client.post('/admin/explore/upload', fd).then(r => r.data)
        if (res.resultCode !== 1) throw new Error(res.message)
        onDone(res.data.url)
        onSuccess('ok')
      } catch (e) {
        message.error(e.message || 'Upload thất bại')
        onError(e)
      }
    }}><Button icon={<UploadOutlined />}>Tải hình lên</Button></Upload>
  )
}

// Video straight from the browser to Bunny Stream (TUS): the server only creates the video and signs the upload.
function VideoUploadButton({ title, onDone }) {
  const [percent, setPercent] = useState(null)
  const start = async file => {
    setPercent(0)
    try {
      const res = await client.post('/admin/explore/video-upload', { title: title || file.name }).then(r => r.data)
      if (res.resultCode !== 1) throw new Error(res.message)
      const info = res.data
      const upload = new tus.Upload(file, {
        endpoint: info.endpoint,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: {
          AuthorizationSignature: info.authorizationSignature,
          AuthorizationExpire: String(info.authorizationExpire),
          VideoId: info.videoId,
          LibraryId: String(info.libraryId),
        },
        metadata: { filetype: file.type, title: title || file.name },
        onError: err => { message.error('Tải video thất bại: ' + (err?.message || err)); setPercent(null) },
        onProgress: (sent, total) => setPercent(Math.round((sent / total) * 100)),
        onSuccess: () => {
          setPercent(null)
          onDone({ mediaUrl: info.mediaUrl, posterUrl: info.posterUrl })
          message.success('Đã tải video lên. Bunny cần vài phút để xử lý trước khi phát được.')
        },
      })
      upload.start()
    } catch (e) {
      message.error(e.message || 'Không bắt đầu được việc tải video')
      setPercent(null)
    }
  }
  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Upload showUploadList={false} accept="video/*" disabled={percent !== null} beforeUpload={file => { start(file); return false }}>
        <Button icon={<VideoCameraAddOutlined />} disabled={percent !== null}>Tải video lên</Button>
      </Upload>
      {percent !== null && <Progress percent={percent} size="small" />}
    </Space>
  )
}

function PostDrawer({ post, open, onClose, onSaved }) {
  const [form] = Form.useForm()
  const kind = Form.useWatch('kind', form)
  const title = Form.useWatch('title', form)
  const { data: bunny } = useQuery({ queryKey: ['admin-explore-video-status'], queryFn: () => client.get('/admin/explore/video-upload/status').then(r => r.data?.data ?? { enabled: false }) })
  useEffect(() => {
    if (open) form.setFieldsValue(post ?? { kind: 'article', status: 'draft', pinned: false, title: '', body: '', mediaUrl: '', posterUrl: '', itemId: null })
  }, [open, post, form])
  const save = useMutation({
    mutationFn: values => (post?.id
      ? client.put(`/admin/explore/posts/${post.id}`, values)
      : client.post('/admin/explore/posts', values)).then(r => r.data),
    onSuccess: res => {
      if (res.resultCode !== 1) return message.error(res.message)
      message.success('Đã lưu bài')
      onSaved()
      onClose()
    },
  })
  return (
    <Drawer title={post?.id ? 'Sửa bài' : 'Bài mới'} open={open} onClose={onClose} width={520} destroyOnClose>
      <Form form={form} layout="vertical" onFinish={v => save.mutate({ ...v, itemId: v.itemId || null })}>
        <Form.Item name="kind" label="Loại bài"><Radio.Group options={Object.entries(KINDS).map(([value, label]) => ({ value, label }))} /></Form.Item>
        <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Nhập tiêu đề' }]}><Input maxLength={160} /></Form.Item>
        <Form.Item name="body" label={kind === 'article' ? 'Nội dung' : 'Mô tả ngắn'}><Input.TextArea rows={kind === 'article' ? 8 : 3} maxLength={8000} /></Form.Item>
        {kind !== 'article' && (
          <Form.Item label={kind === 'video' ? 'Đường dẫn clip (tải lên ở dưới, hoặc dán link YouTube, mp4, m3u8 bắt đầu bằng https://)' : 'Hình ảnh'} required>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Form.Item name="mediaUrl" noStyle><Input placeholder="https://..." /></Form.Item>
              {kind === 'image' && <UploadButton onDone={url => form.setFieldValue('mediaUrl', url)} />}
              {kind === 'video' && bunny?.enabled && <VideoUploadButton title={title} onDone={({ mediaUrl, posterUrl }) => form.setFieldsValue({ mediaUrl, posterUrl })} />}
            </Space>
          </Form.Item>
        )}
        {kind === 'video' && (
          <Form.Item label="Hình đại diện clip (tùy chọn)">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Form.Item name="posterUrl" noStyle><Input placeholder="https://..." /></Form.Item>
              <UploadButton onDone={url => form.setFieldValue('posterUrl', url)} />
            </Space>
          </Form.Item>
        )}
        <Form.Item name="itemId" label="Gắn khóa học (nhập mã khóa học, tùy chọn)"><InputNumber style={{ width: '100%' }} min={1} /></Form.Item>
        <Form.Item name="status" label="Trạng thái"><Select options={Object.entries(STATUS).map(([value, [label]]) => ({ value, label }))} /></Form.Item>
        <Form.Item name="pinned" label="Ghim lên đầu" valuePropName="checked"><Switch /></Form.Item>
        <Button type="primary" htmlType="submit" loading={save.isPending}>Lưu</Button>
      </Form>
    </Drawer>
  )
}

function Posts() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(null)
  const [open, setOpen] = useState(false)
  const { data } = useQuery({ queryKey: ['admin-explore-posts'], queryFn: () => client.get('/admin/explore/posts').then(r => r.data?.data ?? null) })
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-explore-posts'] })
  const del = useMutation({ mutationFn: id => client.delete(`/admin/explore/posts/${id}`).then(r => r.data), onSuccess: () => { message.success('Đã xóa'); refresh() } })
  const stats = data?.stats
  return (
    <>
      {stats && (
        <Space size="large" wrap style={{ marginBottom: 16 }}>
          <Statistic title="Đang hiện" value={stats.published} /><Statistic title="Lượt xem" value={stats.views} /><Statistic title="Lượt thích" value={stats.likes} />
          <Statistic title="Chia sẻ" value={stats.shares} /><Statistic title="Bình luận" value={stats.comments} /><Statistic title="Báo cáo chờ xử lý" value={stats.openReports} />
        </Space>
      )}
      <Button type="primary" style={{ marginBottom: 12 }} onClick={() => { setEditing(null); setOpen(true) }}>+ Bài mới</Button>
      <Table rowKey="id" dataSource={data?.items ?? []} pagination={{ pageSize: 20 }} columns={[
        { title: 'Tiêu đề', dataIndex: 'title', render: (t, r) => <span>{r.pinned ? '📌 ' : ''}{t}</span> },
        { title: 'Loại', dataIndex: 'kind', render: k => KINDS[k] },
        { title: 'Trạng thái', dataIndex: 'status', render: s => <Tag color={STATUS[s]?.[1]}>{STATUS[s]?.[0]}</Tag> },
        { title: 'Xem', dataIndex: 'views' }, { title: 'Thích', dataIndex: 'likes' }, { title: 'Chia sẻ', dataIndex: 'shares' }, { title: 'Bình luận', dataIndex: 'comments' },
        { title: 'Ngày đăng', dataIndex: 'publishedAt', render: v => (v ? fmtDateTime(v) : '') },
        { title: '', key: 'a', render: (_, r) => (
          <Space>
            <a onClick={() => { setEditing(r); setOpen(true) }}>Sửa</a>
            <Popconfirm title="Xóa bài này cùng bình luận của nó?" onConfirm={() => del.mutate(r.id)}><a>Xóa</a></Popconfirm>
          </Space>
        ) },
      ]} />
      <PostDrawer post={editing} open={open} onClose={() => setOpen(false)} onSaved={refresh} />
    </>
  )
}

function Comments() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState('reported')
  const [page, setPage] = useState(1)
  const { data } = useQuery({ queryKey: ['admin-explore-comments', filter, page], queryFn: () => client.get('/admin/explore/comments', { params: { filter, page } }).then(r => r.data?.data ?? []) })
  const refresh = () => { qc.invalidateQueries({ queryKey: ['admin-explore-comments'] }); qc.invalidateQueries({ queryKey: ['admin-badges'] }) }
  const act = useMutation({
    mutationFn: ({ method, url, body }) => client[method](url, body).then(r => r.data),
    onSuccess: res => { if (res.resultCode !== 1) return message.error(res.message); refresh() },
  })
  return (
    <>
      <Radio.Group value={filter} onChange={e => { setFilter(e.target.value); setPage(1) }} style={{ marginBottom: 12 }}
        options={[{ value: 'reported', label: 'Bị báo cáo' }, { value: 'all', label: 'Tất cả' }, { value: 'hidden', label: 'Đã ẩn' }]} />
      <Table rowKey="id" dataSource={data ?? []} pagination={{ current: page, pageSize: 30, total: (page - 1) * 30 + (data?.length ?? 0) + ((data?.length ?? 0) === 30 ? 1 : 0), onChange: setPage, showSizeChanger: false }} columns={[
        { title: 'Bình luận', dataIndex: 'body', render: (b, r) => <div><div>{b}</div>{r.reasons && <Typography.Text type="danger">Lý do báo: {r.reasons}</Typography.Text>}</div> },
        { title: 'Người viết', key: 'u', render: (_, r) => <span>{r.userName} {r.userPhone}{r.banned ? <Tag color="red">đã khóa</Tag> : null}</span> },
        { title: 'Bài', dataIndex: 'postTitle' },
        { title: 'Báo cáo', dataIndex: 'reports' },
        { title: 'Lúc', dataIndex: 'createdAt', render: fmtDateTime },
        { title: '', key: 'a', render: (_, r) => (
          <Space wrap>
            {r.status === 'visible'
              ? <a onClick={() => act.mutate({ method: 'put', url: `/admin/explore/comments/${r.id}/status`, body: { status: 'hidden' } })}>Ẩn</a>
              : <a onClick={() => act.mutate({ method: 'put', url: `/admin/explore/comments/${r.id}/status`, body: { status: 'visible' } })}>Hiện lại</a>}
            {r.reports > 0 && <a onClick={() => act.mutate({ method: 'put', url: `/admin/explore/comments/${r.id}/keep`, body: {} })}>Giữ lại</a>}
            <a onClick={() => act.mutate({ method: 'put', url: `/admin/explore/users/${r.userId}/comment-ban`, body: { banned: !r.banned, reason: 'Admin khóa bình luận' } })}>{r.banned ? 'Mở khóa bình luận' : 'Khóa bình luận người này'}</a>
          </Space>
        ) },
      ]} />
    </>
  )
}

function Settings() {
  const qc = useQueryClient()
  const [form] = Form.useForm()
  const { data } = useQuery({ queryKey: ['admin-explore-settings'], queryFn: () => client.get('/admin/explore/settings').then(r => r.data?.data ?? null) })
  useEffect(() => { if (data) form.setFieldsValue(data) }, [data, form])
  const save = useMutation({
    mutationFn: v => client.put('/admin/explore/settings', v).then(r => r.data),
    onSuccess: () => { message.success('Đã lưu'); qc.invalidateQueries({ queryKey: ['admin-explore-settings'] }) },
  })
  return (
    <Form form={form} layout="vertical" onFinish={v => save.mutate(v)} style={{ maxWidth: 520 }}>
      <Form.Item name="enabled" label="Bật Khám phá" valuePropName="checked"><Switch /></Form.Item>
      <Form.Item name="commentsEnabled" label="Cho phép bình luận" valuePropName="checked"><Switch /></Form.Item>
      <Form.Item name="commentsPerMinute" label="Số bình luận tối đa mỗi phút (0 = không giới hạn)"><InputNumber min={0} max={60} /></Form.Item>
      <Form.Item name="bannedWords" label="Từ bị chặn trong bình luận (cách nhau bằng dấu phẩy hoặc xuống dòng, không phân biệt dấu)"><Input.TextArea rows={4} /></Form.Item>
      <Button type="primary" htmlType="submit" loading={save.isPending}>Lưu</Button>
    </Form>
  )
}

export default function Explore() {
  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={4}>Khám phá</Typography.Title>
      <Alert type="info" showIcon style={{ marginBottom: 16 }} message="Người chơi lướt từng bài toàn màn hình ở Vui học > Khám phá. Bài mới ở trạng thái Nháp cho đến khi bạn chọn Đang hiện." />
      <Card>
        <Tabs items={[
          { key: 'posts', label: 'Bài viết', children: <Posts /> },
          { key: 'comments', label: 'Bình luận', children: <Comments /> },
          { key: 'settings', label: 'Cấu hình', children: <Settings /> },
        ]} />
      </Card>
    </div>
  )
}
