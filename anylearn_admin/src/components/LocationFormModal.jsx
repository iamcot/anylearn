import { Alert, Button, Checkbox, Form, Input, InputNumber, Modal, Radio, Space, Typography, message } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import client from '../api/client'
import { mapLink } from '../utils/maps'

function newSessionToken() {
  return typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : String(Date.now())
}

// Add or edit an address of a user: a member's home, or a branch of a partner.
// "Tìm tự động": one result fills the form; several results are listed to pick from.
export default function LocationFormModal({ open, userId, userName, location, headLabel = 'Hội sở / địa chỉ mặc định', onClose, onSaved }) {
  const [form] = Form.useForm()
  const [candidates, setCandidates] = useState([])
  const [checked, setChecked] = useState([])
  const [headId, setHeadId] = useState(null)
  const [searching, setSearching] = useState(false)
  const [googleOn, setGoogleOn] = useState(true)
  const [saving, setSaving] = useState(false)
  const session = useRef(newSessionToken())
  const editing = !!location?.id
  const { data: contract } = useQuery({
    queryKey: ['admin-contract-address', userId],
    queryFn: () => client.get('/admin/locations/contract-address', { params: { userId } }).then(r => r.data?.data ?? null),
    enabled: open && !!userId && !editing,
  })
  const area = [Form.useWatch('wardName', form), Form.useWatch('districtName', form), Form.useWatch('provinceName', form)].filter(Boolean).join(', ')

  useEffect(() => {
    if (!open) return
    session.current = newSessionToken()
    form.resetFields()
    form.setFieldsValue({
      title: location?.title, address: location?.address, lat: location?.lat, lng: location?.lng,
      phone: location?.phone, head: location?.head ?? false, placeId: undefined,
      provinceName: location?.provinceName, districtName: location?.districtName, wardName: location?.wardName,
    })
  }, [open, location, form])

  const reset = () => { setCandidates([]); setChecked([]); setHeadId(null) }

  const applyPlace = async (placeId) => {
    const res = await client.get('/admin/locations/place', { params: { placeId, session: session.current } }).then(r => r.data)
    if (res.resultCode !== 1) return message.error(res.message)
    const p = res.data
    form.setFieldsValue({
      address: p.formattedAddress, lat: p.lat, lng: p.lng, placeId: p.placeId,
      provinceName: p.provinceName, districtName: p.districtName, wardName: p.wardName,
      title: form.getFieldValue('title') || p.name,
    })
    reset()
  }

  const autoSearch = async () => {
    // Nothing typed: use the address on the partner's contract, else look the person or school up by name.
    const text = (form.getFieldValue('address') ?? '').trim() || (contract?.address ?? '').trim() || (userName ?? '').trim()
    if (text.length < 3) return message.warning('Nhập địa chỉ (ít nhất 3 ký tự) rồi bấm Tìm tự động')
    setSearching(true)
    try {
      const res = await client.get('/admin/locations/autocomplete', { params: { q: text, session: session.current } }).then(r => r.data)
      if (res.resultCode !== 1) return message.warning(res.message)
      setGoogleOn(res.data.enabled)
      const found = res.data.suggestions ?? []
      if (found.length === 0) { reset(); return message.info('Không tìm thấy địa chỉ nào, bạn kiểm tra lại hoặc nhập toạ độ tay') }
      if (found.length === 1) return applyPlace(found[0].placeId)
      setCandidates(found)
      setChecked([])
      setHeadId(null)
    } finally {
      setSearching(false)
    }
  }

  const toggle = (placeId, on) => setChecked(list => on ? [...list, placeId] : list.filter(id => id !== placeId))

  const saveSelected = async () => {
    if (checked.length === 0) return message.warning('Tick chọn ít nhất một địa chỉ')
    setSaving(true)
    try {
      const res = await client.post('/admin/locations/bulk', {
        userId, placeIds: checked, headPlaceId: checked.includes(headId) ? headId : undefined,
      }).then(r => r.data)
      if (res.resultCode !== 1) return message.error(res.message)
      message.success(`Đã lưu ${res.data.length} địa chỉ`)
      onSaved?.(res.data)
    } finally {
      setSaving(false)
    }
  }

  const submit = async (values) => {
    setSaving(true)
    try {
      const res = await (editing
        ? client.put(`/admin/locations/${location.id}`, { ...values, userId })
        : client.post('/admin/locations', { ...values, userId })).then(r => r.data)
      if (res.resultCode !== 1) return message.error(res.message)
      message.success('Đã lưu địa chỉ')
      onSaved?.([res.data])
    } finally {
      setSaving(false)
    }
  }

  const picking = candidates.length > 0 && !editing

  return (
    <Modal open={open} title={editing ? 'Sửa địa chỉ' : 'Thêm địa chỉ'} okText={picking ? `Lưu ${checked.length} địa chỉ đã chọn` : 'Lưu'} cancelText="Hủy"
      confirmLoading={saving} onCancel={() => { reset(); onClose() }} onOk={() => (picking ? saveSelected() : form.submit())} destroyOnClose width={560}>
      <Form form={form} layout="vertical" onFinish={submit}>
        {!googleOn && <Alert type="info" showIcon style={{ marginBottom: 12 }}
          message="Chưa bật tìm địa chỉ tự động (thiếu GOOGLE_MAPS_API_KEY). Nhập địa chỉ và toạ độ bằng tay." />}
        <Form.Item label="Địa chỉ" required extra={userName ? `Nhập số nhà, đường, quận rồi bấm Tìm tự động. Để trống thì tìm theo địa chỉ hợp đồng hoặc tên "${userName}".` : 'Nhập số nhà, đường, quận rồi bấm Tìm tự động để lấy toạ độ và khu vực.'}>
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item name="address" noStyle rules={[{ required: true, message: 'Nhập địa chỉ hoặc bấm Tìm tự động' }]}>
              <Input placeholder={userName ? `VD: 12 Nguyễn Huệ, Quận 1 (hoặc để trống)` : 'VD: 12 Nguyễn Huệ, Quận 1'} onPressEnter={e => { e.preventDefault(); autoSearch() }} />
            </Form.Item>
            <Button type="primary" loading={searching} onClick={autoSearch}>Tìm tự động</Button>
          </Space.Compact>
        </Form.Item>

        {contract?.address && !editing && (
          <div style={{ marginTop: -8, marginBottom: 12, fontSize: 12 }}>
            <Typography.Text type="secondary">Địa chỉ trên hợp đồng: {contract.address} </Typography.Text>
            <a onClick={() => form.setFieldValue('address', contract.address)}>Dùng địa chỉ này</a>
          </div>
        )}

        {candidates.length > 0 && (
          <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 8, marginBottom: 16 }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {editing ? 'Có nhiều kết quả, chọn một địa chỉ để điền vào form:' : `Có ${candidates.length} kết quả: tick địa chỉ cần lưu, chọn một nơi làm ${headLabel.toLowerCase()}.`}
            </Typography.Text>
            <Radio.Group value={headId} onChange={e => setHeadId(e.target.value)} style={{ width: '100%' }}>
              {candidates.map(c => (
                <div key={c.placeId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #fafafa' }}>
                  {!editing && <Checkbox checked={checked.includes(c.placeId)} onChange={e => toggle(c.placeId, e.target.checked)} />}
                  <div style={{ flex: 1, fontSize: 13 }}>
                    {c.text}{' '}
                    <a href={mapLink({ address: c.text, placeId: c.placeId })} target="_blank" rel="noreferrer">Xem bản đồ</a>
                  </div>
                  {editing
                    ? <Button size="small" onClick={() => applyPlace(c.placeId)}>Dùng địa chỉ này</Button>
                    : <Radio value={c.placeId} disabled={!checked.includes(c.placeId)}>{headLabel.split(' / ')[0]}</Radio>}
                </div>
              ))}
            </Radio.Group>
          </div>
        )}

        <div style={{ display: picking ? 'none' : 'block' }}>
          <Form.Item name="title" label="Tên địa chỉ" rules={[{ required: true, message: 'Nhập tên' }]}>
            <Input placeholder="VD: Nhà, Cơ sở Quận 1, Hội sở" />
          </Form.Item>
          {area && <Typography.Paragraph type="secondary" style={{ marginTop: -8 }}>Khu vực: {area}</Typography.Paragraph>}
          <Space align="start">
            <Form.Item name="lat" label="Vĩ độ"><InputNumber style={{ width: 150 }} step={0.0001} placeholder="10.7745" /></Form.Item>
            <Form.Item name="lng" label="Kinh độ"><InputNumber style={{ width: 150 }} step={0.0001} placeholder="106.7032" /></Form.Item>
          </Space>
          <Form.Item name="phone" label="Số điện thoại"><Input style={{ width: 200 }} /></Form.Item>
          <Form.Item name="head" valuePropName="checked"><Checkbox>{headLabel}</Checkbox></Form.Item>
        </div>
        <Form.Item name="placeId" hidden><Input /></Form.Item>
        <Form.Item name="provinceName" hidden><Input /></Form.Item>
        <Form.Item name="districtName" hidden><Input /></Form.Item>
        <Form.Item name="wardName" hidden><Input /></Form.Item>
      </Form>
    </Modal>
  )
}
