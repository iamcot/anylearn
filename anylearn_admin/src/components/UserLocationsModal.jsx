import { Button, Empty, List, Modal, Popconfirm, Space, Tag, Typography, message } from 'antd'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import { mapLink } from '../utils/maps'
import LocationFormModal from './LocationFormModal'
import { PARTNER_ROLES } from '../utils/roles'


// Every user can have addresses: a member's home (at least the area, for "near me"), a partner's branches with one head office.
export default function UserLocationsModal({ open, user, onClose }) {
  const [editing, setEditing] = useState(null) // null | 'new' | location
  const qc = useQueryClient()
  const isPartner = PARTNER_ROLES.includes(user?.role)

  const { data: locations, isLoading } = useQuery({
    queryKey: ['admin-locations', user?.id],
    queryFn: () => client.get('/admin/locations', { params: { userId: user.id } }).then(r => r.data?.data ?? []),
    enabled: open && !!user?.id,
  })
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-locations', user?.id] })

  const makeHead = useMutation({
    mutationFn: (l) => client.put(`/admin/locations/${l.id}`, { ...l, head: true }).then(r => r.data),
    onSuccess: (res) => { if (res.resultCode !== 1) return message.error(res.message); refresh() },
  })
  const hide = useMutation({
    mutationFn: (id) => client.delete(`/admin/locations/${id}`).then(r => r.data),
    onSuccess: () => { message.success('Đã ẩn địa chỉ'); refresh() },
  })

  const headLabel = isPartner ? 'Hội sở / địa chỉ mặc định' : 'Địa chỉ chính'

  return (
    <Modal open={open} onCancel={onClose} footer={null} width={640} destroyOnClose
      title={`${isPartner ? 'Cơ sở' : 'Địa chỉ'} của ${user?.name ?? ''}`}>
      <Space style={{ marginBottom: 12, width: '100%', justifyContent: 'space-between' }}>
        <Typography.Text type="secondary">
          {isPartner ? 'Đối tác có thể có nhiều cơ sở, một nơi là hội sở (mặc định).' : 'Địa chỉ nhà, ít nhất là khu vực, để gợi ý lớp gần bạn.'}
        </Typography.Text>
        <Button type="primary" onClick={() => setEditing('new')}>+ Thêm địa chỉ</Button>
      </Space>
      <List loading={isLoading} dataSource={locations ?? []} locale={{ emptyText: <Empty description="Chưa có địa chỉ" /> }}
        renderItem={l => (
          <List.Item actions={[
            <a key="map" href={mapLink(l)} target="_blank" rel="noreferrer">Bản đồ</a>,
            <a key="edit" onClick={() => setEditing(l)}>Sửa</a>,
            !l.head && <a key="head" onClick={() => makeHead.mutate(l)}>Đặt làm {headLabel.split(' / ')[0].toLowerCase()}</a>,
            <Popconfirm key="hide" title="Ẩn địa chỉ này? Lịch học đang dùng vẫn giữ liên kết cũ." okText="Ẩn" cancelText="Hủy" onConfirm={() => hide.mutate(l.id)}>
              <a style={{ color: '#ff4d4f' }}>Ẩn</a>
            </Popconfirm>,
          ].filter(Boolean)}>
            <List.Item.Meta
              title={<>{l.title} {l.head && <Tag color="green">{headLabel.split(' / ')[0]}</Tag>}{!l.hasCoordinates && <Tag color="orange">Thiếu toạ độ</Tag>}</>}
              description={<>{l.address}<br /><span style={{ fontSize: 12 }}>{[l.wardName, l.districtName, l.provinceName].filter(Boolean).join(', ') || 'Chưa có khu vực'}</span></>} />
          </List.Item>
        )} />
      <LocationFormModal open={!!editing} userId={user?.id} userName={user?.name} location={editing === 'new' ? null : editing} headLabel={headLabel}
        onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh() }} />
    </Modal>
  )
}
