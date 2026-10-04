import { Button, Drawer, Form, Input, Select, Space, Table, Tag } from 'antd'
import { EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import { usePagination } from '../hooks/usePagination'
import { Field } from '../components/Field'

const MEMBER_ROLES = ['member', 'teacher', 'school']
const statusTag = (v) => v == 1 ? <Tag color="green">Hoạt động</Tag> : <Tag color="red">Khoá</Tag>


export default function Users() {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [role, setRole] = useState('')
  const { page, setPage, paginationProps } = usePagination()
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form] = Form.useForm()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', q, role, page],
    queryFn: () => client.get('/admin/users', { params: { q, role: role || undefined, page: page - 1, size: 20 } }).then(r => r.data?.data ?? r.data),
  })

  const mutation = useMutation({
    mutationFn: (values) => client.put(`/admin/users/${selected.id}`, {
      ...values,
      status: Number(values.status),
      commissionRate: Number(values.commissionRate) / 100,
    }),
    onSuccess: (res) => {
      qc.invalidateQueries(['admin-users'])
      setEditing(false)
      // Update selected with saved data
      setSelected(prev => ({ ...prev, ...form.getFieldsValue(), status: Number(form.getFieldValue('status')), commissionRate: Number(form.getFieldValue('commissionRate')) / 100 }))
    },
  })

  useEffect(() => {
    if (selected && editing) form.setFieldsValue({
      name: selected.name, phone: selected.phone, email: selected.email,
      role: selected.role, status: String(selected.status),
      commissionRate: ((selected.commissionRate ?? 0) * 100).toFixed(0),
    })
  }, [selected, editing])

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: 'Tên', dataIndex: 'name' },
    { title: 'Điện thoại', dataIndex: 'phone' },
    { title: 'Role', dataIndex: 'role' },
    { title: 'Trạng thái', dataIndex: 'status', render: statusTag },
    { title: 'Ngày tạo', dataIndex: 'createdAt', render: v => v?.split('T')[0] },
  ]

  function openDrawer(row) { setSelected(row); setEditing(false) }
  function closeDrawer() { setSelected(null); setEditing(false) }

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <Input.Search placeholder="Tên / SĐT / email" value={q} onChange={e => { setQ(e.target.value); setPage(1) }} onSearch={() => {}} allowClear style={{ width: 220 }} />
        <Select value={role} onChange={v => { setRole(v); setPage(1) }} style={{ width: 140 }}
          options={[{ value: '', label: 'Tất cả role' }, ...MEMBER_ROLES.map(r => ({ value: r, label: r }))]}
        />
      </Space>
      <Table
        columns={columns} dataSource={data?.content ?? []} rowKey="id" loading={isLoading} size="small"
        pagination={paginationProps(data?.content)}
        onRow={row => ({ onClick: () => openDrawer(row), style: { cursor: 'pointer' } })}
      />

      <Drawer
        title={selected?.name || selected?.phone}
        open={!!selected}
        onClose={closeDrawer}
        size="large"
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
          <Field label="Tên" viewValue={selected?.name}
            editContent={<Form.Item name="name" noStyle><Input size="small" /></Form.Item>}
            editing={editing}
          />
          <Field label="Điện thoại" viewValue={selected?.phone}
            editContent={<Form.Item name="phone" noStyle><Input size="small" /></Form.Item>}
            editing={editing}
          />
          <Field label="Email" viewValue={selected?.email}
            editContent={<Form.Item name="email" noStyle><Input size="small" /></Form.Item>}
            editing={editing}
          />
          <Field label="Role" viewValue={selected?.role}
            editContent={<Form.Item name="role" noStyle><Select size="small" style={{ width: '100%' }} options={MEMBER_ROLES.map(r => ({ value: r, label: r }))} /></Form.Item>}
            editing={editing}
          />
          <Field label="Trạng thái" viewValue={statusTag(selected?.status)}
            editContent={<Form.Item name="status" noStyle><Select size="small" style={{ width: '100%' }} options={[{ value: '1', label: 'Hoạt động' }, { value: '0', label: 'Khoá' }]} /></Form.Item>}
            editing={editing}
          />
          <Field label="Hoa hồng" viewValue={`${((selected?.commissionRate ?? 0) * 100).toFixed(0)}%`}
            editContent={<Form.Item name="commissionRate" noStyle><Input size="small" type="number" suffix="%" /></Form.Item>}
            editing={editing}
          />
          <Field label="anyPoint" viewValue={`${(selected?.walletC ?? 0).toLocaleString()}`} editing={false} />
          <Field label="Ngày tạo" viewValue={selected?.createdAt?.split('T')[0]} editing={false} />
        </Form>
      </Drawer>
    </div>
  )
}
