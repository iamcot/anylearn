import { Alert, Avatar, Button, Card, Col, Drawer, Form, Input, InputNumber, Modal, Popconfirm, Progress, Radio, Row, Select, Space, Spin, Statistic, Switch, Table, Tabs, Tag, Typography, Upload, message } from 'antd'
import { UploadOutlined, VideoCameraAddOutlined } from '@ant-design/icons'
import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import { fmtDateTime } from '../utils/format'
import { cancelVideoUpload, startVideoUpload, useVideoUploads } from '../utils/videoUploads'
import ExploreCoursePick from '../components/ExploreCoursePick'
import ExploreTagSelect from '../components/ExploreTagSelect'

const KINDS = { article: 'Bài viết', image: 'Hình ảnh', video: 'Clip' }
const STATUS = { draft: ['Nháp', 'default'], pending: ['Chờ duyệt', 'orange'], published: ['Đang hiện', 'green'], hidden: ['Ẩn', 'red'], rejected: ['Từ chối', 'volcano'] }
const LEVELS = { creator: ['Creator', 'Mỗi bài cần admin duyệt', 'blue'], s_creator: ['S-creator', 'Tự đăng, không cần duyệt', 'purple'] }

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
    if (open) form.setFieldsValue(post ? { tagIds: [], ...post } : { kind: 'article', status: 'draft', pinned: false, title: '', body: '', mediaUrl: '', posterUrl: '', itemId: null, tagIds: [] })
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
      {post?.authorId && <Alert type="info" showIcon style={{ marginBottom: 12 }} message={`Bài của creator ${post.authorFullName ?? ''}. Khi bạn lưu, creator sẽ nhận thông báo.`} />}
      {post?.reviewNote && <Alert type="warning" showIcon style={{ marginBottom: 12 }} message={`Ghi chú duyệt: ${post.reviewNote}`} />}
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
              {kind === 'video' && bunny?.enabled && (
                <Upload showUploadList={false} accept="video/*" disabled={uploads.length > 0} beforeUpload={file => { uploadVideo(file); return false }}>
                  <Button icon={<VideoCameraAddOutlined />} disabled={uploads.length > 0}>Tải video lên</Button>
                </Upload>
              )}
              {kind === 'video' && uploads.map(u => (
                <div key={u.id}>
                  <Progress percent={u.percent} size="small" />
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    Bạn có thể đóng form hoặc sang trang khác, video vẫn tiếp tục tải (đừng đóng tab). <a onClick={() => cancelVideoUpload(u.id)}>Hủy tải</a>
                  </Typography.Text>
                </div>
              ))}
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
        <Form.Item name="tagIds" label="Tags"><ExploreTagSelect /></Form.Item>
        <Form.Item name="itemId" label="Gắn khóa học (tùy chọn)">
          <ExploreCoursePick preset={post?.itemId ? { id: post.itemId, title: post.itemTitle, image: post.itemImage, price: post.itemPrice } : null} />
        </Form.Item>
        <Form.Item name="status" label="Trạng thái"><Select options={Object.entries(STATUS).map(([value, [label]]) => ({ value, label }))} /></Form.Item>
        <Form.Item name="pinned" label="Ghim lên đầu" valuePropName="checked"><Switch /></Form.Item>
        <Button type="primary" htmlType="submit" loading={save.isPending}>Lưu</Button>
      </Form>
    </Drawer>
  )
}

// A small picture to recognise a post: the photo, the clip's poster, a YouTube thumbnail, or a letter box for an article.
function thumbOf(r) {
  if (r.kind === 'image') return r.mediaUrl
  if (r.posterUrl) return r.posterUrl
  const yt = String(r.mediaUrl ?? '').match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,15})/)
  if (yt) return `https://img.youtube.com/vi/${yt[1]}/mqdefault.jpg`
  if (/\/playlist\.m3u8/i.test(String(r.mediaUrl ?? ''))) return String(r.mediaUrl).replace(/playlist\.m3u8.*$/i, 'thumbnail.jpg')
  return null
}

