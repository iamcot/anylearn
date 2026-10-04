import { Button, Drawer, Form, Input, Select, Space, Table, Tag } from 'antd'
import { CloseOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import { usePagination } from '../hooks/usePagination'
import { Field } from '../components/Field'

const statusTag = (v) => v == 1 ? <Tag color="green">Hiển thị</Tag> : <Tag color="default">Ẩn</Tag>
const userStatusTag = (v) => v == 1 ? <Tag color="blue">Đã duyệt</Tag> : <Tag color="orange">Chờ duyệt</Tag>

export default function Items() {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const { page, setPage, paginationProps } = usePagination()
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form] = Form.useForm()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-items', q, status, page],
    queryFn: () => client.get('/admin/items', { params: { q, ...(status !== '' && { status }), page: page - 1, size: 20 } }).then(r => r.data?.data ?? r.data),
  })

  const mutation = useMutation({
    mutationFn: (values) => client.put(`/admin/items/${selected.id}`, { ...values, price: Number(values.price), status: Number(values.status), userStatus: Number(values.userStatus), isHot: Number(values.isHot) }),
    onSuccess: () => { qc.invalidateQueries(['admin-items']); setEditing(false) },
  })

  useEffect(() => {
    if (selected && editing) form.setFieldsValue({ title: selected.title, price: selected.price, status: String(selected.status), userStatus: String(selected.userStatus), isHot: String(selected.isHot ?? 0) })
  }, [selected, editing])

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: 'Tiêu đề', dataIndex: 'title', ellipsis: true },
    { title: 'Giá', dataIndex: 'price', render: v => Number(v ?? 0).toLocaleString() },
    { title: 'Đối tác', dataIndex: 'ownerName' },
    { title: 'Trạng thái', dataIndex: 'status', render: statusTag },
    { title: 'Duyệt', dataIndex: 'userStatus', render: userStatusTag },
  ]

  function openDrawer(row) { setSelected(row); setEditing(false) }
  function closeDrawer() { setSelected(null); setEditing(false) }

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <Input.Search placeholder="Tìm tiêu đề" value={q} onChange={e => { setQ(e.target.value); setPage(1) }} onSearch={() => {}} allowClear style={{ width: 220 }} />
        <Select value={status} onChange={v => { setStatus(v); setPage(1) }} style={{ width: 150 }}
          options={[{ value: '', label: 'Tất cả' }, { value: '1', label: 'Hiển thị' }, { value: '0', label: 'Ẩn' }]}
        />
      </Space>
      <Table
        columns={columns} dataSource={data?.content ?? []} rowKey="id" loading={isLoading} size="small"
        pagination={paginationProps(data?.content)}
        onRow={row => ({ onClick: () => openDrawer(row), style: { cursor: 'pointer' } })}
      />
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
          <Field label="Giá" viewValue={`${Number(selected?.price ?? 0).toLocaleString()}đ`}
            editContent={<Form.Item name="price" noStyle><Input size="small" type="number" suffix="đ" /></Form.Item>}
            editing={editing}
          />
          <Field label="Trạng thái" viewValue={statusTag(selected?.status)}
            editContent={<Form.Item name="status" noStyle><Select size="small" style={{ width: '100%' }} options={[{ value: '1', label: 'Hiển thị' }, { value: '0', label: 'Ẩn' }]} /></Form.Item>}
            editing={editing}
          />
          <Field label="Duyệt" viewValue={userStatusTag(selected?.userStatus)}
            editContent={<Form.Item name="userStatus" noStyle><Select size="small" style={{ width: '100%' }} options={[{ value: '1', label: 'Đã duyệt' }, { value: '0', label: 'Chờ duyệt' }]} /></Form.Item>}
            editing={editing}
          />
          <Field label="Nổi bật" viewValue={selected?.isHot == 1 ? 'Có' : 'Không'}
            editContent={<Form.Item name="isHot" noStyle><Select size="small" style={{ width: '100%' }} options={[{ value: '1', label: 'Có' }, { value: '0', label: 'Không' }]} /></Form.Item>}
            editing={editing}
          />
          <Field label="Đối tác" viewValue={selected?.ownerName} editing={false} />
          <Field label="Ngày tạo" viewValue={selected?.createdAt?.split('T')[0]} editing={false} />
        </Form>
      </Drawer>
    </div>
  )
}
