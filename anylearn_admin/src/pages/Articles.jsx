import { Button, Drawer, Form, Input, Select, Space, Table, Tag, Typography } from 'antd'
import { CloseOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import { fmtVND, fmtDate, fmtDateTime } from '../utils/format'
import { Field } from '../components/Field'

export default function Articles() {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form] = Form.useForm()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-articles', q, status, page],
    queryFn: () => client.get('/admin/articles', { params: { q, ...(status !== '' && { status }), page: page - 1, size: 20 } }).then(r => r.data?.data ?? r.data),
  })

  const mutation = useMutation({
    mutationFn: (values) => client.put(`/admin/articles/${selected.id}`, { ...values, status: Number(values.status), isHot: Number(values.isHot) }),
    onSuccess: () => { qc.invalidateQueries(['admin-articles']); setEditing(false) },
  })

  useEffect(() => {
    if (selected && editing) form.setFieldsValue({ title: selected.title, type: selected.type, status: String(selected.status), isHot: String(selected.isHot ?? 0), shortContent: selected.shortContent })
  }, [selected, editing])

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: 'Tiêu đề', dataIndex: 'title', ellipsis: true },
    { title: 'Loại', dataIndex: 'type' },
    { title: 'Tác giả', dataIndex: 'authorName' },
    { title: 'Lượt xem', dataIndex: 'view' },
    { title: 'Trạng thái', dataIndex: 'status', render: v => v == 1 ? <Tag color="green">Đã đăng</Tag> : <Tag>Ẩn</Tag> },
  ]

  function openDrawer(row) { setSelected(row); setEditing(false) }
  function closeDrawer() { setSelected(null); setEditing(false) }

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
        pagination={{
          current: page, pageSize: 20, total: data?.total,
          showSizeChanger: false, onChange: setPage,
          showTotal: (t, range) => `${range[0]}–${range[1]} / ${t}`,
        }}
        onRow={row => ({ onClick: () => openDrawer(row), style: { cursor: 'pointer' } })}
      />
      </div>
      <Drawer
        title={selected?.title} open={!!selected} onClose={closeDrawer} size="large"
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
          <Field label="Tiêu đề" viewValue={selected?.title}
            editContent={<Form.Item name="title" noStyle><Input size="small" /></Form.Item>}
            editing={editing}
          />
          <Field label="Loại" viewValue={selected?.type}
            editContent={<Form.Item name="type" noStyle><Input size="small" /></Form.Item>}
            editing={editing}
          />
          <Field label="Trạng thái" viewValue={selected?.status == 1 ? <Tag color="green">Đã đăng</Tag> : <Tag>Ẩn</Tag>}
            editContent={<Form.Item name="status" noStyle><Select size="small" style={{ width: '100%' }} options={[{ value: '1', label: 'Đã đăng' }, { value: '0', label: 'Ẩn' }]} /></Form.Item>}
            editing={editing}
          />
          <Field label="Nổi bật" viewValue={selected?.isHot == 1 ? 'Có' : 'Không'}
            editContent={<Form.Item name="isHot" noStyle><Select size="small" style={{ width: '100%' }} options={[{ value: '1', label: 'Có' }, { value: '0', label: 'Không' }]} /></Form.Item>}
            editing={editing}
          />
          <Field label="Lượt xem" viewValue={selected?.view} editing={false} />
          <Field label="Tác giả" viewValue={selected?.authorName} editing={false} />
          <Field label="Ngày tạo" viewValue={fmtDate(selected?.createdAt)} editing={false} />
          <Field label="Tóm tắt"
            viewValue={<div style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{selected?.shortContent}</div>}
            editContent={<Form.Item name="shortContent" noStyle><Input.TextArea size="small" rows={4} /></Form.Item>}
            editing={editing}
          />
        </Form>
      </Drawer>
    </div>
  )
}
