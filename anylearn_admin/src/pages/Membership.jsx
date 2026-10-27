import { Alert, Button, Card, Col, Form, InputNumber, Row, Statistic, Switch, Typography, message } from 'antd'
import { CrownOutlined } from '@ant-design/icons'
import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'

const TIERS = [['member', 'Thành viên'], ['silver', 'Bạc'], ['gold', 'Vàng'], ['diamond', 'Kim cương']]

export default function Membership() {
  const [form] = Form.useForm()
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ['admin-membership'], queryFn: () => client.get('/admin/membership/settings').then(r => r.data?.data) })
  useEffect(() => { if (data) form.setFieldsValue(data) }, [data, form])

  const save = useMutation({
    mutationFn: body => client.put('/admin/membership/settings', body).then(r => r.data),
    onSuccess: res => {
      if (res.resultCode !== 1) return message.error(res.message)
      message.success('Đã lưu')
      qc.invalidateQueries({ queryKey: ['admin-membership'] })
    },
  })
  const refresh = useMutation({
    mutationFn: () => client.post('/admin/membership/refresh').then(r => r.data),
    onSuccess: () => { message.success('Đã tính lại hạng của mọi thành viên'); qc.invalidateQueries({ queryKey: ['admin-membership'] }) },
  })

  return (
    <div style={{ padding: 24, maxWidth: 820 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <CrownOutlined style={{ fontSize: 20, color: '#1677ff' }} />
        <Typography.Title level={4} style={{ margin: 0 }}>Hạng thành viên & ưu đãi gia đình</Typography.Title>
      </div>

      <Card title="Số thành viên theo hạng" style={{ marginBottom: 16 }} extra={<Button loading={refresh.isPending} onClick={() => refresh.mutate()}>Tính lại ngay</Button>}>
        <Row gutter={16}>
          {TIERS.map(([key, label]) => <Col key={key} span={6}><Statistic title={label} value={data?.distribution?.[key] ?? 0} /></Col>)}
        </Row>
        <Typography.Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
          Hạng tính theo tổng tiền các đơn đã hoàn tất trong 12 tháng gần nhất, tự tính lại mỗi đêm và mỗi khi một đơn được thanh toán. Chỉ áp dụng cho tài khoản thành viên (không phải đối tác).
        </Typography.Paragraph>
      </Card>

      <Form form={form} layout="vertical" onFinish={values => save.mutate(values)}>
        <Card title="Hạng thành viên" style={{ marginBottom: 16 }}>
          <Alert type="warning" showIcon style={{ marginBottom: 16 }}
            message="Hệ số điểm làm tăng chi phí anyPoint: thành viên hạng Kim cương nhận gấp đôi anyPoint khi mua. Đặt hệ số bằng 1 nếu chưa muốn thưởng thêm." />
          <Form.Item name="tiersEnabled" label="Bật hạng thành viên" valuePropName="checked"><Switch /></Form.Item>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="silverMin" label="Hạng Bạc từ (đ / 12 tháng)"><InputNumber min={1} step={500000} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="goldMin" label="Hạng Vàng từ (đ)"><InputNumber min={1} step={500000} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="diamondMin" label="Hạng Kim cương từ (đ)"><InputNumber min={1} step={500000} style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="multSilver" label="Hệ số anyPoint hạng Bạc"><InputNumber min={1} max={5} step={0.1} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="multGold" label="Hệ số hạng Vàng"><InputNumber min={1} max={5} step={0.1} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="multDiamond" label="Hệ số hạng Kim cương"><InputNumber min={1} max={5} step={0.1} style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
        </Card>

        <Card title="Ưu đãi gia đình" style={{ marginBottom: 16 }}>
          <Typography.Paragraph type="secondary">
            Bé thứ 2 trở lên của cùng một tài khoản được giảm giá khi đăng ký trong khoảng ngày cài đặt kể từ lúc bé khác đăng ký (hoặc cùng một giỏ hàng). Bé đầu tiên không được giảm.
          </Typography.Paragraph>
          <Form.Item name="familyEnabled" label="Bật ưu đãi gia đình" valuePropName="checked"><Switch /></Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="familyPercent" label="Giảm (%) cho bé thứ 2 trở lên (0 = không giảm)"><InputNumber min={0} max={50} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="familyWindowDays" label="Trong vòng (ngày)"><InputNumber min={1} max={365} style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
        </Card>

        <Button type="primary" htmlType="submit" loading={save.isPending}>Lưu</Button>
      </Form>
    </div>
  )
}