function Thumb({ post }) {
  const url = thumbOf(post)
  const box = { width: 56, height: 56, borderRadius: 6, objectFit: 'cover', background: '#f0f0f0', display: 'grid', placeItems: 'center', color: '#999', fontSize: 12, flexShrink: 0 }
  if (url) return <img src={url} alt="" style={box} loading="lazy" onError={e => { e.currentTarget.style.visibility = 'hidden' }} />
  return <div style={box}>{post.kind === 'article' ? 'Aa' : post.kind === 'video' ? '▶' : '🖼'}</div>
}

function ReviewModal({ review, onClose, refresh }) {
  const [note, setNote] = useState('')
  useEffect(() => { setNote('') }, [review])
  const act = useMutation({
    mutationFn: ({ id, action, note }) => client.put(`/admin/explore/posts/${id}/review`, { action, note }).then(r => r.data),
    onSuccess: res => {
      if (res.resultCode !== 1) return message.error(res.message)
      message.success('Đã cập nhật, creator đã nhận thông báo')
      refresh()
      onClose()
    },
  })
  const reject = review?.action === 'reject'
  return (
    <Modal open={!!review} onCancel={onClose} title={reject ? 'Từ chối bài' : 'Ẩn bài của creator'} okText={reject ? 'Từ chối' : 'Ẩn bài'} okButtonProps={{ danger: true, loading: act.isPending }}
      onOk={() => act.mutate({ id: review.post.id, action: review.action, note })}>
      <Typography.Paragraph>“{review?.post.title}”</Typography.Paragraph>
      <Input.TextArea rows={3} maxLength={255} value={note} onChange={e => setNote(e.target.value)}
        placeholder={reject ? 'Lý do (bắt buộc), creator sẽ đọc để sửa lại' : 'Lý do (tùy chọn), creator sẽ thấy'} />
    </Modal>
  )
}

