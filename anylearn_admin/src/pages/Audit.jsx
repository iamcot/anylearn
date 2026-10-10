import { App, Badge, Button, Space, Table, Tag, Typography } from 'antd'
import { AuditOutlined, CheckCircleOutlined, ExclamationCircleOutlined, ReloadOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import { fmtVND, fmtDateTime } from '../utils/format'

const detailColumns = [
  { title: 'User ID',   dataIndex: 'userId',  width: 100 },
  { title: 'wallet_c',  dataIndex: 'walletC', render: v => fmtVND(v) },
  { title: 'Tổng tx duyệt', dataIndex: 'txSum', render: v => fmtVND(v) },
  {
    title: 'Sai lệch (Δ)',
    dataIndex: 'delta',
    render: v => <Tag color={v > 0 ? 'orange' : 'red'}>{v > 0 ? '+' : ''}{fmtVND(v)}</Tag>,
  },
]

const runColumns = [
  {
    title: 'Thời gian chạy', dataIndex: 'ranAt', width: 180,
    render: v => fmtDateTime(v),
  },
  {
    title: 'Kích hoạt', dataIndex: 'triggeredBy', width: 120,
    render: v => <Tag>{v === 'scheduled' ? '⏰ Tự động' : '▶ Thủ công'}</Tag>,
  },
  {
    title: 'Trạng thái', dataIndex: 'status', width: 130,
    render: (v, row) => v === 'ok'
      ? <Tag icon={<CheckCircleOutlined />} color="success">Không sai lệch</Tag>
      : <Tag icon={<ExclamationCircleOutlined />} color="warning">{row.discrepancyCount} sai lệch</Tag>,
  },
]

export default function Audit() {
  const { message } = App.useApp()
  const qc = useQueryClient()

  const { data: logs, isLoading } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => client.get('/admin/audit/logs').then(r => r.data?.data ?? []),
  })

  const runMutation = useMutation({
    mutationFn: () => client.post('/admin/audit/run').then(r => r.data?.data),
    onSuccess: (data) => {
      qc.invalidateQueries(['admin-audit-logs'])
      if (data?.status === 'ok') message.success('Kiểm toán xong — không có sai lệch')
      else message.warning(`Phát hiện ${data?.discrepancyCount} sai lệch`)
    },
    onError: () => message.error('Kiểm toán thất bại'),
  })

  return (
    <div style={{ padding: 24 }}>
      <div className="page-header">
        <div className="page-title">Kiểm toán anyPoint</div>
        <span className="page-subtitle">Lịch sử đối soát wallet_c — tự động chạy lúc 8h sáng mỗi ngày</span>
      </div>

      <div className="page-content">
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
          <Typography.Text type="secondary">
            So sánh <code>wallet_c</code> với tổng giao dịch đã duyệt của từng user.
          </Typography.Text>
          <Button
            type="primary" icon={<AuditOutlined />}
            loading={runMutation.isPending}
            onClick={() => runMutation.mutate()}
          >
            Chạy ngay
          </Button>
        </Space>

        <Table
          rowKey="id"
          dataSource={logs ?? []}
          columns={runColumns}
          loading={isLoading}
          size="small"
          scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 20, showSizeChanger: false }}
          expandable={{
            rowExpandable: row => row.discrepancyCount > 0,
            expandedRowRender: row => (
              <Table
                size="small"
                dataSource={row.details ?? []}
                columns={detailColumns}
                rowKey="userId"
                pagination={false}
                style={{ margin: '8px 0' }}
              />
            ),
          }}
        />
      </div>
    </div>
  )
}
