import { App, Button, Image, Input, Modal, Popconfirm, Rate, Select, Space, Switch, Table, Tag, Typography } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client'
import { fmtDate } from '../utils/format'

const FILTERS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'published', label: 'Đang hiện' },
  { value: 'hidden', label: 'Đã ẩn' },
  { value: 'resubmitted', label: 'Đã ẩn, người viết đã sửa lại' },
]

// Reviews of one course (itemId) or of every course. Hiding asks for a reason that the author sees; deleting takes back the anyPoint of the review.
export default function ReviewManager({ itemId }) {
  const { message } = App.useApp()
  const qc = useQueryClient()
  const [filter, setFilter] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [hiding, setHiding] = useState(null)
  const [reason, setReason] = useState('')
  const allCourses = itemId == null

  const { data, isLoading } = useQuery({
    queryKey: allCourses ? ['admin-reviews', filter, keyword, page] : ['admin-item-review-table', itemId],
    queryFn: () => allCourses
      ? client.get('/admin/reviews', { params: { status: filter, q: keyword || undefined, page: page - 1, size: 20 } }).then(r => r.data?.data ?? { content: [], total: 0 })
      : client.get(`/admin/items/${itemId}/reviews`).then(r => ({ content: r.data?.data ?? [], total: r.data?.data?.length ?? 0 })),
    placeholderData: keepPreviousData,
  })

  function refresh() {
    qc.invalidateQueries({ queryKey: ['admin-reviews'] })
    qc.invalidateQueries({ queryKey: ['admin-item-reviews'] })
    qc.invalidateQueries({ queryKey: ['admin-item-review-table'] })
    qc.invalidateQueries({ queryKey: ['admin-badges'] })
  }

  const setStatus = useMutation({
    mutationFn: ({ review, status, reason: why }) =>
      client.put(`/admin/items/${review.itemId ?? itemId}/reviews/${review.id}/status`, { status, reason: why }).then(r => r.data),
    onSuccess: (res) => {
      if (res.resultCode !== 1) { message.error(res.message); return }
      setHiding(null)
      setReason('')
      refresh()
    },
  })
  const remove = useMutation({
    mutationFn: (review) => client.delete(`/admin/items/${review.itemId ?? itemId}/reviews/${review.id}`),
    onSuccess: refresh,
  })

  const columns = [
    ...(allCourses ? [{ title: 'Khóa học', dataIndex: 'itemTitle', width: 220, ellipsis: true, render: (v, r) => <Link to={`/items/${r.itemId}`}>{v}</Link> }] : []),
    { title: 'Người dùng', dataIndex: 'userName', width: 140, render: (v, r) => v || r.userId },
    { title: 'Đánh giá', dataIndex: 'rating', width: 130, render: v => <Rate disabled value={Number(v)} style={{ fontSize: 13 }} /> },
    {
      title: 'Nội dung', dataIndex: 'comment',
      render: (v, r) => (
        <div>
          <div>{v}</div>
          {r.media?.length > 0 && (
            <Image.PreviewGroup>
              <Space size={6} wrap style={{ marginTop: 6 }}>
                {r.media.map(url => <Image key={url} src={url} width={56} height={56} style={{ objectFit: 'cover', borderRadius: 6 }} />)}
              </Space>
            </Image.PreviewGroup>
          )}
          {r.partnerReply && <div style={{ color: '#888', fontSize: 12 }}>Đối tác trả lời: {r.partnerReply}</div>}
          {r.status === 'hidden' && <div style={{ color: '#cf1322', fontSize: 12 }}>Lý do ẩn: {r.hiddenReason || '—'}</div>}
          {r.resubmittedAt && <Tag color="orange" style={{ marginTop: 4 }}>Người viết đã sửa lại, chờ xem</Tag>}
        </div>
      ),
    },
    { title: 'Xác thực', dataIndex: 'verified', width: 90, render: v => v ? <Tag color="green">Đã học</Tag> : <Tag>Chưa</Tag> },
    { title: 'Ngày', dataIndex: 'createdAt', width: 100, render: v => fmtDate(v) },
    {
      title: 'Hiện', dataIndex: 'status', width: 70,
      render: (v, r) => (
        <Switch size="small" checked={v !== 'hidden'} loading={setStatus.isPending}
          onChange={checked => checked ? setStatus.mutate({ review: r, status: 'published' }) : setHiding(r)} />
      ),
    },
    {
      width: 48,
      render: (_, r) => (
        <Popconfirm title="Xóa đánh giá này?" description="anyPoint thưởng cho đánh giá sẽ bị thu hồi." okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}
          onConfirm={() => remove.mutate(r)}>
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ]

  return (
    <div>
      {allCourses && (
        <Space wrap style={{ marginBottom: 16 }}>
          <Select value={filter} onChange={v => { setFilter(v); setPage(1) }} options={FILTERS} style={{ width: 260 }} />
          <Input.Search placeholder="Tìm khóa học, người viết, nội dung" allowClear style={{ width: 280 }}
            onSearch={v => { setKeyword(v); setPage(1) }} />
          {data?.total != null && <Typography.Text type="secondary">{data.total.toLocaleString('vi-VN')} đánh giá</Typography.Text>}
        </Space>
      )}
      <Table size="small" rowKey="id" loading={isLoading} dataSource={data?.content ?? []} columns={columns}
        pagination={allCourses ? { current: page, pageSize: 20, total: data?.total ?? 0, showSizeChanger: false, onChange: setPage } : false} />

      <Modal open={Boolean(hiding)} title="Ẩn đánh giá" okText="Ẩn đánh giá" cancelText="Hủy" okButtonProps={{ disabled: !reason.trim(), loading: setStatus.isPending }}
        onCancel={() => { setHiding(null); setReason('') }}
        onOk={() => setStatus.mutate({ review: hiding, status: 'hidden', reason })}>
        <Typography.Paragraph type="secondary">
          Lý do được gửi cho {hiding?.userName || 'người viết'} và hiện ngay tại đánh giá của họ để họ chỉnh sửa. Họ sửa xong bạn sẽ nhận thông báo để mở lại.
        </Typography.Paragraph>
        <Input.TextArea rows={3} maxLength={500} showCount style={{ marginBottom: 24 }} value={reason} onChange={e => setReason(e.target.value)}
          placeholder="Ví dụ: Nội dung chưa nói về khóa học, vui lòng mô tả trải nghiệm thực tế" />
      </Modal>
    </div>
  )
}