function Posts({ data, refresh, onEdit }) {
  const [review, setReview] = useState(null)
  const [author, setAuthor] = useState('')
  const quick = useMutation({
    mutationFn: ({ id, action }) => client.put(`/admin/explore/posts/${id}/review`, { action }).then(r => r.data),
    onSuccess: res => { if (res.resultCode !== 1) message.error(res.message); else message.success('Đã cập nhật, creator đã nhận thông báo'); refresh() },
  })
  const uploading = Object.fromEntries(useVideoUploads().map(u => [u.postId, u.percent]))
  const [q, setQ] = useState('')
  const [kind, setKind] = useState('')
  const [status, setStatus] = useState('')
  const del = useMutation({ mutationFn: id => client.delete(`/admin/explore/posts/${id}`).then(r => r.data), onSuccess: () => { message.success('Đã xóa'); refresh() } })
  // the save endpoint replaces the whole post, so the switch sends the row with only its status changed
  const toggle = useMutation({
    mutationFn: ({ r, publish }) => client.put(`/admin/explore/posts/${r.id}`, {
      kind: r.kind, title: r.title, body: r.body, mediaUrl: r.mediaUrl, posterUrl: r.posterUrl, itemId: r.itemId, pinned: r.pinned, status: publish ? 'published' : 'draft',
    }).then(res => res.data),
    onSuccess: (res, { publish }) => {
      if (res.resultCode !== 1) message.error(res.message)
      else message.success(publish ? 'Đã hiện bài' : 'Đã chuyển về Nháp')
      refresh()
    },
  })
  const needle = q.trim().toLowerCase()
  const rows = (data?.items ?? []).filter(r => (!kind || r.kind === kind) && (!status || r.status === status) && (!needle || String(r.title ?? '').toLowerCase().includes(needle))
    && (!author || (author === 'admin' ? !r.authorId : author === 'creators' ? !!r.authorId : String(r.authorId) === author)))
  const authors = [...new Map((data?.items ?? []).filter(r => r.authorId).map(r => [r.authorId, r.authorFullName])).entries()]
  return (
    <>
      <Space wrap style={{ marginBottom: 12 }}>
        <Input.Search allowClear placeholder="Tìm theo tiêu đề" style={{ width: 240 }} onSearch={setQ} onChange={e => { if (!e.target.value) setQ('') }} />
        <Select allowClear placeholder="Loại bài" style={{ width: 140 }} value={kind || undefined} onChange={v => setKind(v || '')} options={Object.entries(KINDS).map(([value, label]) => ({ value, label }))} />
        <Select allowClear placeholder="Trạng thái" style={{ width: 150 }} value={status || undefined} onChange={v => setStatus(v || '')} options={Object.entries(STATUS).map(([value, [label]]) => ({ value, label }))} />
        <Select allowClear placeholder="Người đăng" style={{ width: 180 }} value={author || undefined} onChange={v => setAuthor(v || '')}
          options={[{ value: 'admin', label: 'anyLEARN (admin)' }, { value: 'creators', label: 'Tất cả creator' }, ...authors.map(([id, name]) => ({ value: String(id), label: name }))]} />
        <Typography.Text type="secondary">{rows.length} bài</Typography.Text>
      </Space>
      <ReviewModal review={review} onClose={() => setReview(null)} refresh={refresh} />
      <Table rowKey="id" dataSource={rows} pagination={{ pageSize: 20 }} columns={[
        { title: 'Tiêu đề', dataIndex: 'title', render: (t, r) => (
          <Space>
            <Thumb post={r} />
            <span>{r.pinned ? '📌 ' : ''}{t}</span>
          </Space>
        ) },
        { title: 'Loại', dataIndex: 'kind', render: k => KINDS[k] },
        { title: 'Người đăng', key: 'author', render: (_, r) => (r.authorId ? <span>{r.authorFullName}<br /><Typography.Text type="secondary" style={{ fontSize: 12 }}>{r.authorPhone}</Typography.Text></span> : <Typography.Text type="secondary">anyLEARN</Typography.Text>) },
        { title: 'Trạng thái', dataIndex: 'status', render: (s, r) => {
          if (r.id in uploading) return <Tag color="processing">Đang tải video {uploading[r.id]}%</Tag>
          if (r.authorId) {
            const busy = quick.isPending && quick.variables?.id === r.id
            return (
              <Space direction="vertical" size={4}>
                <Space size={4}>
                  <Tag color={STATUS[s]?.[1]}>{s === 'draft' && r.afterUpload ? 'Đang tải clip' : STATUS[s]?.[0] ?? s}</Tag>
                  {s === 'hidden' && <Typography.Text type="secondary" style={{ fontSize: 12 }}>{r.hiddenBy === 'admin' ? 'admin ẩn' : 'creator ẩn'}</Typography.Text>}
                </Space>
                {r.reviewNote && (s === 'rejected' || s === 'hidden') && <Typography.Text type="secondary" style={{ fontSize: 12 }}>{r.reviewNote}</Typography.Text>}
                <Space size={8}>
                  {s === 'pending' && <Button size="small" type="primary" loading={busy} onClick={() => quick.mutate({ id: r.id, action: 'approve' })}>Duyệt</Button>}
                  {s === 'pending' && <Button size="small" danger onClick={() => setReview({ post: r, action: 'reject' })}>Từ chối</Button>}
                  {s === 'published' && <Button size="small" danger onClick={() => setReview({ post: r, action: 'hide' })}>Ẩn</Button>}
                  {s === 'hidden' && <Button size="small" loading={busy} onClick={() => quick.mutate({ id: r.id, action: 'show' })}>Hiện lại</Button>}
                </Space>
              </Space>
            )
          }
          return (
            <Space>
              <Switch size="small" checked={s === 'published'} checkedChildren="Hiện" unCheckedChildren="Nháp"
                loading={toggle.isPending && toggle.variables?.r.id === r.id}
                onChange={publish => toggle.mutate({ r, publish })} />
              {s === 'hidden' && <Tag color="red">Ẩn</Tag>}
            </Space>
          )
        } },
        { title: 'Xem', dataIndex: 'views' }, { title: 'Thích', dataIndex: 'likes' }, { title: 'Chia sẻ', dataIndex: 'shares' }, { title: 'Bình luận', dataIndex: 'comments' },
        { title: 'Ngày đăng', dataIndex: 'publishedAt', render: v => (v ? fmtDateTime(v) : '') },
        { title: '', key: 'a', render: (_, r) => (
          <Space>
            <a onClick={() => onEdit(r)}>Sửa</a>
            <Popconfirm title={r.authorId ? 'Xóa bài của creator này (cùng bình luận, video và hình)? Creator sẽ nhận thông báo.' : 'Xóa bài này cùng bình luận, video và hình của nó?'} onConfirm={() => del.mutate(r.id)}><a>Xóa</a></Popconfirm>
          </Space>
        ) },
      ]} />
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

function Creators() {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')
  const [level, setLevel] = useState('creator')
  useEffect(() => { const t = setTimeout(() => setDebounced(q.trim()), 300); return () => clearTimeout(t) }, [q])
  const { data: list, isLoading } = useQuery({ queryKey: ['admin-explore-creators'], queryFn: () => client.get('/admin/explore/creators').then(r => r.data?.data ?? []) })
  const { data: found, isFetching } = useQuery({
    queryKey: ['admin-explore-creator-search', debounced],
    queryFn: () => client.get('/admin/explore/creators/user-search', { params: { q: debounced } }).then(r => r.data?.data ?? []),
    enabled: debounced.length >= 2,
  })
  const refresh = () => { qc.invalidateQueries({ queryKey: ['admin-explore-creators'] }); qc.invalidateQueries({ queryKey: ['admin-explore-creator-search'] }) }
  const set = useMutation({
    mutationFn: ({ userId, level }) => client.put(`/admin/explore/creators/${userId}`, { level }).then(r => r.data),
    onSuccess: res => { if (res.resultCode !== 1) return message.error(res.message); message.success('Đã lưu'); refresh() },
  })
  const remove = useMutation({
    mutationFn: userId => client.delete(`/admin/explore/creators/${userId}`).then(r => r.data),
    onSuccess: () => { message.success('Đã gỡ quyền đăng bài'); refresh() },
  })
  const levelSelect = (value, onChange) => <Select size="small" style={{ width: 130 }} value={value} onChange={onChange} options={Object.entries(LEVELS).map(([v, [label]]) => ({ value: v, label }))} />
  return (
    <>
      <Alert type="info" showIcon style={{ marginBottom: 12 }} message="Creator đăng bài từ trang Vui học > Khám phá > Bài đăng của tôi."
        description="Creator: mỗi bài mới hoặc bài sửa phải chờ admin duyệt ở tab Bài viết. S-creator: tự đăng không cần duyệt (admin vẫn ẩn được). Mọi người nhận thông báo admin đều được báo khi có bài mới." />
      <Card size="small" title="Thêm creator" style={{ marginBottom: 16 }}>
        <Space wrap style={{ marginBottom: 8 }}>
          <Input.Search allowClear placeholder="Tìm thành viên theo tên, SĐT hoặc email" style={{ width: 340 }} value={q} onChange={e => setQ(e.target.value)} />
          <span>Thêm với loại</span>{levelSelect(level, setLevel)}
          {isFetching && <Spin size="small" />}
        </Space>
        {debounced.length >= 2 && (
          <Table size="small" rowKey="id" pagination={false} dataSource={found ?? []} locale={{ emptyText: 'Không thấy thành viên' }} columns={[
            { title: 'Thành viên', key: 'u', render: (_, u) => <Space><Avatar src={u.image} size="small">{u.name?.[0]}</Avatar>{u.name}</Space> },
            { title: 'SĐT', dataIndex: 'phone' }, { title: 'Email', dataIndex: 'email' }, { title: 'Vai trò', dataIndex: 'role' },
            { title: '', key: 'a', render: (_, u) => (u.level
              ? <Tag color={LEVELS[u.level]?.[2]}>Đã là {LEVELS[u.level]?.[0]}</Tag>
              : <Button size="small" type="primary" loading={set.isPending && set.variables?.userId === u.id} onClick={() => set.mutate({ userId: u.id, level })}>+ Thêm</Button>) },
          ]} />
        )}
      </Card>
      <Table rowKey="userId" loading={isLoading} dataSource={list ?? []} locale={{ emptyText: 'Chưa có creator nào' }} columns={[
        { title: 'Creator', key: 'u', render: (_, c) => <Space><Avatar src={c.image}>{c.name?.[0]}</Avatar><span>{c.name}<br /><Typography.Text type="secondary" style={{ fontSize: 12 }}>{c.phone}</Typography.Text></span></Space> },
        { title: 'Loại', dataIndex: 'level', render: (l, c) => <Space direction="vertical" size={0}>{levelSelect(l, v => set.mutate({ userId: c.userId, level: v }))}<Typography.Text type="secondary" style={{ fontSize: 12 }}>{LEVELS[l]?.[1]}</Typography.Text></Space> },
        { title: 'Bài', dataIndex: 'posts' }, { title: 'Đang hiện', dataIndex: 'published' },
        { title: 'Chờ duyệt', dataIndex: 'pending', render: n => (n ? <Tag color="orange">{n}</Tag> : 0) },
        { title: 'Thêm lúc', dataIndex: 'createdAt', render: fmtDateTime },
        { title: '', key: 'a', render: (_, c) => <Popconfirm title="Gỡ quyền đăng bài? Các bài đã đăng vẫn giữ nguyên." onConfirm={() => remove.mutate(c.userId)}><a>Gỡ</a></Popconfirm> },
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

const NEW_POST = { status: 'draft', pinned: false, title: '', body: '', mediaUrl: '', posterUrl: '', itemId: null, tagIds: [] }
const NEW_BUTTONS = [['article', '+ Viết bài'], ['image', '+ Đăng hình ảnh'], ['video', '+ Đăng clip']]

export default function Explore() {
  const qc = useQueryClient()
  const [tab, setTab] = useState('posts')
  const [editing, setEditing] = useState(null)
  const [open, setOpen] = useState(false)
  const { data } = useQuery({ queryKey: ['admin-explore-posts'], queryFn: () => client.get('/admin/explore/posts').then(r => r.data?.data ?? null) })
  const refresh = () => { qc.invalidateQueries({ queryKey: ['admin-explore-posts'] }); qc.invalidateQueries({ queryKey: ['admin-badges'] }) }
  const stats = data?.stats
  const uploads = useVideoUploads()
  const edit = post => { setEditing(post); setOpen(true) }
  const cards = stats ? [
    ['Đang hiện', stats.published], ['Lượt xem', stats.views], ['Lượt thích', stats.likes],
    ['Chia sẻ', stats.shares], ['Bình luận', stats.comments], ['Bài chờ duyệt', stats.pending], ['Báo cáo chờ xử lý', stats.openReports],
  ] : []
  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={4}>Khám phá</Typography.Title>
      <Alert type="info" showIcon style={{ marginBottom: 16 }} message="Người chơi lướt từng bài toàn màn hình ở Vui học > Khám phá. Bài mới ở trạng thái Nháp cho đến khi bạn chọn Đang hiện. Bài của creator chờ duyệt nằm đầu danh sách (Duyệt / Từ chối); xóa bài cũng xóa video trên Bunny và hình trên S3." />
      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          {cards.map(([title, value]) => <Col key={title} xs={12} md={6} xl={3}><Card><Statistic title={title} value={value} /></Card></Col>)}
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
            { key: 'creators', label: 'Creator', children: <Creators /> },
            { key: 'comments', label: 'Bình luận', children: <Comments /> },
            { key: 'settings', label: 'Cấu hình', children: <Settings /> },
          ]} />
      </Card>
      <PostDrawer post={editing} open={open} onClose={() => setOpen(false)} onSaved={refresh} />
    </div>
  )
}
