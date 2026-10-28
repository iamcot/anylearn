import { Alert, Button, Card, Col, Drawer, Form, Input, InputNumber, Popconfirm, Progress, Radio, Row, Select, Space, Statistic, Switch, Table, Tabs, Tag, Typography, Upload, message } from 'antd'
import { UploadOutlined, VideoCameraAddOutlined } from '@ant-design/icons'
import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import { fmtDateTime } from '../utils/format'
import { cancelVideoUpload, startVideoUpload, useVideoUploads } from '../utils/videoUploads'

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

function PostDrawer({ post, open, onClose, onSaved }) {
  const [form] = Form.useForm()
  const kind = Form.useWatch('kind', form)
  const { data: bunny } = useQuery({ queryKey: ['admin-explore-video-status'], queryFn: () => client.get('/admin/explore/video-upload/status').then(r => r.data?.data ?? { enabled: false }) })
  useEffect(() => {
    if (open) form.setFieldsValue(post ?? { kind: 'article', status: 'draft', pinned: false, title: '', body: '', mediaUrl: '', posterUrl: '', itemId: null })
  }, [open, post, form])
  // Picking a video saves the post as a draft (so the upload has a post to belong to) and starts the upload. The form stays open and shows
  // the progress; if it is closed the upload goes on in the background and attaches the clip to the post when it ends.
  const [createdId, setCreatedId] = useState(null)
  const postId = post?.id ?? createdId
  const mounted = useRef(true)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  useEffect(() => { if (!open) setCreatedId(null) }, [open])
  const uploads = useVideoUploads().filter(u => u.postId === postId)
  const uploadVideo = async file => {
    try {
      await form.validateFields(['title'])
    } catch { return }
    const values = form.getFieldsValue()
    let id = postId
    if (!id) {
      const res = await client.post('/admin/explore/posts', { ...values, kind: 'video', status: 'draft', mediaUrl: '', itemId: values.itemId || null }).then(r => r.data)
      if (res.resultCode !== 1) return message.error(res.message)
      id = res.data.id
      setCreatedId(id)
      onSaved()
    }
    startVideoUpload({
      postId: id, title: values.title, file,
      // when the form is still on screen it takes the new links too, so pressing Lưu afterwards does not wipe them
      onDone: ({ mediaUrl, posterUrl }) => { if (mounted.current) form.setFieldsValue({ mediaUrl, ...(form.getFieldValue('posterUrl') ? {} : { posterUrl }) }) },
    })
  }
  const save = useMutation({
    mutationFn: values => (postId
      ? client.put(`/admin/explore/posts/${postId}`, values)
      : client.post('/admin/explore/posts', values)).then(r => r.data),
    onSuccess: res => {
      if (res.resultCode !== 1) return message.error(res.message)
      message.success('Đã lưu bài')
      onSaved()
      onClose()
    },
  })
  return (
    <Drawer title={postId ? 'Sửa bài' : 'Bài mới'} open={open} onClose={onClose} width={520} destroyOnClose>
      <Form form={form} layout="vertical" onFinish={v => save.mutate({ ...v, itemId: v.itemId || null })}>
        <Form.Item name="kind" label="Loại bài"><Radio.Group options={Object.entries(KINDS).map(([value, label]) => ({ value, label }))} /></Form.Item>
        <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Nhập tiêu đề' }]}><Input maxLength={160} /></Form.Item>
        <Form.Item name="body" label={kind === 'article' ? 'Nội dung' : 'Mô tả ngắn'}><Input.TextArea rows={kind === 'article' ? 8 : 3} maxLength={8000} /></Form.Item>
        {kind !== 'article' && (
          <Form.Item label={kind === 'video' ? 'Đường dẫn clip (tải lên ở dưới, hoặc dán link YouTube, mp4, m3u8 bắt đầu bằng https://)' : 'Hình ảnh'} required>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Form.Item name="mediaUrl" noStyle><Input placeholder="https://..." /></Form.Item>
              {kind === 'image' && <UploadButton onDone={url => form.setFieldValue('mediaUrl', url)} />}
              {kind === 'video' && bunny && !bunny.enabled && <Typography.Text type="secondary">Chưa bật tính năng tải video lên (cần tài khoản Bunny, xem mục Bunny trong hướng dẫn admin). Tạm thời hãy dán link YouTube hoặc link file mp4 vào ô trên.</Typography.Text>}
              {kind === 'video' && bunny?.enabled && <Upload showUploadList={false} accept="video/*" disabled={uploads.length > 0} beforeUpload={file => { uploadVideo(file); return false }}>
                <Button icon={<VideoCameraAddOutlined />} disabled={uploads.length > 0}>Tải video lên</Button>
              </Upload>
              {uploads.map(u => (
                <div key={u.id}>
                  <Progress percent={u.percent} size="small" />
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    Bạn có thể đóng form hoặc sang trang khác, video vẫn tiếp tục tải (đừng đóng tab). <a onClick={() => cancelVideoUpload(u.id)}>Hủy tải</a>
                  </Typography.Text>
                </div>
              ))}}
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

function Posts({ data, refresh, onEdit }) {
  const uploading = Object.fromEntries(useVideoUploads().map(u => [u.postId, u.percent]))
  const del = useMutation({ mutationFn: id => client.delete(`/admin/explore/posts/${id}`).then(r => r.data), onSuccess: () => { message.success('Đã xóa'); refresh() } })
  return (
    <Table rowKey="id" dataSource={data?.items ?? []} pagination={{ pageSize: 20 }} columns={[
      { title: 'Tiêu đề', dataIndex: 'title', render: (t, r) => <span>{r.pinned ? '📌 ' : ''}{t}</span> },
      { title: 'Loại', dataIndex: 'kind', render: k => KINDS[k] },
      { title: 'Trạng thái', dataIndex: 'status', render: (s, r) => (r.id in uploading ? <Tag color="processing">Đang tải video {uploading[r.id]}%</Tag> : <Tag color={STATUS[s]?.[1]}>{STATUS[s]?.[0]}</Tag>) },
      { title: 'Xem', dataIndex: 'views' }, { title: 'Thích', dataIndex: 'likes' }, { title: 'Chia sẻ', dataIndex: 'shares' }, { title: 'Bình luận', dataIndex: 'comments' },
      { title: 'Ngày đăng', dataIndex: 'publishedAt', render: v => (v ? fmtDateTime(v) : '') },
      { title: '', key: 'a', render: (_, r) => (
        <Space>
          <a onClick={() => onEdit(r)}>Sửa</a>
          <Popconfirm title="Xóa bài này cùng bình luận của nó?" onConfirm={() => del.mutate(r.id)}><a>Xóa</a></Popconfirm>
        </Space>
      ) },
    ]} />
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

const NEW_POST = { status: 'draft', pinned: false, title: '', body: '', mediaUrl: '', posterUrl: '', itemId: null }
const NEW_BUTTONS = [['article', '+ Viết bài'], ['image', '+ Đăng hình ảnh'], ['video', '+ Đăng clip']]

export default function Explore() {
  const qc = useQueryClient()
  const [tab, setTab] = useState('posts')
  const [editing, setEditing] = useState(null)
  const [open, setOpen] = useState(false)
  const { data } = useQuery({ queryKey: ['admin-explore-posts'], queryFn: () => client.get('/admin/explore/posts').then(r => r.data?.data ?? null) })
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-explore-posts'] })
  const stats = data?.stats
  const uploads = useVideoUploads()
  const edit = post => { setEditing(post); setOpen(true) }
  const cards = stats ? [
    ['Đang hiện', stats.published], ['Lượt xem', stats.views], ['Lượt thích', stats.likes],
    ['Chia sẻ', stats.shares], ['Bình luận', stats.comments], ['Báo cáo chờ xử lý', stats.openReports],
  ] : []
  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={4}>Khám phá</Typography.Title>
      <Alert type="info" showIcon style={{ marginBottom: 16 }} message="Người chơi lướt từng bài toàn màn hình ở Vui học > Khám phá. Bài mới ở trạng thái Nháp cho đến khi bạn chọn Đang hiện." />
      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          {cards.map(([title, value]) => <Col key={title} xs={12} md={8} xl={4}><Card><Statistic title={title} value={value} /></Card></Col>)}
        </Row>
      )}
      {uploads.length > 0 && (
        <Card size="small" title="Đang tải video lên (chạy nền, bạn có thể sang trang khác nhưng đừng đóng tab)" style={{ marginBottom: 16 }}>
          {uploads.map(u => (
            <Row key={u.id} gutter={12} align="middle">
              <Col flex="260px"><Typography.Text ellipsis>{u.title}</Typography.Text></Col>
              <Col flex="auto"><Progress percent={u.percent} /></Col>
              <Col><Button type="link" danger onClick={() => cancelVideoUpload(u.id)}>Hủy tải</Button></Col>
            </Row>
          ))}
        </Card>
      )}
      <Card>
        <Tabs activeKey={tab} onChange={setTab}
          tabBarExtraContent={tab === 'posts' ? (
            <Space wrap>
              {NEW_BUTTONS.map(([kind, label]) => <Button key={kind} type="primary" onClick={() => edit({ ...NEW_POST, kind })}>{label}</Button>)}
            </Space>
          ) : null}
          items={[
            { key: 'posts', label: 'Bài viết', children: <Posts data={data} refresh={refresh} onEdit={edit} /> },
            { key: 'comments', label: 'Bình luận', children: <Comments /> },
            { key: 'settings', label: 'Cấu hình', children: <Settings /> },
          ]} />
      </Card>
      <PostDrawer post={editing} open={open} onClose={() => setOpen(false)} onSaved={refresh} />
    </div>
  )
}
