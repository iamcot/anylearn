import { Alert, Card, Space, Table, Tag, Typography } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import client from '../api/client'

export default function ItemGaps() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-item-gaps'],
    queryFn: () => client.get('/admin/items/attribute-gaps').then(r => r.data?.data),
  })
  const labels = data?.labels ?? {}

  const columns = [
    { title: 'Khóa học', key: 'title', render: (_, r) => <Link to={`/items/${r.id}`}>{r.title}</Link> },
    {
      title: 'Đối tác', key: 'owner', width: 240,
      render: (_, r) => (
        <div>
          <div>{r.ownerName || `#${r.userId}`} {r.ownerRole && <Tag>{r.ownerRole}</Tag>}</div>
          {r.ownerPhone && <a href={`tel:${r.ownerPhone}`} style={{ fontSize: 12 }}>{r.ownerPhone}</a>}
        </div>
      ),
    },
    {
      title: 'Còn thiếu', key: 'gaps',
      render: (_, r) => <Space size={[4, 4]} wrap>{r.gaps.map(key => <Tag key={key} color="orange">{labels[key] ?? key}</Tag>)}</Space>,
    },
  ]

  return (
    <Card title="Khóa học thiếu thuộc tính tìm kiếm">
      <Typography.Paragraph type="secondary">
        Khóa thiếu thuộc tính sẽ ít xuất hiện khi khách lọc theo tuổi, khu vực, giờ học… Bấm tên khóa để bổ sung. &quot;Loại đối tác&quot; đặt ở trang Thành viên.
      </Typography.Paragraph>
      {data && (
        <Space size={[8, 8]} wrap style={{ marginBottom: 16 }}>
          {Object.entries(data.summary).map(([key, count]) => (
            <Tag key={key} color={count === 0 ? 'green' : 'orange'}>{labels[key] ?? key}: thiếu {count}/{data.checked}</Tag>
          ))}
        </Space>
      )}
      {data && data.items.length === 0 && <Alert type="success" showIcon message="Mọi khóa đang bán đều đủ thuộc tính." />}
      <Table rowKey="id" size="small" loading={isLoading} dataSource={data?.items ?? []} columns={columns} pagination={{ pageSize: 50, hideOnSinglePage: true }} />
    </Card>
  )
}
