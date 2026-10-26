import { Alert, Checkbox, Form, Input, InputNumber, Modal, Select, Space, Typography, message } from 'antd'
import { useEffect, useRef, useState } from 'react'
import client from '../api/client'

const SEARCH_DELAY_MS = 350

function newSessionToken() {
  return typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : String(Date.now())
}

// Add or edit one branch of a partner. Typing an address fills the coordinates and the area from Google.
export default function LocationFormModal({ open, partnerId, location, onClose, onSaved }) {
  const [form] = Form.useForm()
  const [suggestions, setSuggestions] = useState([])
  const [googleOn, setGoogleOn] = useState(true)
  const [saving, setSaving] = useState(false)
  const timer = useRef(null)
  const area = [Form.useWatch('wardName', form), Form.useWatch('districtName', form), Form.useWatch('provinceName', form)].filter(Boolean).join(', ')
  const session = useRef(newSessionToken())

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

  const search = (text) => {
    clearTimeout(timer.current)
    if (text.trim().length < 3) return setSuggestions([])
    timer.current = setTimeout(async () => {
      const res = await client.get('/admin/locations/autocomplete', { params: { q: text, session: session.current } }).then(r => r.data)
      if (res.resultCode !== 1) return message.warning(res.message)
      setGoogleOn(res.data.enabled)
      setSuggestions(res.data.suggestions ?? [])
    }, SEARCH_DELAY_MS)
  }

  const pick = async (placeId) => {
    const res = await client.get('/admin/locations/place', { params: { placeId, session: session.current } }).then(r => r.data)
    if (res.resultCode !== 1) return message.error(res.message)
    const p = res.data
    form.setFieldsValue({
      address: p.formattedAddress, lat: p.lat, lng: p.lng, placeId: p.placeId,
      provinceName: p.provinceName, districtName: p.districtName, wardName: p.wardName,
      title: form.getFieldValue('title') || p.name,
    })
    setSuggestions([])
    session.current = newSessionToken()
  }

  const submit = async (values) => {
    setSaving(true)
    try {
      const body = { ...values, userId: partnerId }
      const res = await (location?.id
        ? client.put(`/admin/locations/${location.id}`, body)
        : client.post('/admin/locations', body)).then(r => r.data)
      if (res.resultCode !== 1) return message.error(res.message)
      message.success('Đã lưu cơ sở')
      onSaved?.(res.data)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} title={location?.id ? 'Sửa cơ sở' : 'Thêm cơ sở'} okText="Lưu" cancelText="Hủy"
      confirmLoading={saving} onCancel={onClose} onOk={() => form.submit()} destroyOnClose>
      <Form form={form} layout="vertical" onFinish={submit}>
        {!googleOn && <Alert type="info" showIcon style={{ marginBottom: 12 }}
          message="Chưa bật tìm địa chỉ tự động (thiếu GOOGLE_MAPS_API_KEY). Nhập địa chỉ và toạ độ bằng tay." />}
        <Form.Item label="Tìm địa chỉ" extra="Gõ số nhà, đường, quận rồi chọn gợi ý: toạ độ và khu vực tự điền.">
          <Select showSearch filterOption={false} placeholder="VD: 12 Nguyễn Huệ, Quận 1" onSearch={search} onSelect={pick}
            value={null} notFoundContent={null}
            options={suggestions.map(s => ({ value: s.placeId, label: s.text }))} />
        </Form.Item>
        <Form.Item name="title" label="Tên cơ sở" rules={[{ required: true, message: 'Nhập tên cơ sở' }]}>
          <Input placeholder="VD: Cơ sở Quận 1" />
        </Form.Item>
        <Form.Item name="address" label="Địa chỉ" rules={[{ required: true, message: 'Nhập địa chỉ' }]}>
          <Input />
        </Form.Item>
        {area && <Typography.Paragraph type="secondary" style={{ marginTop: -8 }}>Khu vực: {area}</Typography.Paragraph>}
        <Space align="start">
          <Form.Item name="lat" label="Vĩ độ"><InputNumber style={{ width: 150 }} step={0.0001} placeholder="10.7745" /></Form.Item>
          <Form.Item name="lng" label="Kinh độ"><InputNumber style={{ width: 150 }} step={0.0001} placeholder="106.7032" /></Form.Item>
        </Space>
        <Form.Item name="phone" label="Số điện thoại cơ sở"><Input style={{ width: 200 }} /></Form.Item>
        <Form.Item name="head" valuePropName="checked"><Checkbox>Cơ sở chính</Checkbox></Form.Item>
        <Form.Item name="placeId" hidden><Input /></Form.Item>
        <Form.Item name="provinceName" hidden><Input /></Form.Item>
        <Form.Item name="districtName" hidden><Input /></Form.Item>
        <Form.Item name="wardName" hidden><Input /></Form.Item>
      </Form>
    </Modal>
  )
}
