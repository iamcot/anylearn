import { Alert, App as AntApp, Button, Card, Form, Input, Select, Typography } from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import { bankNameOf, bankOptions } from '../config/banks'

const QUERY_KEY = ['admin-bank-account']
const ACCOUNT_NUMBER_PATTERN = /^[0-9A-Za-z]{4,19}$/

export default function BankAccount() {
  const [form] = Form.useForm()
  const { message } = AntApp.useApp()
  const queryClient = useQueryClient()

  const { data: account, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => client.get('/admin/bank-account').then(r => r.data?.data),
  })

  useEffect(() => {
    if (account) form.setFieldsValue(account)
  }, [account, form])

  const save = useMutation({
    mutationFn: values => client.put('/admin/bank-account', {
      ...values,
      bankName: bankNameOf(values.bankBin, account?.bankName),
    }).then(r => {
      if (r.data?.resultCode === 0) throw new Error(r.data.message)
      return r.data?.data
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      message.success('Đã lưu tài khoản ngân hàng')
    },
    onError: error => message.error(error.message || 'Không lưu được'),
  })

  return (
    <div style={{ padding: 24 }}>
      <div className="page-header">
        <div className="page-title">Tài khoản ngân hàng</div>
        <span className="page-subtitle">Tài khoản nhận tiền chuyển khoản. Khách thấy mã QR và thông tin này ở trang đơn hàng.</span>
      </div>

      <div className="page-content">
        <Card loading={isLoading} style={{ maxWidth: 560 }}>
          <Alert
            type="info" showIcon style={{ marginBottom: 20 }}
            message="Số tài khoản phải trùng tài khoản đã liên kết với SePay, nếu không đơn sẽ không tự được duyệt khi tiền về."
          />
          <Form form={form} layout="vertical" onFinish={values => save.mutate(values)}>
            <Form.Item name="bankBin" label="Ngân hàng" rules={[{ required: true, message: 'Chọn ngân hàng' }]}>
              <Select showSearch optionFilterProp="label" options={bankOptions(account?.bankBin, account?.bankName)} placeholder="Chọn ngân hàng" />
            </Form.Item>
            <Form.Item
              name="accountNumber" label="Số tài khoản" normalize={value => value?.replace(/\s/g, '')}
              rules={[{ required: true, message: 'Nhập số tài khoản' }, { pattern: ACCOUNT_NUMBER_PATTERN, message: '4 đến 19 chữ hoặc số' }]}
            >
              <Input inputMode="numeric" placeholder="VD: 0123456789" />
            </Form.Item>
            <Form.Item name="accountName" label="Tên chủ tài khoản" rules={[{ required: true, message: 'Nhập tên chủ tài khoản' }]}>
              <Input placeholder="VD: CONG TY CP ANYLEARN" />
            </Form.Item>
            <Form.Item name="zaloPhone" label="Zalo hỗ trợ" extra="Hiện cho khách khi cần gửi ảnh chuyển khoản. Có thể để trống.">
              <Input placeholder="VD: 0374900344" />
            </Form.Item>
            <Typography.Paragraph type="secondary" style={{ fontSize: 12 }}>
              Nội dung chuyển khoản của khách luôn là <code>ALQRPAY</code> + mã đơn hàng (VD <code>ALQRPAY1234</code>).
            </Typography.Paragraph>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={save.isPending}>Lưu</Button>
          </Form>
        </Card>
      </div>
    </div>
  )
}
