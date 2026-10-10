import { Button, Drawer, Form, Input, Modal, Radio, Select, Space, Switch, Table, Tag, Tooltip, Typography, Upload } from 'antd'
import { CopyOutlined, EditOutlined, InfoCircleOutlined, SaveOutlined, CloseOutlined, RightOutlined, UploadOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import { fmtVND, fmtDate, fmtDateTime } from '../utils/format'
import { Field } from '../components/Field'
import RichEditor from '../components/RichEditor'
import { message } from 'antd'

const MEMBER_ROLES = ['member', 'teacher', 'school']
const statusTag = (v) => v == 1 ? <Tag color="green">Hoạt động</Tag> : <Tag color="red">Khoá</Tag>

function AvatarUpload({ value, onChange }) {
  const handleChange = async (info) => {
    const file = info.file.originFileObj || info.file
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await client.post('/admin/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      const url = res.data?.data?.url
      if (url) onChange(url)
    } catch {}
  }
  return (
    <Upload showUploadList={false} customRequest={({ file, onSuccess }) => { handleChange({ file }); onSuccess?.() }} accept="image/*">
      <Space>
        {value && <img src={value} alt="avatar" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />}
        <Button size="small" icon={<UploadOutlined />}>Chọn ảnh</Button>
      </Space>
    </Upload>
  )
}

export default function Users() {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [role, setRole] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isSignedFilter, setIsSignedFilter] = useState('')
  const [page, setPage] = useState(1)
  const [sortDir, setSortDir] = useState('desc')
  const [sortBy, setSortBy] = useState('id')
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form] = Form.useForm()
  const [resetModal, setResetModal] = useState(false)
  const [resetMode, setResetMode] = useState('auto')
  const [manualPwd, setManualPwd] = useState('')
  const [newPwdResult, setNewPwdResult] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', q, role, statusFilter, isSignedFilter, page, sortDir, sortBy],
    queryFn: () => client.get('/admin/users', { params: { q, role: role || undefined, ...(statusFilter !== '' && { status: statusFilter }), ...(isSignedFilter !== '' && { isSigned: isSignedFilter }), page: page - 1, size: 20, sortDir, sortBy } }).then(r => r.data?.data ?? r.data),
  })

  const toggleSignedMutation = useMutation({
    mutationFn: (id) => client.put(`/admin/users/${id}/toggle-signed`),
    onSuccess: () => qc.invalidateQueries(['admin-users']),
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
      setSelected(prev => ({ ...prev, ...form.getFieldsValue(), status: Number(form.getFieldValue('status')), commissionRate: Number(form.getFieldValue('commissionRate')) / 100 }))
    },
  })

  const resetMutation = useMutation({
    mutationFn: (pwd) => client.post(`/admin/users/${selected.id}/reset-password`, pwd ? { password: pwd } : {}).then(r => r.data?.data),
    onSuccess: (data) => { setNewPwdResult(data?.newPassword) },
    onError: () => message.error('Reset thất bại'),
  })

  useEffect(() => {
    if (selected && editing) form.setFieldsValue({
      name: selected.name, phone: selected.phone, email: selected.email,
      role: selected.role, status: String(selected.status),
      commissionRate: ((selected.commissionRate ?? 0) * 100).toFixed(0),
      introduce: selected.introduce,
      fullContent: selected.fullContent,
      image: selected.image,
    })
  }, [selected, editing])

  const makeSortHeader = (label, col) => () => (
    <span onClick={() => {
      if (sortBy === col) { setSortDir(d => d === 'asc' ? 'desc' : 'asc') }
      else { setSortBy(col); setSortDir('desc') }
      setPage(1)
    }} style={{ cursor: 'pointer', userSelect: 'none' }}>
      {label}{' '}
      {sortBy === col
        ? <span style={{ color: '#1677ff', fontSize: 10 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
        : <span style={{ color: '#ccc', fontSize: 10 }}>↕</span>
      }
    </span>
  )

  const columns = [
    { title: makeSortHeader('ID', 'id'), dataIndex: 'id', width: 70 },
    { title: 'Tên', dataIndex: 'name' },
    { title: 'Điện thoại', dataIndex: 'phone' },
    { title: 'Role', dataIndex: 'role' },
    { title: 'anyPoint', dataIndex: 'walletC', width: 100, render: v => (v ?? 0).toLocaleString('vi-VN') },
    {
      title: 'Ký HĐ', dataIndex: 'isSigned', width: 75,
      render: (v, row) => (row.role === 'teacher' || row.role === 'school') ? (
        <Switch size="small" checked={v == 1}
          onChange={() => toggleSignedMutation.mutate(row.id)}
          onClick={(_, e) => e?.stopPropagation()}
        />
      ) : null,
    },
    {
      title: () => (
        <Space size={4}>
          {makeSortHeader('Điểm PL', 'popularityScore')()}
          <Tooltip title={
            <div style={{ fontSize: 12, lineHeight: 1.6 }}>
              <b>Công thức popularity (thành viên):</b><br />
              isHot=1 → +350<br />
              Lượt xem profile × 2 (max 100)<br />
              Tổng điểm khóa học (max 500)<br />
              Boost Score (max 50)<br />
              <span style={{ color: '#aaa' }}>Cập nhật mỗi 30 phút</span>
            </div>
          } placement="topRight">
            <InfoCircleOutlined style={{ color: '#1677ff', fontSize: 11, cursor: 'help' }} />
          </Tooltip>
        </Space>
      ),
      dataIndex: 'popularityScore', width: 105,
      render: v => <span style={{ color: v > 0 ? '#1677ff' : '#bbb' }}>{v ?? 0}</span>,
    },
    { title: 'Trạng thái', dataIndex: 'status', render: statusTag },
    { title: 'Ngày tạo', dataIndex: 'createdAt', render: v => fmtDateTime(v) },
    { dataIndex: 'id', key: 'arrow', width: 36, align: 'center', render: () => <RightOutlined style={{ color: '#bbb', fontSize: 11 }} /> },
  ]

  function openDrawer(row) { setSelected(row); setEditing(false) }
  function closeDrawer() { setSelected(null); setEditing(false) }

  return (
    <div style={{ padding: 24 }}>
      <div className="page-header">
        <div className="page-title">Thành viên</div>
        <span className="page-subtitle">Quản lý người dùng hệ thống</span>
      </div>
      <div className="page-content">
        <Space style={{ marginBottom: 16, flexWrap: 'wrap', width: '100%', justifyContent: 'space-between' }}>
          <Space wrap>
            <Input.Search placeholder="Tên / SĐT / email" value={q} onChange={e => { setQ(e.target.value); setPage(1) }} onSearch={() => {}} allowClear style={{ width: 220 }} />
            <Select value={role} onChange={v => { setRole(v); setPage(1) }} style={{ width: 140 }}
              options={[{ value: '', label: 'Tất cả role' }, ...MEMBER_ROLES.map(r => ({ value: r, label: r }))]}
            />
            <Select value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1) }} style={{ width: 160 }}
              options={[{ value: '', label: 'Tất cả trạng thái' }, { value: '1', label: 'Hoạt động' }, { value: '0', label: 'Khoá' }]}
            />
            <Select value={isSignedFilter} onChange={v => { setIsSignedFilter(v); setPage(1) }} style={{ width: 150 }}
              options={[{ value: '', label: 'Tất cả HĐ' }, { value: '1', label: 'Đã ký HĐ' }, { value: '0', label: 'Chưa ký HĐ' }]}
            />
          </Space>
          <Space>
            {data?.total != null && <Typography.Text type="secondary">{data.total.toLocaleString('vi-VN')} thành viên</Typography.Text>}
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
        title={selected?.name || selected?.phone}
        open={!!selected}
        onClose={closeDrawer}
        width="75%"
        extra={
          editing ? (
            <Space>
              <Button icon={<CloseOutlined />} onClick={() => setEditing(false)}>Huỷ</Button>
              <Button type="primary" icon={<SaveOutlined />} loading={mutation.isPending} onClick={() => form.submit()}>Lưu</Button>
            </Space>
          ) : (
            <Space>
              <Button onClick={() => { setResetModal(true); setResetMode('auto'); setManualPwd(''); setNewPwdResult(null) }}>
                Reset mật khẩu
              </Button>
              <Button icon={<EditOutlined />} onClick={() => setEditing(true)}>Sửa</Button>
            </Space>
          )
        }
      >
        <Form form={form} onFinish={mutation.mutate}>
          <Field label="Avatar"
            viewValue={selected?.image ? <img src={selected.image} alt="avatar" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover' }} /> : '—'}
            editContent={
              <Form.Item name="image" noStyle>
                <AvatarUpload value={form.getFieldValue('image')} onChange={url => form.setFieldValue('image', url)} />
              </Form.Item>
            }
            editing={editing}
          />
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
          <Field label="Trạng thái"
            viewValue={statusTag(selected?.status)}
            editContent={
              <Form.Item name="status" noStyle valuePropName="checked"
                getValueFromEvent={checked => checked ? '1' : '0'}
                getValueProps={v => ({ checked: v === '1' || v === 1 })}>
                <Switch checkedChildren="Hoạt động" unCheckedChildren="Khoá" />
              </Form.Item>
            }
            editing={editing}
          />
          <Field label="Hoa hồng" viewValue={`${((selected?.commissionRate ?? 0) * 100).toFixed(0)}%`}
            editContent={<Form.Item name="commissionRate" noStyle><Input size="small" type="number" suffix="%" /></Form.Item>}
            editing={editing}
          />
          <Field label="anyPoint" viewValue={`${(selected?.walletC ?? 0).toLocaleString()}`} editing={false} />
          <Field label="Ngày tạo" viewValue={fmtDateTime(selected?.createdAt)} editing={false} />
          <Field label="Người giới thiệu" viewValue={selected?.refName || (selected?.refUserId ? '#' + selected.refUserId : '—')} editing={false} />
          <Field label="Giới thiệu ngắn" viewValue={selected?.introduce}
            editContent={<Form.Item name="introduce" noStyle><Input.TextArea size="small" rows={2} /></Form.Item>}
            editing={editing}
          />
          <Field label="Giới thiệu đầy đủ"
            viewValue={<div dangerouslySetInnerHTML={{ __html: selected?.fullContent || '' }} style={{ fontSize: 13 }} />}
            editContent={
              <Form.Item name="fullContent" noStyle>
                <RichEditor value={form.getFieldValue('fullContent') || ''} onChange={v => form.setFieldValue('fullContent', v)} />
              </Form.Item>
            }
            editing={editing}
          />
        </Form>
      </Drawer>

      <Modal
        title="Reset mật khẩu"
        open={resetModal}
        onCancel={() => setResetModal(false)}
        footer={newPwdResult ? [
          <Button key="close" type="primary" onClick={() => setResetModal(false)}>Đóng</Button>
        ] : [
          <Button key="cancel" onClick={() => setResetModal(false)}>Huỷ</Button>,
          <Button key="ok" type="primary" loading={resetMutation.isPending}
            onClick={() => resetMutation.mutate(resetMode === 'manual' ? manualPwd : undefined)}>
            Xác nhận
          </Button>
        ]}
      >
        {newPwdResult ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <Typography.Text type="secondary">Mật khẩu mới:</Typography.Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 8 }}>
              <div style={{ background: '#f0f5ff', border: '1px solid #adc6ff', borderRadius: 8, padding: '10px 24px', fontSize: 18, fontWeight: 700, letterSpacing: 2 }}>
                {newPwdResult}
              </div>
              <Button icon={<CopyOutlined />} onClick={() => { navigator.clipboard.writeText(newPwdResult); message.success('Đã sao chép') }} />
            </div>
          </div>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Radio.Group value={resetMode} onChange={e => setResetMode(e.target.value)}>
              <Radio value="auto">Tự động (8 ký tự ngẫu nhiên)</Radio>
              <Radio value="manual">Nhập mật khẩu mới</Radio>
            </Radio.Group>
            {resetMode === 'manual' && (
              <Input value={manualPwd} onChange={e => setManualPwd(e.target.value)}
                placeholder="Nhập mật khẩu mới" style={{ marginTop: 8 }} />
            )}
          </Space>
        )}
      </Modal>
    </div>
  )
}
