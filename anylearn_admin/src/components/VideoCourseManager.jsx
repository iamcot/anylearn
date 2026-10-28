import {
  Alert, App, Button, Card, Drawer, Empty, Form, Input, InputNumber, Modal, Popconfirm, Radio, Select, Space, Switch, Tag, Tooltip, Typography, Upload,
} from 'antd'
import {
  ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, EditOutlined, MinusCircleOutlined, PlusOutlined, ReloadOutlined, SettingOutlined, UploadOutlined,
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import client from '../api/client'
import ImageUpload from './ImageUpload'
import { startVideoUpload, useVideoUploads } from '../utils/videoUploads'

// Tab "Nội dung video" of a course whose format is video (plan 17): chapters, lessons, "Xem thử miễn phí", Bunny uploads.
const TYPES = { video: 'Video', link: 'Link ngoài', text: 'Bài đọc' }
const VIDEO_STATUS = {
  uploading: ['Đang tải lên', 'blue'], processing: ['Bunny đang xử lý', 'orange'], ready: ['Sẵn sàng', 'green'], failed: ['Lỗi video', 'red'],
}

function fmtDuration(sec) {
  if (!sec) return ''
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`
}

function move(list, index, delta) {
  const next = [...list]
  const to = index + delta
  if (to < 0 || to >= next.length) return list
  ;[next[index], next[to]] = [next[to], next[index]]
  return next
}

function ChapterModal({ open, chapter, onClose, onSave, saving }) {
  const [form] = Form.useForm()
  return (
    <Modal open={open} title={chapter?.id ? 'Sửa chương' : 'Thêm chương'} onCancel={onClose} okText="Lưu" confirmLoading={saving} destroyOnClose
      afterOpenChange={v => v && form.setFieldsValue({ title: chapter?.title ?? '', description: chapter?.description ?? '' })}
      onOk={() => form.validateFields().then(onSave)}>
      <Form form={form} layout="vertical">
        <Form.Item name="title" label="Tên chương" rules={[{ required: true, message: 'Nhập tên chương' }]}><Input maxLength={191} /></Form.Item>
        <Form.Item name="description" label="Mô tả ngắn"><Input.TextArea rows={3} /></Form.Item>
      </Form>
    </Modal>
  )
}

function LessonDrawer({ open, lesson, chapters, uploadEnabled, onClose, onSaved, itemId }) {
  const [form] = Form.useForm()
  const [file, setFile] = useState(null)
  const { message } = App.useApp()
  const type = Form.useWatch('type', form)
  const [saving, setSaving] = useState(false)

  const init = () => {
    setFile(null)
    form.setFieldsValue({
      chapterId: lesson?.chapterId, title: lesson?.title ?? '', description: lesson?.description ?? '', type: lesson?.type ?? 'video',
      typeValue: lesson?.typeValue ?? '', free: !!Number(lesson?.isFree ?? 0), visible: lesson?.id ? Number(lesson.status) === 1 : true,
      posterUrl: lesson?.posterUrl ?? '',
      durationMinutes: lesson?.type !== 'video' && lesson?.durationSeconds ? Math.round(lesson.durationSeconds / 60) : null,
      attachments: lesson?.attachments ?? [],
    })
  }

  const save = async () => {
    const v = await form.validateFields()
    setSaving(true)
    try {
      const body = { ...v, durationSeconds: v.durationMinutes ? v.durationMinutes * 60 : null }
      delete body.durationMinutes
      const res = await (lesson?.id
        ? client.put(`/admin/items/${itemId}/video/lessons/${lesson.id}`, body)
        : client.post(`/admin/items/${itemId}/video/lessons`, body)).then(r => r.data)
      if (res.resultCode !== 1) return message.error(res.message)
      const lessonId = res.data.id
      if (v.type === 'video' && file) {
        startVideoUpload({
          postId: `lesson-${lessonId}`, title: v.title, file,
          createPath: `/admin/items/${itemId}/video/lessons/${lessonId}/upload`,
          attach: () => client.post(`/admin/items/${itemId}/video/lessons/${lessonId}/uploaded`),
          doneText: `Video "${v.title}" đã tải xong. Bunny cần vài phút xử lý, sau đó bài sẽ "Sẵn sàng".`,
        })
      }
      message.success('Đã lưu bài học')
      onSaved()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer open={open} width={560} title={lesson?.id ? 'Sửa bài học' : 'Thêm bài học'} onClose={onClose} destroyOnClose
      afterOpenChange={v => v && init()}
      extra={<Button type="primary" loading={saving} onClick={save}>Lưu</Button>}>
      <Form form={form} layout="vertical">
        <Form.Item name="chapterId" label="Chương" rules={[{ required: true, message: 'Chọn chương' }]}>
          <Select options={chapters.map(c => ({ value: c.id, label: c.title }))} />
        </Form.Item>
        <Form.Item name="title" label="Tiêu đề bài" rules={[{ required: true, message: 'Nhập tiêu đề' }]}><Input maxLength={191} /></Form.Item>
        <Form.Item name="description" label="Mô tả / nội dung chính của bài"><Input.TextArea rows={4} /></Form.Item>
        <Form.Item name="type" label="Loại bài">
          <Radio.Group optionType="button" options={Object.entries(TYPES).map(([value, label]) => ({ value, label }))} />
        </Form.Item>
        {type === 'video' && (
          <Form.Item label="File video" extra={lesson?.videoId ? `Đang có video (${VIDEO_STATUS[lesson.videoStatus]?.[0] ?? lesson.videoStatus ?? 'chưa rõ'}${lesson.durationSeconds ? `, ${fmtDuration(lesson.durationSeconds)}` : ''}). Chọn file mới để thay.` : 'Tải xong Bunny cần vài phút xử lý; thời lượng tự điền.'}>
            {uploadEnabled
              ? (
                <Upload accept="video/*" maxCount={1} beforeUpload={f => { setFile(f); return false }} onRemove={() => setFile(null)} fileList={file ? [file] : []}>
                  <Button icon={<UploadOutlined />}>Chọn file video</Button>
                </Upload>
              )
              : <Alert type="warning" showIcon message="Chưa cấu hình Bunny Stream trên server, chưa tải video được. Dùng loại Link ngoài trong lúc chờ." />}
          </Form.Item>
        )}
        {type === 'link' && (
          <Form.Item name="typeValue" label="Link video (YouTube, Vimeo…)" rules={[{ required: true, message: 'Dán link' }]}
            extra="Link ngoài ai có link đều xem được, chỉ nên dùng cho bài xem thử."><Input placeholder="https://..." /></Form.Item>
        )}
        {type === 'text' && (
          <Form.Item name="typeValue" label="Nội dung bài đọc" rules={[{ required: true, message: 'Nhập nội dung' }]}><Input.TextArea rows={8} /></Form.Item>
        )}
        {type !== 'video' && (
          <Form.Item name="durationMinutes" label="Thời lượng (phút)"><InputNumber min={1} max={600} /></Form.Item>
        )}
        <Space size="large">
          <Form.Item name="free" label="Xem thử miễn phí" valuePropName="checked" tooltip="Ai cũng xem được bài này, kể cả khách chưa đăng nhập"><Switch /></Form.Item>
          <Form.Item name="visible" label="Hiện bài" valuePropName="checked"><Switch /></Form.Item>
        </Space>
        <Form.Item name="posterUrl" label="Ảnh bìa (bỏ trống = ảnh Bunny tự cắt từ video)"><ImageUpload /></Form.Item>
        <Typography.Text strong>Tài liệu kèm bài</Typography.Text>
        <Form.List name="attachments">
          {(fields, { add, remove }) => (
            <div style={{ marginTop: 8 }}>
              {fields.map(f => (
                <Space key={f.key} align="baseline" style={{ display: 'flex' }}>
                  <Form.Item name={[f.name, 'name']} style={{ marginBottom: 8 }}><Input placeholder="Tên tài liệu" style={{ width: 180 }} /></Form.Item>
                  <Form.Item name={[f.name, 'url']} style={{ marginBottom: 8 }} rules={[{ required: true, message: 'Dán link' }]}><Input placeholder="https://..." style={{ width: 260 }} /></Form.Item>
                  <MinusCircleOutlined onClick={() => remove(f.name)} />
                </Space>
              ))}
              <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => add({ name: '', url: '' })}>Thêm tài liệu</Button>
            </div>
          )}
        </Form.List>
      </Form>
    </Drawer>
  )
}

function SettingsModal({ open, onClose }) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const { data } = useQuery({
    queryKey: ['admin-video-settings'], enabled: open,
    queryFn: () => client.get('/admin/video/settings').then(r => r.data?.data),
  })
  const save = useMutation({
    mutationFn: numbers => client.put('/admin/video/settings', { numbers }).then(r => r.data),
    onSuccess: res => {
      if (res.resultCode !== 1) return message.error(res.message)
      message.success('Đã lưu cài đặt')
      onClose()
    },
  })
  const groups = {}
  ;(data?.fields ?? []).forEach(f => { (groups[f.group] ||= []).push(f) })
  return (
    <Modal open={open} title="Cài đặt chung khóa học video" onCancel={onClose} okText="Lưu" confirmLoading={save.isPending} width={620}
      afterOpenChange={v => v && data && form.setFieldsValue(data.numbers)}
      onOk={() => form.validateFields().then(v => save.mutate(v))}>
      {data && (
        <Form form={form} layout="horizontal" labelCol={{ span: 16 }} initialValues={data.numbers}>
          {Object.entries(groups).map(([group, fields]) => (
            <div key={group}>
              <Typography.Title level={5}>{group}</Typography.Title>
              {fields.map(f => (
                <Form.Item key={f.key} name={f.key} label={f.label}><InputNumber min={f.min} max={f.max} /></Form.Item>
              ))}
            </div>
          ))}
        </Form>
      )}
    </Modal>
  )
}

export default function VideoCourseManager({ itemId }) {
  const { message } = App.useApp()
  const qc = useQueryClient()
  const uploads = useVideoUploads()
  const [chapterModal, setChapterModal] = useState(null)
  const [lessonDrawer, setLessonDrawer] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-video-course', itemId],
    queryFn: () => client.get(`/admin/items/${itemId}/video`).then(r => r.data?.data),
    // while Bunny is processing a video, ask again every 20 seconds
    refetchInterval: q => ((q.state.data?.chapters ?? []).some(c => c.lessons.some(l => ['uploading', 'processing'].includes(l.videoStatus))) ? 20000 : false),
  })
  const chapters = data?.chapters ?? []
  const reload = () => qc.invalidateQueries({ queryKey: ['admin-video-course', itemId] })
  const call = async (promise, ok) => {
    const res = await promise.then(r => r.data)
    if (res.resultCode !== 1) return message.error(res.message, 6)
    if (ok) message.success(ok)
    reload()
  }

  const saveChapter = useMutation({
    mutationFn: v => (chapterModal?.id
      ? client.put(`/admin/items/${itemId}/video/chapters/${chapterModal.id}`, v)
      : client.post(`/admin/items/${itemId}/video/chapters`, v)).then(r => r.data),
    onSuccess: res => {
      if (res.resultCode !== 1) return message.error(res.message)
      setChapterModal(null)
      reload()
    },
  })

  const saveOrder = next => call(client.put(`/admin/items/${itemId}/video/order`, {
    chapters: next.map(c => ({ id: c.id, lessonIds: c.lessons.map(l => l.id) })),
  }))

  const uploadingOf = lessonId => uploads.find(u => u.postId === `lesson-${lessonId}`)

  if (isLoading) return null
  const s = data?.summary ?? {}
  let lessonNo = 0

  return (
    <div style={{ paddingBottom: 32, maxWidth: 980 }}>
      {!data?.uploadEnabled && (
        <Alert type="warning" showIcon style={{ marginBottom: 12 }}
          message="Server chưa cấu hình Bunny Stream: chưa tải video lên được. Bài loại Link ngoài và Bài đọc vẫn dùng được." />
      )}
      {data?.uploadEnabled && !data?.signed && (
        <Alert type="warning" showIcon style={{ marginBottom: 12 }}
          message="Link video chưa được ký (thiếu thư viện Bunny riêng cho khóa học): ai có link phát đều xem được. Cần đặt các biến BUNNY_COURSE_* trên server." />
      )}
      <Card size="small" style={{ marginBottom: 12 }}>
        <Space wrap style={{ justifyContent: 'space-between', width: '100%' }}>
          <Space wrap>
            <Tag>{s.chapters ?? 0} chương</Tag>
            <Tag>{s.lessons ?? 0} bài</Tag>
            {s.durationText && <Tag>{s.durationText}</Tag>}
            <Tag color="green">{s.freeLessons ?? 0} bài xem thử</Tag>
            {s.lessons > s.playable && <Tag color="orange">{s.lessons - s.playable} bài chưa phát được</Tag>}
            {s.failed > 0 && <Tag color="red">{s.failed} video lỗi</Tag>}
          </Space>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Làm mới</Button>
            <Button icon={<SettingOutlined />} onClick={() => setSettingsOpen(true)}>Cài đặt chung</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setChapterModal({})}>Thêm chương</Button>
          </Space>
        </Space>
      </Card>

      {chapters.length === 0 && <Empty description="Chưa có chương nào. Bấm “Thêm chương” để bắt đầu." />}

      {chapters.map((ch, ci) => (
        <Card key={ch.id} size="small" style={{ marginBottom: 12, opacity: Number(ch.status) === 1 ? 1 : 0.6 }}
          title={<Space><span>Chương {ci + 1}: {ch.title}</span>{Number(ch.status) !== 1 && <Tag>Đang ẩn</Tag>}</Space>}
          extra={(
            <Space size={4}>
              <Tooltip title="Lên"><Button size="small" icon={<ArrowUpOutlined />} disabled={ci === 0} onClick={() => saveOrder(move(chapters, ci, -1))} /></Tooltip>
              <Tooltip title="Xuống"><Button size="small" icon={<ArrowDownOutlined />} disabled={ci === chapters.length - 1} onClick={() => saveOrder(move(chapters, ci, 1))} /></Tooltip>
              <Button size="small" icon={<EditOutlined />} onClick={() => setChapterModal(ch)} />
              <Button size="small" onClick={() => call(client.put(`/admin/items/${itemId}/video/chapters/${ch.id}`, { title: ch.title, description: ch.description, visible: Number(ch.status) !== 1 }))}>
                {Number(ch.status) === 1 ? 'Ẩn' : 'Hiện'}
              </Button>
              <Popconfirm title="Xóa chương này?" description="Chỉ xóa được chương không còn bài." onConfirm={() => call(client.delete(`/admin/items/${itemId}/video/chapters/${ch.id}`), 'Đã xóa chương')}>
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Space>
          )}>
          {ch.description && <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>{ch.description}</Typography.Paragraph>}
          {ch.lessons.map((l, li) => {
            lessonNo += 1
            const up = uploadingOf(l.id)
            const st = VIDEO_STATUS[l.videoStatus]
            return (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderTop: li ? '1px solid #f0f0f0' : 'none', opacity: Number(l.status) === 1 ? 1 : 0.55, flexWrap: 'wrap' }}>
                <Typography.Text type="secondary" style={{ width: 52 }}>Bài {lessonNo}</Typography.Text>
                {l.thumbUrl ? <img src={l.thumbUrl} alt="" style={{ width: 64, height: 36, objectFit: 'cover', borderRadius: 4, background: '#eee' }} /> : <div style={{ width: 64, height: 36, background: '#f5f5f5', borderRadius: 4 }} />}
                <div style={{ flex: 1, minWidth: 180 }}>
                  <Typography.Text strong>{l.title}</Typography.Text>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
                    <Tag>{TYPES[l.type] ?? l.type}</Tag>
                    {l.durationSeconds ? <Tag>{fmtDuration(l.durationSeconds)}</Tag> : null}
                    {up ? <Tag color="blue">Đang tải {up.percent}%</Tag> : st ? <Tag color={st[1]}>{st[0]}</Tag> : (l.type === 'video' && <Tag color="orange">Chưa có video</Tag>)}
                    {Number(l.status) !== 1 && <Tag>Đang ẩn</Tag>}
                  </div>
                </div>
                <Tooltip title="Ai cũng xem được bài này, kể cả khách chưa đăng ký">
                  <Space size={4}>
                    <Switch size="small" checked={!!Number(l.isFree)} onChange={v => call(client.put(`/admin/items/${itemId}/video/lessons/${l.id}/flags`, { free: v }))} />
                    <span style={{ fontSize: 12 }}>Xem thử</span>
                  </Space>
                </Tooltip>
                <Space size={4}>
                  <Switch size="small" checked={Number(l.status) === 1} onChange={v => call(client.put(`/admin/items/${itemId}/video/lessons/${l.id}/flags`, { visible: v }))} />
                  <span style={{ fontSize: 12 }}>Hiện</span>
                </Space>
                <Space size={4}>
                  <Button size="small" icon={<ArrowUpOutlined />} disabled={ci === 0 && li === 0} onClick={() => {
                    const next = chapters.map(c => ({ ...c, lessons: [...c.lessons] }))
                    if (li > 0) next[ci].lessons = move(next[ci].lessons, li, -1)
                    else { next[ci].lessons.shift(); next[ci - 1].lessons.push(l) }
                    saveOrder(next)
                  }} />
                  <Button size="small" icon={<ArrowDownOutlined />} disabled={ci === chapters.length - 1 && li === ch.lessons.length - 1} onClick={() => {
                    const next = chapters.map(c => ({ ...c, lessons: [...c.lessons] }))
                    if (li < ch.lessons.length - 1) next[ci].lessons = move(next[ci].lessons, li, 1)
                    else { next[ci].lessons.pop(); next[ci + 1].lessons.unshift(l) }
                    saveOrder(next)
                  }} />
                  {l.videoId && ['processing', 'uploading', 'failed'].includes(l.videoStatus) && !up && (
                    <Tooltip title="Hỏi lại Bunny"><Button size="small" icon={<ReloadOutlined />} onClick={() => call(client.post(`/admin/items/${itemId}/video/lessons/${l.id}/refresh`))} /></Tooltip>
                  )}
                  <Button size="small" icon={<EditOutlined />} onClick={() => setLessonDrawer(l)} />
                  <Popconfirm title="Xóa bài học này?" description="Video trên Bunny và tiến độ học của bài cũng bị xóa." onConfirm={() => call(client.delete(`/admin/items/${itemId}/video/lessons/${l.id}`), 'Đã xóa bài')}>
                    <Button size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              </div>
            )
          })}
          <Button type="dashed" size="small" icon={<PlusOutlined />} style={{ marginTop: 8 }} onClick={() => setLessonDrawer({ chapterId: ch.id })}>Thêm bài vào chương này</Button>
        </Card>
      ))}

      <ChapterModal open={!!chapterModal} chapter={chapterModal} saving={saveChapter.isPending} onClose={() => setChapterModal(null)} onSave={v => saveChapter.mutate(v)} />
      <LessonDrawer open={!!lessonDrawer} lesson={lessonDrawer} chapters={chapters} uploadEnabled={!!data?.uploadEnabled} itemId={itemId}
        onClose={() => setLessonDrawer(null)} onSaved={reload} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
