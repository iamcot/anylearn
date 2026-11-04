import { Button, Card, Form, Space, Typography, message } from 'antd'
import SettingInput, { settingHint, settingLabel } from './SettingInput'
import { useEffect } from 'react'

// One form for a table of number settings (backend `NumberSettings`: {numbers, fields[{key,label,group,def,min,max}]}).
// `onSave(numbers)` must return a promise of the server's new `{numbers, fields}`.
export default function NumberSettingsForm({ settings, onSave, saving, extra }) {
  const [form] = Form.useForm()
  useEffect(() => { if (settings?.numbers) form.setFieldsValue(settings.numbers) }, [settings, form])
  if (!settings) return null
  const groups = []
  for (const f of settings.fields ?? []) {
    let g = groups.find(x => x.name === f.group)
    if (!g) { g = { name: f.group, fields: [] }; groups.push(g) }
    g.fields.push(f)
  }
  const submit = async values => {
    try { await onSave(values); message.success('Đã lưu') } catch (e) { message.error(e.message) }
  }
  return (
    <Form form={form} layout="vertical" onFinish={submit}>
      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        {groups.map(g => (
          <Card key={g.name} size="small" title={g.name}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0 16px' }}>
              {g.fields.map(f => (
                <Form.Item key={f.key} name={f.key} label={settingLabel(f)}
                  extra={<Typography.Text type="secondary" style={{ fontSize: 12 }}>{settingHint(f)}</Typography.Text>}
                  rules={[{ required: true, message: 'Nhập số' }]}>
                  <SettingInput field={f} />
                </Form.Item>
              ))}
            </div>
          </Card>
        ))}
        {extra}
        <Button type="primary" htmlType="submit" loading={saving}>Lưu cài đặt</Button>
      </Space>
    </Form>
  )
}
