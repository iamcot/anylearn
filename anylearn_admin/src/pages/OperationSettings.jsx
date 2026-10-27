import { Alert, App as AntApp, Button, Card, Checkbox, Form, Input, InputNumber, Popconfirm, Space, Switch, Typography } from 'antd'
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
    if (data) form.setFieldsValue({ ...data, remindHours: data.remindHours.join(', '), preStartDays: data.preStartDays.join(', '), feeDays: data.feeDays.join(', ') })
  }, [data, form])

  const save = useMutation({
    mutationFn: values => client.put('/admin/settings', { ...values, remindHours: parseHours(values.remindHours), preStartDays: parseHours(values.preStartDays), feeDays: parseHours(values.feeDays) }).then(r => {
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
          <Form.Item name="reviewTopRatedDays" label="Top khóa học được đánh giá cao: tính đánh giá trong (ngày)" rules={[{ required: true, message: 'Nhập số ngày' }]}
            extra="Trang chủ xếp khóa theo điểm đánh giá trung bình của các đánh giá viết trong khoảng này. Từ 30 ngày trở xuống tiêu đề ghi “trong tháng”, từ 31 đến 90 ngày ghi “trong quý”, nhiều hơn thì không ghi thời gian. Ít khách thì để rộng (mặc định 90), nhiều đánh giá thì thu hẹp lại.">
            <InputNumber min={7} max={3650} precision={0} addonAfter="ngày" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="reviewRemindEnabled" label="Nhắc phụ huynh viết đánh giá" valuePropName="checked"
            extra="Gửi thông báo khi bé học được nửa khóa và khi khóa kết thúc (mỗi mốc một lần), nếu chưa viết đánh giá.">
            <Switch />
          </Form.Item>
        </Card>

        <Card title="Vòng đời học viên (nhắc lịch, gia hạn, hậu mãi)" style={{ marginBottom: 16 }}>
          <Form.Item name="lifecycleEnabled" label="Bật nhắc tự động" valuePropName="checked"
            extra="Tắt thì không gửi nhắc khai giảng, vắng học, khảo sát giữa khóa. Mỗi tin gửi cả trong app (kèm push) và email.">
            <Switch />
          </Form.Item>
          <Form.Item label="Giờ gửi tin" extra="Chỉ gửi trong khoảng giờ này, tin đến hạn ban đêm sẽ gửi vào sáng hôm sau.">
            <Space>
              <Form.Item name="sendFromHour" noStyle rules={[{ required: true }]}><InputNumber min={0} max={23} precision={0} addonAfter="giờ" style={{ width: 120 }} /></Form.Item>
              <span>đến</span>
              <Form.Item name="sendToHour" noStyle rules={[{ required: true }]}><InputNumber min={1} max={24} precision={0} addonAfter="giờ" style={{ width: 120 }} /></Form.Item>
            </Space>
          </Form.Item>
          <Form.Item name="preStartDays" label="Nhắc trước khai giảng (ngày)" rules={[{ required: true, message: 'Nhập ít nhất một mốc' }]}
            extra="Cách nhau bằng dấu phẩy. Ví dụ 3, 1: nhắc trước 3 ngày và trước 1 ngày, kèm giờ tập trung, địa điểm, đồ mang theo của lớp.">
            <Input style={{ width: 240 }} />
          </Form.Item>
          <Form.Item name="absentEnabled" label="Bật báo vắng học" valuePropName="checked"
            extra="Đang tắt mặc định vì nhiều lớp chưa ghi điểm danh đầy đủ, bật khi phụ huynh và admin đã điểm danh đều.">
            <Switch />
          </Form.Item>
          <Form.Item name="absentStreak" label="Báo khi vắng liên tiếp (buổi)" rules={[{ required: true, message: 'Nhập số buổi' }]}
            extra="Phụ huynh nhận tin hỏi thăm (kèm cách xin nghỉ / đổi lịch) và admin nhận thông báo. Chỉ áp dụng lớp có điểm danh. Buổi đã được duyệt nghỉ không tính là vắng.">
            <InputNumber min={1} max={20} precision={0} addonAfter="buổi" style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="surveyPercent" label="Khảo sát giữa khóa khi học được (%)" rules={[{ required: true, message: 'Nhập phần trăm' }]}
            extra="Hỏi phụ huynh chấm 1 đến 5 sao khi bé học được tỷ lệ này của số buổi. Từ 10 đến 90.">
            <InputNumber min={10} max={90} precision={0} addonAfter="%" style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="surveyLowScore" label="Điểm bị coi là thấp (từ mức này trở xuống)" rules={[{ required: true, message: 'Nhập điểm' }]}
            extra="Điểm thấp báo cho admin để gọi hỏi thăm phụ huynh.">
            <InputNumber min={1} max={4} precision={0} addonAfter="sao" style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="renewSessionsLeft" label="Nhắc gia hạn gói khi còn (buổi)" rules={[{ required: true, message: 'Nhập số buổi' }]}
            extra="Gói mua theo số buổi: nhắc gia hạn khi còn từ số buổi này trở xuống.">
            <InputNumber min={1} max={30} precision={0} addonAfter="buổi" style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="renewDaysBefore" label="Nhắc gia hạn trước ngày kết thúc (ngày)" rules={[{ required: true, message: 'Nhập số ngày' }]}
            extra="Khóa tính theo thời gian: nhắc khi còn từ số ngày này trở xuống trước khi kết thúc.">
            <InputNumber min={1} max={90} precision={0} addonAfter="ngày" style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="feeDays" label="Nhắc học phí trước hạn (ngày)" rules={[{ required: true, message: 'Nhập ít nhất một mốc' }]}
            extra="Cách nhau bằng dấu phẩy. Ví dụ 7, 1: nhắc trước 7 ngày và trước 1 ngày. Quá hạn vẫn có một nhắc nhẹ nhàng riêng.">
            <Input style={{ width: 240 }} />
          </Form.Item>
          <Form.Item name="earlyRenewBonusPoints" label="Tặng anyPoint khi gia hạn sớm" rules={[{ required: true, message: 'Nhập số anyPoint' }]}
            extra="Tặng khi phụ huynh gia hạn lúc gói / kỳ học phí cũ còn hiệu lực, sau khi đơn được thanh toán. Mỗi lần gia hạn tặng một lần. Nhập 0 để tắt.">
            <InputNumber min={0} max={100000} precision={0} addonAfter="anyPoint" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="fullAttendancePoints" label="Thưởng anyPoint khi điểm danh đủ" rules={[{ required: true, message: 'Nhập số anyPoint' }]}
            extra="Tặng một lần cho tài khoản phụ huynh khi bé có mặt đủ mọi buổi của khóa (buổi xin nghỉ được duyệt không tính là có mặt). Điểm danh do phụ huynh bấm trong Lịch học hoặc admin bấm ở Theo dõi lịch học. Nhập 0 để tắt.">
            <InputNumber min={0} max={100000} precision={0} addonAfter="anyPoint" style={{ width: 200 }} />
          </Form.Item>
        </Card>

        <Card title="Gợi ý khóa học" style={{ marginBottom: 16 }}>
          <Form.Item name="recommendSources" label="Loại gợi ý đang bật"
            extra="Xem hiệu quả từng loại ở trang Lộ trình &amp; gợi ý. Bỏ chọn một loại để ngừng gợi ý theo loại đó.">
            <Checkbox.Group options={[
              { value: 'pathway', label: 'Lộ trình (khóa tiếp theo)' },
              { value: 'sibling', label: 'Anh chị em (cùng đối tác)' },
              { value: 'free_slot', label: 'Khung giờ trống' },
              { value: 'season', label: 'Theo mùa (bộ sưu tập)' },
              { value: 'interest', label: 'Sở thích của bé' },
            ]} />
          </Form.Item>
          <Form.Item name="recommendDismissDays" label={'Không nhắc lại sau khi bấm "Không quan tâm" (ngày)'} rules={[{ required: true, message: 'Nhập số ngày' }]}
            extra="Gợi ý đó sẽ không hiện lại cho bé này trong số ngày này. Từ 1 đến 365.">
            <InputNumber min={1} max={365} precision={0} addonAfter="ngày" style={{ width: 160 }} />
          </Form.Item>
        </Card>

        <Card title="Gợi ý khóa học bằng AI" style={{ marginBottom: 16 }}>
          <Form.Item name="aiSuggestEnabled" label="Bật gợi ý bằng AI" valuePropName="checked"
            extra="Tắt thì nút &quot;Gợi ý khóa học bằng AI&quot; biến mất khỏi trang chủ và /today. Cần có khóa API của Anthropic trên máy chủ (ANTHROPIC_API_KEY). Xem số liệu ở trang &quot;Gợi ý AI&quot;.">
            <Switch />
          </Form.Item>
          <Form.Item name="aiCandidateCount" label="Số khóa gửi cho AI" rules={[{ required: true, message: 'Nhập số khóa' }]}
            extra="Hệ thống lọc trước theo tuổi, lịch, khóa đã mua rồi chỉ gửi bấy nhiêu khóa (mỗi khóa một dòng ngắn) cho AI. Nhiều khóa thì chọn kỹ hơn nhưng tốn token hơn. Từ 10 đến 100, mặc định 50.">
            <InputNumber min={10} max={100} precision={0} addonAfter="khóa" style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="aiResultCount" label="Số khóa AI trả về" rules={[{ required: true, message: 'Nhập số khóa' }]}
            extra="Số khóa hiện cho phụ huynh. Nên chọn số chia hết cho 2, 3 và 4 (ví dụ 12) để lưới hiện đủ hàng trên điện thoại, máy tính bảng và máy tính. Từ 4 đến 24, mặc định 12, không lớn hơn số khóa gửi đi.">
            <InputNumber min={4} max={24} precision={0} addonAfter="khóa" style={{ width: 160 }} />
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
