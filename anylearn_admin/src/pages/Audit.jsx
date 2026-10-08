import { App, Badge, Button, Space, Table, Tag, Typography } from 'antd'
import { AuditOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import client from '../api/client'
import { fmtVND } from '../utils/format'

export default function Audit() {
  const { message } = App.useApp()
  const [result, setResult] = useState(null)

  const auditMutation = useMutation({
    mutationFn: () => client.post('/admin/audit/run').then(r => r.data?.data ?? r.data),
    onSuccess: (data) => { setResult(data); if (data.total === 0) message.success('Không có sai lệch') },
    onError: () => message.error('Kiểm toán thất bại'),
  })

  const columns = [
    { title: 'User ID', dataIndex: 'userId', width: 100 },
    { title: 'wallet_c hiện tại', dataIndex: 'walletC', render: v => fmtVND(v) },
    { title: 'Tổng giao dịch đã duyệt', dataIndex: 'txSum', render: v => fmtVND(v) },
    {
      title: 'Sai lệch (Δ)',
      dataIndex: 'delta',
      render: v => (
        <Tag color={v > 0 ? 'orange' : 'red'}>
          {v > 0 ? '+' : ''}{fmtVND(v)}
        </Tag>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={4} style={{ marginBottom: 4 }}>
        <AuditOutlined style={{ marginRight: 8 }} />
        Kiểm toán anyPoint
      </Typography.Title>
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
        So sánh số dư <code>wallet_c</code> với tổng giao dịch đã duyệt. Hệ thống cũng tự chạy lúc 8h sáng mỗi ngày.
      </Typography.Text>

      <Button
        type="primary" icon={<AuditOutlined />}
        loading={auditMutation.isPending}
        onClick={() => auditMutation.mutate()}
      >
        Chạy kiểm toán ngay
      </Button>

      {result && (
        <div style={{ marginTop: 24 }}>
          {result.total === 0 ? (
            <Space style={{ padding: '16px 20px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8 }}>
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
              <Typography.Text strong style={{ color: '#389e0d' }}>
                Tất cả số dư wallet_c khớp với giao dịch — không có sai lệch.
              </Typography.Text>
            </Space>
          ) : (
            <>
              <Space style={{ padding: '12px 20px', background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 8, marginBottom: 16 }}>
                <ExclamationCircleOutlined style={{ color: '#fa8c16', fontSize: 20 }} />
                <Typography.Text strong style={{ color: '#d46b08' }}>
                  Phát hiện <Badge count={result.total} color="orange" /> user có số dư không khớp.
                </Typography.Text>
              </Space>
              <Table
                size="small"
                dataSource={result.items}
                columns={columns}
                rowKey="userId"
                pagination={false}
                style={{ background: '#fff', borderRadius: 8, overflow: 'hidden' }}
              />
            </>
          )}
        </div>
      )}
    </div>
  )
}
