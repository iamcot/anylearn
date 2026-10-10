import { Button, Drawer, Form, Input, Select, Space, Switch, Table, Tag, Typography, Upload } from 'antd'
import { CloseOutlined, EditOutlined, SaveOutlined, RightOutlined, UploadOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import { fmtDate, fmtDateTime } from '../utils/format'
import { Field } from '../components/Field'
import RichEditor from '../components/RichEditor'

const TYPE_OPTIONS = [
  { value: 'event', label: 'Sự kiện' },
  { value: 'promotion', label: 'Khuyến mãi' },
  { value: 'read', label: 'Bài đọc' },
  { value: 'video', label: 'Video' },
]
const typeColor = { event: 'blue', promotion: 'orange', read: 'green', video: 'purple' }

function ArticleImageUpload({ value, onChange }) {
  const handleChange = async ({ file }) => {
    const f = file.originFileObj || file
    const formData = new FormData()
    formData.append('file', f)
    try {
      const res = await client.post('/admin/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      const url = res.data?.data?.url
      if (url) onChange(url)
    } catch {}
  }
  return (
    <Upload showUploadList={false} customRequest={({ file, onSuccess }) => { handleChange({ file }); onSuccess?.() }} accept="image/*">
      <Space>
        {value && <img src={value} style={{ maxHeight: 60, borderRadius: 4 }} alt="" />}
        <Button size="small" icon={<UploadOutlined />}>Upload ảnh</Button>
      </Space>
    </Upload>
  )
}

export default function Articles() {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [sortDir, setSortDir] = useState('desc')
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form] = Form.useForm()

  const watchType = Form.useWatch('type', form)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-articles', q, status, page, sortDir],
    queryFn: () => client.get('/admin/articles', { params: { q, ...(status !== '' && { status }), page: page - 1, size: 20, sortDir } }).then(r => r.data?.data ?? r.data),
  })

  const { data: articleDetail } = useQuery({
    queryKey: ['admin-article-detail', selected?.id],
    queryFn: () => client.get(`/admin/articles/${selected.id}`).then(r => r.data?.data),
    enabled: !!selected,
  })

  const detailData = articleDetail || selected

  const mutation = useMutation({
    mutationFn: (values) => client.put(`/admin/articles/${selected.id}`, { ...values, status: Number(values.status), isHot: Number(values.isHot) }),
    onSuccess: () => { qc.invalidateQueries(['admin-articles']); qc.invalidateQueries(['admin-article-detail', selected?.id]); setEditing(false) },
  })

  useEffect(() => {
    if (selected && editing && articleDetail) {
      form.setFieldsValue({
        title: detailData?.title,
        type: detailData?.type,
        status: String(detailData?.status),
        isHot: String(detailData?.isHot ?? 0),
        shortContent: detailData?.shortContent,
        image: detailData?.image,
        video: detailData?.video,
        tags: detailData?.tags ? String(detailData.tags).split(',').filter(Boolean).map(t => t.trim()) : [],
        content: detailData?.content,
      })
    }
  }, [selected, editing, articleDetail])

  const columns = [
    {
      title: () => (
        <span onClick={() => { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); setPage(1) }}
          style={{ cursor: 'pointer', userSelect: 'none' }}>
          ID <span style={{ color: '#1677ff', fontSize: 10 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
        </span>
      ),
      dataIndex: 'id', width: 70,
    },
    { title: 'Tiêu đề', dataIndex: 'title', ellipsis: true },
    { title: 'Loại', dataIndex: 'type', render: v => <Tag color={typeColor[v] || 'default'}>{v}</Tag> },
    { title: 'Tác giả', dataIndex: 'authorName' },
    { title: 'Lượt xem', dataIndex: 'view' },
    { title: 'Trạng thái', dataIndex: 'status', render: v => v == 1 ? <Tag color="green">Đã đăng</Tag> : <Tag>Ẩn</Tag> },
    { dataIndex: 'id', width: 36, align: 'center', render: () => <RightOutlined style={{ color: '#bbb', fontSize: 11 }} /> },
  ]

  function openDrawer(row) { setSelected(row); setEditing(false) }
  function closeDrawer() { setSelected(null); setEditing(false) }

  const showVideoField = watchType === 'video' || watchType === 'promotion'
  const videoFieldLabel = watchType === 'promotion' ? 'Số giảm (%)' : 'Link video (YouTube)'

  return (
    <div style={{ padding: 24 }}>
      <div className="page-header">
        <div className="page-title">Bài viết</div>
        <span className="page-subtitle">Quản lý nội dung bài viết</span>
      </div>
      <div className="page-content">
        <Space style={{ marginBottom: 16, flexWrap: 'wrap', width: '100%', justifyContent: 'space-between' }}>
          <Space wrap>
            <Input.Search placeholder="Tìm tiêu đề" value={q} onChange={e => { setQ(e.target.value); setPage(1) }} onSearch={() => {}} allowClear style={{ width: 220 }} />
            <Select value={status} onChange={v => { setStatus(v); setPage(1) }} style={{ width: 150 }}
              options={[{ value: '', label: 'Tất cả' }, { value: '1', label: 'Đã đăng' }, { value: '0', label: 'Ẩn' }]}
            />
          </Space>
          <Space>
            {data?.total != null && <Typography.Text type="secondary">{data.total.toLocaleString('vi-VN')} bài viết</Typography.Text>}
          </Space>
        </Space>
        <Table
          columns={columns} dataSource={data?.content ?? []} rowKey="id" loading={isLoading} size="small"
          scroll={{ x: 'max-content' }}
          pagination={{
            current: page, pageSize: 20, total: data?.total,
            showSizeChanger: false, onChange: setPage,
            showTotal: (t, range) => `${range[0]}–${range[1]} / ${t}`,
          }}
          onRow={row => ({ onClick: () => openDrawer(row), style: { cursor: 'pointer' } })}
        />
      </div>
      <Drawer
        title={selected?.title} open={!!selected} onClose={closeDrawer} width="75%"
        extra={
          editing ? (
            <Space>
              <Button icon={<CloseOutlined />} onClick={() => setEditing(false)}>Huỷ</Button>
              <Button type="primary" icon={<SaveOutlined />} loading={mutation.isPending} onClick={() => form.submit()}>Lưu</Button>
            </Space>
          ) : (
            <Button icon={<EditOutlined />} onClick={() => setEditing(true)}>Sửa</Button>
          )
        }
      >
        <Form form={form} onFinish={mutation.mutate}>
          <Field label="Tiêu đề" viewValue={detailData?.title}
            editContent={<Form.Item name="title" noStyle><Input size="small" /></Form.Item>}
            editing={editing}
          />
          <Field label="Loại"
            viewValue={<Tag color={typeColor[detailData?.type] || 'default'}>{detailData?.type}</Tag>}
            editContent={
              <Form.Item name="type" noStyle>
                <Select size="small" style={{ width: '100%' }} options={TYPE_OPTIONS} />
              </Form.Item>
            }
            editing={editing}
          />
          <Field label="Trạng thái"
            viewValue={detailData?.status == 1 ? <Tag color="green">Đã đăng</Tag> : <Tag>Ẩn</Tag>}
            editContent={
              <Form.Item name="status" noStyle valuePropName="checked"
                getValueFromEvent={checked => checked ? '1' : '0'}
                getValueProps={v => ({ checked: v === '1' || v === 1 })}>
                <Switch checkedChildren="Đã đăng" unCheckedChildren="Ẩn" />
              </Form.Item>
            }
            editing={editing}
          />
          <Field label="Nổi bật"
            viewValue={detailData?.isHot == 1 ? <Tag color="gold">Nổi bật</Tag> : <Tag>Thường</Tag>}
            editContent={
              <Form.Item name="isHot" noStyle valuePropName="checked"
                getValueFromEvent={checked => checked ? '1' : '0'}
                getValueProps={v => ({ checked: v === '1' || v === 1 })}>
                <Switch checkedChildren="Nổi bật" unCheckedChildren="Thường" />
              </Form.Item>
            }
            editing={editing}
          />
          {showVideoField && (
            <Field label={videoFieldLabel}
              viewValue={detailData?.video}
              editContent={
                <Form.Item name="video" noStyle>
                  <Input size="small" placeholder={watchType === 'video' ? 'https://youtube.com/...' : 'VD: 20'} />
                </Form.Item>
              }
              editing={editing}
            />
          )}
          <Field label="Ảnh đại diện"
            viewValue={detailData?.image ? <img src={detailData.image} style={{ maxWidth: '100%', maxHeight: 120, borderRadius: 6 }} alt="" /> : '—'}
            editContent={
              <Form.Item name="image" noStyle>
                <ArticleImageUpload value={form.getFieldValue('image')} onChange={url => form.setFieldValue('image', url)} />
              </Form.Item>
            }
            editing={editing}
          />
          <Field label="Tags"
            viewValue={
              <Space size={4} wrap>
                {(detailData?.tags || '').split(',').filter(Boolean).map((t, i) => <Tag key={i}>{t.trim()}</Tag>)}
              </Space>
            }
            editContent={
              <Form.Item name="tags" noStyle
                getValueFromEvent={v => Array.isArray(v) ? v.join(',') : v}
                getValueProps={v => ({ value: v ? String(v).split(',').filter(Boolean).map(t => t.trim()) : [] })}>
                <Select mode="tags" size="small" style={{ width: '100%' }} placeholder="Nhập tag rồi Enter" tokenSeparators={[',']} />
              </Form.Item>
            }
            editing={editing}
          />
          <Field label="Lượt xem" viewValue={detailData?.view} editing={false} />
          <Field label="Tác giả" viewValue={detailData?.authorName} editing={false} />
          <Field label="Ngày tạo" viewValue={fmtDateTime(detailData?.createdAt)} editing={false} />
          <Field label="Tóm tắt"
            viewValue={<div style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{detailData?.shortContent}</div>}
            editContent={<Form.Item name="shortContent" noStyle><Input.TextArea size="small" rows={4} /></Form.Item>}
            editing={editing}
          />
          <Field label="Nội dung đầy đủ"
            viewValue={<div dangerouslySetInnerHTML={{ __html: detailData?.content || '' }} style={{ fontSize: 13, maxHeight: 300, overflow: 'auto' }} />}
            editContent={
              <Form.Item name="content" noStyle>
                <RichEditor value={form.getFieldValue('content') || ''} onChange={v => form.setFieldValue('content', v)} />
              </Form.Item>
            }
            editing={editing}
          />
        </Form>
      </Drawer>
    </div>
  )
}
