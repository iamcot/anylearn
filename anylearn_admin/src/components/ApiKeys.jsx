import { Alert, Button, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, Typography, message } from 'antd'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import { fmtDateTime } from '../utils/format'

// Machine keys of the t2m tool (plan 19.A6): a key acts as one creator account (e.g. "anyLEARN Studio") and only on the
// creator routes of Khám phá and the studio routes. The key is shown once; only its start is listed afterwards.
export default function ApiKeys() {
  const qc = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [newKey, setNewKey] = useState(null)
  const [form] = Form.useForm()
  const { data, isLoading } = useQuery({ queryKey: ['admin-api-keys'], queryFn: () => client.get('/admin/api-keys').then(r => r.data?.data ?? []) })
  const { data: creators } = useQuery({ queryKey: ['admin-explore-creators'], queryFn: () => client.get('/admin/explore/creators').then(r => r.data?.data ?? []) })
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-api-keys'] })
  const create = useMutation({
    mutationFn: values => client.post('/admin/api-keys', values).then(r => r.data),
    onSuccess: res => {
      if (res.resultCode !== 1) return message.error(res.message)
      setCreating(false)
      setNewKey(res.data.key)
      refresh()
    },
  })
  const revoke = useMutation({ mutationFn: id => client.delete(`/admin/api-keys/${id}`).then(r => r.data), onSuccess: res => { if (res.resultCode !== 1) message.error(res.message); else { message.success('Đã thu hồi'); refresh() } } })
  const creatorOptions = (creators ?? []).map(c => ({ value: c.userId, label: `${c.name} · ${c.phone ?? ''} (${c.level})` }))

  return (
    <>
      <Alert type="info" showIcon style={{ marginBottom: 12 }}
        message="Khóa cho tool t2m gửi bài lên Khám phá. Khóa đại diện cho một tài khoản creator (nên là tài khoản riêng anyLEARN Studio, cấp Creator để mọi bài chờ duyệt)."
        description="Khóa chỉ dùng được cho việc của creator (đăng, sửa bài của mình, tải clip) và xem số liệu bài; không đặt hàng, không vào back office. Khóa chỉ hiện một lần lúc tạo: dán ngay vào file .env của t2m (T2M_API_KEY). Lộ khóa thì thu hồi và tạo khóa mới." />
      <Button type="primary" style={{ marginBottom: 12 }} onClick={() => { form.resetFields(); setCreating(true) }}>+ Tạo khóa</Button>
      <Table rowKey="id" loading={isLoading} dataSource={data ?? []} pagination={false} columns={[
        { title: 'Tên', dataIndex: 'name' },
        { title: 'Tài khoản', key: 'user', render: (_, r) => `${r.userName ?? ''} · ${r.userPhone ?? ''}` },
        { title: 'Khóa', dataIndex: 'prefix', render: v => <Typography.Text code>{v}…</Typography.Text> },
        { title: 'Tạo lúc', dataIndex: 'createdAt', render: v => fmtDateTime(v) },
        { title: 'Dùng lần cuối', dataIndex: 'lastUsedAt', render: v => (v ? fmtDateTime(v) : 'Chưa dùng') },
        { title: '', key: 'a', render: (_, r) => (r.revokedAt
          ? <Tag>Đã thu hồi {fmtDateTime(r.revokedAt)}</Tag>
          : <Popconfirm title="Thu hồi khóa này? t2m sẽ không gửi bài được nữa cho tới khi có khóa mới." onConfirm={() => revoke.mutate(r.id)}><a>Thu hồi</a></Popconfirm>) },
      ]} />
      <Modal title="Tạo khóa cho t2m" open={creating} onCancel={() => setCreating(false)} onOk={() => form.submit()} confirmLoading={create.isPending} okText="Tạo">
        <Form form={form} layout="vertical" onFinish={values => create.mutate(values)} initialValues={{ name: 't2m' }}>
          <Form.Item name="name" label="Tên (máy nào dùng)" rules={[{ required: true }]}><Input placeholder="t2m Mac M5" /></Form.Item>
          <Form.Item name="userId" label="Tài khoản creator" rules={[{ required: true, message: 'Chọn tài khoản' }]} extra="Thêm tài khoản ở tab Creator trước (cấp Creator).">
            <Select showSearch optionFilterProp="label" options={creatorOptions} />
          </Form.Item>
        </Form>
      </Modal>
      <Modal title="Khóa mới (chỉ hiện một lần)" open={!!newKey} onCancel={() => setNewKey(null)} footer={<Button type="primary" onClick={() => setNewKey(null)}>Đã chép, đóng</Button>}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Typography.Paragraph copyable={{ text: newKey ?? '' }} code style={{ wordBreak: 'break-all' }}>{newKey}</Typography.Paragraph>
          <Typography.Text type="secondary">Gửi kèm header X-Api-Key khi gọi /v2/api/explore/creator/* và /v2/api/studio/*.</Typography.Text>
        </Space>
      </Modal>
    </>
  )
}
