import { Button, Card, Form, Input, Typography } from 'antd'
import { LockOutlined, PhoneOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import logo from '/LogoanyLEARN.svg'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleFinish(values) {
    setLoading(true)
    setError('')
    try {
      await login(values.phone, values.password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f5f5f5' }}>
      <Card style={{ width: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src={logo} alt="AnyLearn" style={{ height: 40, marginBottom: 8 }} />
          <Typography.Title level={4} style={{ margin: 0 }}>AnyLearn Admin</Typography.Title>
        </div>

        {error && <div style={{ color: '#ff4d4f', marginBottom: 16, textAlign: 'center' }}>{error}</div>}

        <Form layout="vertical" onFinish={handleFinish} requiredMark={false}>
          <Form.Item name="phone" rules={[{ required: true, message: 'Nhập số điện thoại' }]}>
            <Input prefix={<PhoneOutlined />} placeholder="Số điện thoại" size="large" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Nhập mật khẩu' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" size="large" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
