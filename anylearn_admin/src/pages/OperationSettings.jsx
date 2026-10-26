import { Alert, App as AntApp, Button, Card, Form, Input, InputNumber, Popconfirm, Switch, Typography } from 'antd'
import { ReloadOutlined, SaveOutlined } from '@ant-design/icons'
import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'

const QUERY_KEY = ['admin-settings']

const parseHours = (text) => String(text ?? '').split(/[,\s]+/).filter(Boolean).map(Number)

export default function OperationSettings() {
  const [form] = Form.useForm()
  const { message } = AntApp.useApp()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => client.get('/admin/settings').then(r => r.data?.data),
  })

  useEffect(() => {
    if (data) form.setFieldsValue({ ...data, remindHours: data.remindHours.join(', ') })
  }, [data, form])

  const save = useMutation({
    mutationFn: values => client.put('/admin/settings', { ...values, remindHours: parseHours(values.remindHours) }).then(r => {
      if (r.data?.resultCode === 0) throw new Error(r.data.message)
      return r.data?.data
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      message.success('Đã lưu cấu hình')
    },
    onError: error => message.error(error.message || 'Không lưu được'),
  })

  const reindex = useMutation({
    mutationFn: () => client.post('/admin/reindex', null, { timeout: 10 * 60 * 1000 }).then(r => {
      if (r.data?.resultCode === 0) throw new Error(r.data.message)
    }),
    onSuccess: () => message.success('Đã cập nhật lại toàn bộ chỉ mục tìm kiếm'),
    onError: error => message.error(error.message || 'Không cập nhật được'),
  })

  return (
    <div style={{ maxWidth: 688, padding: 24 }}>
      <Typography.Title level={4}>Cấu hình vận hành</Typography.Title>
      <Form form={form} layout="vertical" disabled={isLoading} onFinish={save.mutate}>
        <Card title="Tìm kiếm" style={{ marginBottom: 16 }}>
          <Form.Item name="nearRadiusKm" label={'Bán kính "Gần tôi" (km)'} rules={[{ required: true, message: 'Nhập số km' }]}
            extra={'Khách bấm "Gần tôi" sẽ thấy các khóa có cơ sở trong bán kính này. Từ 1 đến 100 km, mặc định 10.'}>
            <InputNumber min={1} max={100} precision={0} addonAfter="km" style={{ width: 160 }} />
          </Form.Item>
        </Card>

        <Card title="Đơn chờ thanh toán" style={{ marginBottom: 16 }}>
          <Form.Item name="remindHours" label="Nhắc thanh toán sau (giờ)" rules={[{ required: true, message: 'Nhập ít nhất một mốc' }]}
            extra="Cách nhau bằng dấu phẩy. Ví dụ 2, 24: nhắc lần 1 sau 2 giờ, lần 2 (có email) sau 24 giờ kể từ lúc đặt đơn.">
            <Input style={{ width: 240 }} />
          </Form.Item>
          <Form.Item name="autoCancelEnabled" label="Tự hủy đơn quá hạn" valuePropName="checked"
            extra="Tắt thì đơn chờ thanh toán không bao giờ tự hủy.">
            <Switch />
          </Form.Item>
          <Form.Item name="autoCancelHours" label="Hủy đơn sau (giờ)" rules={[{ required: true, message: 'Nhập số giờ' }]}
            extra="Kể từ lúc đặt đơn. Anh chị chuyển khoản sau khi đơn bị hủy vẫn được báo cho admin kiểm tra.">
            <InputNumber min={1} max={720} precision={0} addonAfter="giờ" style={{ width: 160 }} />
          </Form.Item>
        </Card>

        <Card title="Đánh giá khóa học" style={{ marginBottom: 16 }}>
          <Form.Item name="reviewPointsText" label="Thưởng khi viết đánh giá (anyPoint)" rules={[{ required: true, message: 'Nhập số anyPoint' }]}
            extra="Cho đánh giá có nhận xét từ 50 ký tự. Mỗi đánh giá chỉ được thưởng một lần, sửa lại không nhận thêm. Nhập 0 để tắt.">
            <InputNumber min={0} max={10000} precision={0} addonAfter="anyPoint" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="reviewPointsMedia" label="Thưởng thêm khi có ảnh (anyPoint)" rules={[{ required: true, message: 'Nhập số anyPoint' }]}
            extra="Cộng thêm khi đánh giá có ít nhất một ảnh. Ẩn hoặc xóa đánh giá thì anyPoint đã thưởng bị thu hồi. Nhập 0 để tắt.">
            <InputNumber min={0} max={10000} precision={0} addonAfter="anyPoint" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="reviewRemindEnabled" label="Nhắc phụ huynh viết đánh giá" valuePropName="checked"
            extra="Gửi thông báo khi bé học được nửa khóa và khi khóa kết thúc (mỗi mốc một lần), nếu chưa viết đánh giá.">
            <Switch />
          </Form.Item>
        </Card>

        <Card title="Chỉ mục tìm kiếm" style={{ marginBottom: 16 }}>
          <Typography.Paragraph type="secondary">
            Tìm kiếm tự cập nhật khi sửa từng khóa học, và chạy lại toàn bộ lúc 5 giờ sáng mỗi ngày. Bấm nút này sau khi sửa
            dữ liệu hàng loạt (gộp tag, nhập địa chỉ, sửa bảng giá...) hoặc sau khi cập nhật phần mềm. Mất vài phút.
          </Typography.Paragraph>
          <Popconfirm title="Cập nhật lại toàn bộ chỉ mục tìm kiếm?" okText="Cập nhật" cancelText="Hủy" onConfirm={() => reindex.mutate()}>
            <Button icon={<ReloadOutlined />} loading={reindex.isPending}>Cập nhật chỉ mục ngay</Button>
          </Popconfirm>
        </Card>

        <Alert type="info" showIcon style={{ marginBottom: 16 }} message="Thay đổi có hiệu lực ngay, không cần khởi động lại." />
        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={save.isPending}>Lưu</Button>
      </Form>
    </div>
  )
}
