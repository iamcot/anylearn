import { Button, Card, Space, Tag, Typography } from 'antd'
import { CheckCircleOutlined, DeleteOutlined, MailOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import RichEditor from '../components/RichEditor'

// Default HTML templates (read from backend resource files via endpoint, or load lazily)
const TEMPLATE_META = {
  'email-order_success': {
    displayName: 'Xác nhận đơn hàng',
    vars: ['userName', 'orderId', 'items', 'amount'],
    subject: 'Xác nhận đơn hàng thành công - anyLEARN',
  },
  'email-activity_registration': {
    displayName: 'Đăng ký hoạt động (gửi admin)',
    vars: ['studentName', 'studentPhone', 'activityType', 'itemTitle', 'date'],
    subject: 'Đăng ký hoạt động mới - anyLEARN',
  },
  'email-schedule_reminder': {
    displayName: 'Nhắc lịch học',
    vars: ['userName', 'itemTitle', 'date', 'scheduleInfo'],
    subject: 'Nhắc nhở lịch học - anyLEARN',
  },
  'email-user_register': {
    displayName: 'Chào mừng đăng ký',
    vars: ['userName', 'phone'],
    subject: 'Chào mừng đến với anyLEARN',
  },
}

export default function EmailSettings() {
  const [selectedKey, setSelectedKey] = useState(null)
  const [editorHtml, setEditorHtml] = useState('')
  const qc = useQueryClient()

  // Load all config to know which keys are customized
  const { data: configs = [] } = useQuery({
    queryKey: ['admin-config'],
    queryFn: () => client.get('/admin/config').then(r => r.data?.data ?? []),
  })
  const customizedKeys = new Set(
    configs.filter(c => c.key?.startsWith('email/')).map(c => c.key)
  )

  // Load default template HTML from backend resource
  const loadDefault = async (key) => {
    try {
      const res = await client.get(`/admin/email-templates/${encodeURIComponent(key)}`)
      return res.data?.data ?? ''
    } catch { return '' }
  }

  const handleSelect = async (key) => {
    setSelectedKey(key)
    // Load custom first, fallback to default
    const custom = configs.find(c => c.key === key)
    if (custom?.value) {
      setEditorHtml(custom.value)
    } else {
      const def = await loadDefault(key)
      setEditorHtml(def)
    }
  }

  const saveMutation = useMutation({
    mutationFn: (key) => client.put(`/admin/config/${encodeURIComponent(key)}`, { value: editorHtml }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-config'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (key) => client.delete(`/admin/config/${encodeURIComponent(key)}`),
    onSuccess: async (_, key) => {
      qc.invalidateQueries({ queryKey: ['admin-config'] })
      const def = await loadDefault(key)
      setEditorHtml(def)
    },
  })

  const handleResetToDefault = async () => {
    if (!selectedKey) return
    const def = await loadDefault(selectedKey)
    setEditorHtml(def)
  }

  const meta = selectedKey ? TEMPLATE_META[selectedKey] : null

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <MailOutlined style={{ fontSize: 20, color: '#00539b' }} />
        <Typography.Title level={4} style={{ margin: 0 }}>Cài đặt Emails</Typography.Title>
      </div>

      <Card
        title="Template email"
        styles={{ body: { padding: 0 } }}
        style={{ borderRadius: 10 }}
      >
        <div style={{ display: 'flex', minHeight: 520 }}>
          {/* Left: template list */}
          <div style={{ width: 280, borderRight: '1px solid #f0f0f0', flexShrink: 0 }}>
            {Object.entries(TEMPLATE_META).map(([key, info]) => {
              const isCustom = customizedKeys.has(key)
              const isSelected = selectedKey === key
              return (
                <div
                  key={key}
                  onClick={() => handleSelect(key)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    background: isSelected ? '#e6f4ff' : 'transparent',
                    borderLeft: isSelected ? '3px solid #1677ff' : '3px solid transparent',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                >
                  <div style={{ fontWeight: isSelected ? 600 : 400, fontSize: 13, color: '#111827', marginBottom: 4 }}>
                    {info.displayName}
                  </div>
                  <Tag
                    color={isCustom ? 'success' : 'default'}
                    icon={isCustom ? <CheckCircleOutlined /> : null}
                    style={{ fontSize: 11 }}
                  >
                    {isCustom ? 'Tùy chỉnh' : 'Mặc định'}
                  </Tag>
                </div>
              )
            })}
          </div>

          {/* Right: editor */}
          <div style={{ flex: 1, padding: '20px 24px', minWidth: 0 }}>
            {!selectedKey ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af', fontSize: 14 }}>
                Chọn một template để chỉnh sửa
              </div>
            ) : (
              <>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{meta?.displayName}</span>
                  <Tag color={customizedKeys.has(selectedKey) ? 'success' : 'default'} icon={customizedKeys.has(selectedKey) ? <CheckCircleOutlined /> : null}>
                    {customizedKeys.has(selectedKey) ? 'Đang dùng template tùy chỉnh' : 'Đang dùng template mặc định'}
                  </Tag>
                </div>

                {/* Available vars */}
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: '#6b7280', marginRight: 8 }}>Biến có thể dùng:</span>
                  {meta?.vars.map(v => (
                    <Tag key={v} style={{ fontFamily: 'monospace', fontSize: 12, marginBottom: 4 }}>
                      {`{{${v}}}`}
                    </Tag>
                  ))}
                </div>

                {/* Editor */}
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 16, overflow: 'hidden' }}>
                  <RichEditor value={editorHtml} onChange={setEditorHtml} />
                </div>

                {/* Actions */}
                <Space wrap>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={saveMutation.isPending}
                    onClick={() => saveMutation.mutate(selectedKey)}
                  >
                    Lưu template
                  </Button>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleResetToDefault}
                  >
                    Tải template mặc định
                  </Button>
                  {customizedKeys.has(selectedKey) && (
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      loading={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(selectedKey)}
                    >
                      Xóa về mặc định
                    </Button>
                  )}
                </Space>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
