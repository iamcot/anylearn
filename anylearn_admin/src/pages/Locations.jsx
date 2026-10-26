import { Button, Card, Popconfirm, Select, Table, Tag, Typography, message } from 'antd'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import LocationFormModal from '../components/LocationFormModal'

export default function Locations() {
  const [partnerId, setPartnerId] = useState(null)
  const [editing, setEditing] = useState(null) // null | 'new' | location
  const qc = useQueryClient()

  const { data: partners } = useQuery({
    queryKey: ['admin-partners'],
    queryFn: () => client.get('/admin/partners').then(r => r.data?.data ?? []),
    staleTime: 30 * 60_000,
  })
  const { data: locations, isLoading } = useQuery({
    queryKey: ['admin-locations', partnerId],
    queryFn: () => client.get('/admin/locations', { params: { userId: partnerId } }).then(r => r.data?.data ?? []),
    enabled: !!partnerId,
  })
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-locations', partnerId] })

  const hide = useMutation({
    mutationFn: (id) => client.delete(`/admin/locations/${id}`).then(r => r.data),
    onSuccess: () => { message.success('Đã ẩn cơ sở'); refresh() },
  })

  const columns = [
    {
      title: 'Cơ sở', key: 'title',
      render: (_, r) => <div><b>{r.title}</b> {r.head && <Tag color="green">Chính</Tag>}<div style={{ fontSize: 12, color: '#888' }}>{r.address}</div></div>,
    },
    { title: 'Khu vực', key: 'area', render: (_, r) => [r.districtName, r.provinceName].filter(Boolean).join(', ') || <Tag color="orange">Chưa có</Tag> },
    {
      title: 'Toạ độ', key: 'geo', width: 130,
      render: (_, r) => r.hasCoordinates ? <Tag color="green">Đã có</Tag> : <Tag color="orange">Thiếu: không lọc &quot;gần tôi&quot; được</Tag>,
    },
    { title: 'SĐT', dataIndex: 'phone', key: 'phone', width: 120 },
    {
      title: '', key: 'action', width: 130,
      render: (_, r) => (
        <>
          <Button size="small" onClick={() => setEditing(r)}>Sửa</Button>{' '}
          <Popconfirm title="Ẩn cơ sở này? Lịch học đang dùng vẫn giữ link cũ." okText="Ẩn" cancelText="Hủy" onConfirm={() => hide.mutate(r.id)}>
            <Button size="small" danger>Ẩn</Button>
          </Popconfirm>
        </>
      ),
    },
  ]

  return (
    <Card title="Địa điểm đối tác" extra={partnerId && <Button type="primary" onClick={() => setEditing('new')}>+ Thêm cơ sở</Button>}>
      <Typography.Paragraph type="secondary">
        Mỗi đối tác có nhiều cơ sở. Khóa học chọn một cơ sở mặc định; từng lịch học có thể chọn cơ sở khác.
      </Typography.Paragraph>
      <Select showSearch optionFilterProp="label" placeholder="Chọn đối tác (tên hoặc SĐT)" style={{ width: 360, marginBottom: 16 }}
        value={partnerId} onChange={setPartnerId}
        options={(partners ?? []).map(p => ({ value: p.id, label: `${p.name ?? `ID ${p.id}`} · ${p.phone ?? ''}` }))} />
      {partnerId && <Table rowKey="id" size="small" loading={isLoading} dataSource={locations ?? []} columns={columns} pagination={false} />}
      <LocationFormModal open={!!editing} partnerId={partnerId} location={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh() }} />
    </Card>
  )
}
