import { Alert, Button, Card, Col, Form, InputNumber, Row, Space, Switch, Typography, message } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'

function groupFields(fields) {
  const out = []
  for (const f of fields ?? []) {
    let g = out.find(x => x.name === f.group)
    if (!g) { g = { name: f.group, fields: [] }; out.push(g) }
    g.fields.push(f)
  }
  return out
}

/** Every price, daily limit and switch of the Leo Xu shop (plan 15), plus the quiz numbers the shop shares (item prices, energy, pack size). */
export default function FunShop() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [form] = Form.useForm()
  const { data, isLoading } = useQuery({
    queryKey: ['admin-fun-shop-config'],
    queryFn: () => client.get('/admin/fun/shop-config').then(r => r.data?.data ?? null),
  })
  useEffect(() => {
    if (data) form.setFieldsValue({ enabled: data.enabled, numbers: data.numbers, quizNumbers: data.quizNumbers })
  }, [data, form])

  // item prices and energy come from the quiz table, everything else from the shop table
  const quizGroups = useMemo(() => groupFields(data?.quizFields), [data])
  const shopGroups = useMemo(() => groupFields(data?.fields), [data])

  const save = useMutation({
    mutationFn: values => client.put('/admin/fun/shop-config', values).then(r => r.data),
    onSuccess: res => {
      if (res.resultCode !== 1) return message.error(res.message)
      message.success('Đã lưu cấu hình cửa hàng')
      qc.invalidateQueries({ queryKey: ['admin-fun-shop-config'] })
      qc.invalidateQueries({ queryKey: ['admin-quiz-settings'] })
    },
  })

  const card = (g, name) => (
    <Card key={`${name}-${g.name}`} size="small" title={g.name} style={{ marginBottom: 12 }}>
      <Row gutter={12}>
        {g.fields.map(f => (
          <Col xs={24} md={12} key={f.key}>
            <Form.Item name={[name, f.key]} label={f.label} extra={`Mặc định ${f.def}, từ ${f.min} đến ${f.max}`}>
              <InputNumber min={f.min} max={f.max} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        ))}
      </Row>
    </Card>
  )

  return (
    <div>
      <Space style={{ marginBottom: 8 }}>
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/fun-events')}>Vui học</Button>
      </Space>
      <Typography.Title level={4} style={{ marginTop: 0 }}>Cửa hàng Leo Xu</Typography.Title>
      <Alert type="info" showIcon style={{ marginBottom: 12 }}
        message="Một danh mục cho mọi nơi bán (trang Cửa hàng và cửa hàng trong Leo rank), nên đổi giá ở đây là mọi chỗ khớp ngay. Giá vật phẩm, năng lượng và số câu của gói dùng chung với trang Quiz Leo rank. Công tắc 0 là ngừng bán món đó." />
      <Form form={form} layout="vertical" onFinish={values => save.mutate(values)} disabled={isLoading}>
        <Card size="small" title="Chung" style={{ marginBottom: 12 }}>
          <Form.Item name="enabled" label="Bật cửa hàng" valuePropName="checked" style={{ marginBottom: 0 }}><Switch /></Form.Item>
        </Card>
        {quizGroups.map(g => card(g, 'quizNumbers'))}
        {shopGroups.map(g => card(g, 'numbers'))}
        <Button type="primary" htmlType="submit" loading={save.isPending}>Lưu cấu hình</Button>
      </Form>
    </div>
  )
}
