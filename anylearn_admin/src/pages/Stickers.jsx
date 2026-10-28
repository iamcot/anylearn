import { Alert, Avatar, Button, Card, Descriptions, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Switch, Table, Tabs, Tag, Typography, message } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'

const RARITY = { common: ['Thường', 'default'], rare: ['Hiếm', 'blue'], epic: ['Siêu hiếm', 'purple'] }
const RARITY_OPTIONS = Object.entries(RARITY).map(([value, [label]]) => ({ value, label }))

const SETTING_FIELDS = [
  ['checkin_chance', 'Tỉ lệ nhận sticker khi điểm danh ngày thường (%)', 'Ngày 7 của chuỗi luôn có sticker nếu bật công tắc ở trên.'],
  ['welcome_rare_chance', 'Gói quà người được mời: tỉ lệ có sticker hiếm (%)', 'Gói không bao giờ có sticker siêu hiếm.'],
  ['welcome_lock_days', 'Số ngày khóa đổi sticker nhận từ gói quà', 'Sticker này chưa đổi được và chưa tính vào đủ bộ trong thời gian khóa.'],
  ['trade_window_days', 'Hai người đổi lại với nhau sau (ngày)', 'Mỗi cặp chỉ đổi 1 lần trong khoảng này.'],
  ['trade_week_limit', 'Số lần đổi tối đa mỗi tuần', null],
  ['trade_month_partners', 'Số người khác nhau được đổi mỗi tháng', null],
  ['offer_hours', 'Lời mời đổi hết hạn sau (giờ)', null],
  ['eligible_age_days', 'Tài khoản đủ điều kiện: tuổi tối thiểu (ngày)', 'Chỉ tài khoản đủ điều kiện mới được đổi, nhận đợt 2 của gói quà và tính là lượt mời.'],
  ['eligible_checkins', 'Tài khoản đủ điều kiện: số ngày điểm danh tối thiểu', null],
  ['hold_score', 'Điểm rủi ro từ đó gói quà chờ duyệt', 'Điểm cao khi nhiều tài khoản dùng chung thiết bị hoặc IP hoặc cùng người mời.'],
  ['invite_month_cap', 'Người mời nhận thưởng tối đa mỗi tháng (lượt)', null],
  ['set_reward_points', 'Thưởng đủ bộ mặc định (Leo Xu, 0 = tắt)', 'Dùng cho bộ sưu tập không đặt thưởng riêng. Trao một lần cho mỗi người và mỗi bộ, chỉ tài khoản đủ điều kiện.'],
]

function useStickers() {
  return useQuery({ queryKey: ['admin-stickers'], queryFn: () => client.get('/admin/stickers').then(r => r.data?.data ?? null) })
}

function Thumb({ item }) {
  if (item.image) return <Avatar shape="square" size={44} src={item.image} />
  return <Avatar shape="square" size={44} style={{ background: '#f1f3f5', fontSize: 26 }}>{item.emoji || '?'}</Avatar>
}

function StickerForm({ item, collections, onClose }) {
  const qc = useQueryClient()
  const [form] = Form.useForm()
  const [file, setFile] = useState(null)
  const save = useMutation({
    mutationFn: values => {
      const body = new FormData()
      Object.entries(values).forEach(([k, v]) => { if (v !== undefined && v !== null) body.append(k, v) })
      if (file) body.append('image', file)
      const config = { headers: { 'Content-Type': 'multipart/form-data' } }
      return (item?.id ? client.put(`/admin/stickers/${item.id}`, body, config) : client.post('/admin/stickers', body, config)).then(r => r.data)
    },
    onSuccess: res => {
      if (res.resultCode !== 1) return message.error(res.message)
      message.success('Đã lưu sticker')
      qc.invalidateQueries({ queryKey: ['admin-stickers'] })
      onClose()
    },
  })
  return (
    <Modal open title={item?.id ? 'Sửa sticker' : 'Thêm sticker'} onCancel={onClose} okText="Lưu" cancelText="Hủy"
      confirmLoading={save.isPending} onOk={() => form.validateFields().then(values => save.mutate(values))}>
      <Form form={form} layout="vertical" initialValues={item?.id ? item : { rarity: 'common', dropWeight: 10, active: true, sortOrder: 0, collectionId: collections[0]?.id, ...item }}>
        <Form.Item name="collectionId" label="Bộ sưu tập" rules={[{ required: true, message: 'Chọn bộ sưu tập' }]}>
          <Select options={collections.map(c => ({ value: c.id, label: c.name }))} />
        </Form.Item>
        <Form.Item name="name" label="Tên" rules={[{ required: true }]}><Input maxLength={80} /></Form.Item>
        <Form.Item name="description" label="Nội dung ngắn"><Input maxLength={255} /></Form.Item>
        <Form.Item label="Hình (PNG vuông, nền trong)" extra="Không có hình thì hiện emoji bên dưới.">
          <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] ?? null)} />
          {item?.image && !file && <div style={{ marginTop: 8 }}><Thumb item={item} /></div>}
        </Form.Item>
        <Form.Item name="emoji" label="Emoji thay hình"><Input maxLength={16} style={{ width: 120 }} /></Form.Item>
        <Space size="large" align="start">
          <Form.Item name="rarity" label="Độ hiếm"><Select options={RARITY_OPTIONS} style={{ width: 140 }} /></Form.Item>
          <Form.Item name="dropWeight" label="Tỉ lệ rơi (trọng số)" extra="Càng lớn càng dễ rơi. 0 = không rơi."><InputNumber min={0} max={1000} /></Form.Item>
          <Form.Item name="sortOrder" label="Thứ tự"><InputNumber /></Form.Item>
        </Space>
        <Form.Item name="active" label="Đang dùng" valuePropName="checked"><Switch /></Form.Item>
      </Form>
    </Modal>
  )
}

function CollectionForm({ item, defaultReward, onClose }) {
  const qc = useQueryClient()
  const [form] = Form.useForm()
  const [file, setFile] = useState(null)
  const save = useMutation({
    mutationFn: values => {
      const body = new FormData()
      Object.entries(values).forEach(([k, v]) => { if (v !== undefined && v !== null) body.append(k, v) })
      if (file) body.append('image', file)
      const config = { headers: { 'Content-Type': 'multipart/form-data' } }
      return (item?.id ? client.put(`/admin/stickers/collections/${item.id}`, body, config) : client.post('/admin/stickers/collections', body, config)).then(r => r.data)
    },
    onSuccess: res => {
      if (res.resultCode !== 1) return message.error(res.message)
      message.success('Đã lưu bộ sưu tập')
      qc.invalidateQueries({ queryKey: ['admin-stickers'] })
      onClose()
    },
  })
  return (
    <Modal open title={item?.id ? 'Sửa bộ sưu tập' : 'Thêm bộ sưu tập'} onCancel={onClose} okText="Lưu" cancelText="Hủy"
      confirmLoading={save.isPending} onOk={() => form.validateFields().then(values => save.mutate(values))}>
      <Form form={form} layout="vertical" initialValues={item?.id ? { ...item, rewardCoins: item.rewardCoins ?? undefined } : { active: true, sortOrder: 0 }}>
        <Form.Item name="name" label="Tên bộ" rules={[{ required: true }]}><Input maxLength={80} /></Form.Item>
        <Form.Item name="description" label="Mô tả ngắn"><Input maxLength={255} /></Form.Item>
        <Form.Item label="Hình đại diện (PNG vuông)" extra="Không có hình thì hiện emoji bên dưới.">
          <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] ?? null)} />
          {item?.image && !file && <div style={{ marginTop: 8 }}><Thumb item={item} /></div>}
        </Form.Item>
        <Form.Item name="emoji" label="Emoji thay hình"><Input maxLength={16} style={{ width: 120 }} /></Form.Item>
        <Space size="large" align="start">
          <Form.Item name="rewardCoins" label="Thưởng đủ bộ (Leo Xu)" extra={`Để trống = dùng mặc định (${defaultReward}). 0 = không thưởng.`}><InputNumber min={0} max={5000} /></Form.Item>
          <Form.Item name="sortOrder" label="Thứ tự"><InputNumber /></Form.Item>
        </Space>
        <Form.Item name="active" label="Đang mở" valuePropName="checked" extra="Tắt bộ thì sticker của bộ không rơi nữa và không tính vào thưởng; ai đã có vẫn giữ."><Switch /></Form.Item>
      </Form>
    </Modal>
  )
}

function CollectionsCard({ data }) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(null)
  const remove = useMutation({
    mutationFn: id => client.delete(`/admin/stickers/collections/${id}`).then(r => r.data),
    onSuccess: res => {
      if (res.resultCode !== 1) return message.error(res.message)
      message.success('Đã xóa bộ sưu tập')
      qc.invalidateQueries({ queryKey: ['admin-stickers'] })
    },
  })
  const collections = data?.collections ?? []
  const columns = [
    { title: '', width: 60, render: (_, item) => <Thumb item={item} /> },
    { title: 'Bộ sưu tập', dataIndex: 'name', render: (v, item) => <div><b>{v}</b><div style={{ fontSize: 12, color: '#888' }}>{item.description}</div></div> },
    { title: 'Sticker', width: 100, align: 'right', render: (_, c) => `${c.activeStickers}/${c.stickers}` },
    { title: 'Đã đủ bộ', dataIndex: 'completed', width: 90, align: 'right' },
    { title: 'Thưởng đủ bộ', width: 130, render: (_, c) => (c.rewardCoins == null ? `Mặc định (${data?.defaultRewardCoins ?? 0})` : c.rewardCoins) },
    { title: 'Trạng thái', dataIndex: 'active', width: 100, render: a => (a ? <Tag color="green">Đang mở</Tag> : <Tag>Tắt</Tag>) },
    { title: '', width: 130, render: (_, c) => (
      <Space>
        <Button size="small" onClick={() => setEditing(c)}>Sửa</Button>
        <Popconfirm title="Xóa bộ sưu tập này?" description="Chỉ xóa được bộ không còn sticker." okText="Xóa" cancelText="Hủy" onConfirm={() => remove.mutate(c.id)}>
          <Button size="small" danger>Xóa</Button>
        </Popconfirm>
      </Space>
    ) },
  ]
  return (
    <Card size="small" title="Bộ sưu tập" style={{ marginBottom: 16 }} extra={<Button type="primary" size="small" onClick={() => setEditing({})}>+ Thêm bộ</Button>}>
      <Table rowKey="id" size="small" columns={columns} dataSource={collections} pagination={false} />
      {editing && <CollectionForm item={editing} defaultReward={data?.defaultRewardCoins ?? 0} onClose={() => setEditing(null)} />}
    </Card>
  )
}

function SetTab() {
  const { data, isLoading } = useStickers()
  const [editing, setEditing] = useState(null)
  const [collectionId, setCollectionId] = useState(null)
  const collections = data?.collections ?? []
  const allItems = data?.items ?? []
  const items = collectionId ? allItems.filter(i => i.collectionId === collectionId) : allItems
  const collectionName = id => collections.find(c => c.id === id)?.name ?? ''
  const totalWeight = allItems.filter(i => i.active && collections.find(c => c.id === i.collectionId)?.active).reduce((s, i) => s + i.dropWeight, 0)
  const columns = [
    { title: '', width: 60, render: (_, item) => <Thumb item={item} /> },
    { title: 'Tên', dataIndex: 'name', render: (v, item) => <div><b>{v}</b><div style={{ fontSize: 12, color: '#888' }}>{item.description}</div></div> },
    { title: 'Bộ', dataIndex: 'collectionId', width: 140, render: id => collectionName(id) },
    { title: 'Độ hiếm', dataIndex: 'rarity', width: 110, render: r => <Tag color={RARITY[r]?.[1]}>{RARITY[r]?.[0] ?? r}</Tag> },
    { title: 'Tỉ lệ rơi', dataIndex: 'dropWeight', width: 110, render: (w, item) => (item.active && totalWeight ? `${((w / totalWeight) * 100).toFixed(1)}%` : '–') },
    { title: 'Người có', dataIndex: 'owners', width: 90, align: 'right' },
    { title: 'Số bản', dataIndex: 'copies', width: 90, align: 'right' },
    { title: 'Trạng thái', dataIndex: 'active', width: 100, render: a => (a ? <Tag color="green">Đang dùng</Tag> : <Tag>Tắt</Tag>) },
    { title: '', width: 80, render: (_, item) => <Button size="small" onClick={() => setEditing(item)}>Sửa</Button> },
  ]
  return (
    <>
      <CollectionsCard data={data} />
      <Space style={{ marginBottom: 12 }} wrap>
        <Select allowClear placeholder="Mọi bộ sưu tập" style={{ width: 220 }} value={collectionId} onChange={v => setCollectionId(v ?? null)} options={collections.map(c => ({ value: c.id, label: c.name }))} />
        <Button type="primary" onClick={() => setEditing({ collectionId: collectionId ?? collections[0]?.id })}>+ Thêm sticker</Button>
        <Tag>{data?.playersWithStickers ?? 0} người đang sưu tầm</Tag>
        <Tag>Hôm nay: {data?.grantsToday ?? 0} sticker được phát, {data?.tradesToday ?? 0} lượt đổi</Tag>
      </Space>
      <Table rowKey="id" loading={isLoading} columns={columns} dataSource={items} pagination={false} />
      {editing && <StickerForm item={editing} collections={collections} onClose={() => setEditing(null)} />}
    </>
  )
}

function MembersTab() {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState(null)
  const { data: found, isFetching } = useQuery({
    queryKey: ['admin-sticker-members', q],
    queryFn: () => client.get('/admin/stickers/members', { params: { q } }).then(r => r.data?.data ?? []),
  })
  const { data: detail } = useQuery({
    queryKey: ['admin-sticker-member', picked],
    enabled: Boolean(picked),
    queryFn: () => client.get(`/admin/stickers/members/${picked}`).then(r => r.data?.data ?? null),
  })
  const { data: set } = useStickers()
  const act = useMutation({
    mutationFn: ({ path, body }) => client.post(path, body).then(r => r.data),
    onSuccess: res => {
      if (res.resultCode !== 1) return message.error(res.message)
      qc.invalidateQueries({ queryKey: ['admin-sticker-member', picked] })
      qc.invalidateQueries({ queryKey: ['admin-stickers'] })
      qc.invalidateQueries({ queryKey: ['admin-sticker-review'] })
    },
  })
  const [giveId, setGiveId] = useState(null)
  return (
    <Space align="start" size="large" wrap style={{ width: '100%' }}>
      <Card style={{ width: 340 }} size="small" title="Tìm thành viên có sticker">
        <Input.Search placeholder="Tên hoặc số điện thoại" allowClear onSearch={setQ} loading={isFetching} />
        <Table size="small" rowKey="id" style={{ marginTop: 8 }} pagination={false} dataSource={found ?? []} showHeader={false}
          onRow={row => ({ onClick: () => setPicked(row.id), style: { cursor: 'pointer', background: row.id === picked ? '#f1f8f4' : undefined } })}
          columns={[{ render: (_, r) => <div><b>{r.name}</b> <span style={{ color: '#888' }}>{r.phone}</span></div> }, { width: 90, align: 'right', render: (_, r) => `${r.kinds} loại / ${r.copies}` }]} />
      </Card>
      {detail && (
        <Card style={{ flex: 1, minWidth: 360 }} size="small" title={`${detail.user?.name ?? ''} ${detail.user?.phone ?? ''}`}>
          <Descriptions size="small" column={2} style={{ marginBottom: 8 }}>
            <Descriptions.Item label="Đủ điều kiện">{detail.eligible ? 'Có' : 'Chưa'}</Descriptions.Item>
            <Descriptions.Item label="Đã sưu tầm">{detail.owned}/{detail.total}</Descriptions.Item>
            <Descriptions.Item label="Rủi ro" span={2}>{detail.risk ? <>{detail.risk.score} điểm, {detail.risk.status}. {detail.risk.reasons}</> : 'Không có tín hiệu'}</Descriptions.Item>
          </Descriptions>
          <Space wrap style={{ marginBottom: 8 }}>
            <Button size="small" danger onClick={() => act.mutate({ path: `/admin/stickers/risk/${picked}`, body: { status: 'blocked' } })}>Khóa đổi và giữ thưởng</Button>
            <Button size="small" onClick={() => act.mutate({ path: `/admin/stickers/risk/${picked}`, body: { status: 'cleared' } })}>Bỏ qua cảnh báo</Button>
            <Button size="small" onClick={() => act.mutate({ path: `/admin/stickers/risk/${picked}`, body: { status: 'open' } })}>Về tự động</Button>
          </Space>
          <Table size="small" rowKey="id" pagination={false} dataSource={(detail.items ?? []).filter(i => i.qty > 0)}
            columns={[
              { width: 56, render: (_, i) => <Thumb item={i} /> },
              { title: 'Sticker', dataIndex: 'name' },
              { title: 'Độ hiếm', dataIndex: 'rarity', width: 100, render: r => <Tag color={RARITY[r]?.[1]}>{RARITY[r]?.[0]}</Tag> },
              { title: 'Số bản', dataIndex: 'qty', width: 80, align: 'right' },
              { width: 90, render: (_, i) => <Popconfirm title="Thu hồi 1 bản?" onConfirm={() => act.mutate({ path: '/admin/stickers/revoke', body: { userId: picked, stickerId: i.id } })}><Button size="small" danger>Thu hồi</Button></Popconfirm> },
            ]} />
          <Space style={{ marginTop: 12 }}>
            <Select placeholder="Tặng sticker" style={{ width: 220 }} value={giveId} onChange={setGiveId}
              options={(set?.items ?? []).map(i => ({ value: i.id, label: `${i.emoji ?? ''} ${i.name}` }))} />
            <Button type="primary" disabled={!giveId} onClick={() => act.mutate({ path: '/admin/stickers/grant', body: { userId: picked, stickerId: giveId } })}>Tặng</Button>
          </Space>
        </Card>
      )}
    </Space>
  )
}

function TradesTab() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const { data, isLoading } = useQuery({
    queryKey: ['admin-sticker-trades', page],
    queryFn: () => client.get('/admin/stickers/trades', { params: { page } }).then(r => r.data?.data ?? null),
  })
  const cancel = useMutation({
    mutationFn: id => client.post(`/admin/stickers/trades/${id}/cancel`).then(r => r.data),
    onSuccess: res => {
      if (res.resultCode !== 1) return message.error(res.message)
      message.success('Đã hủy giao dịch, hai bên nhận lại sticker')
      qc.invalidateQueries({ queryKey: ['admin-sticker-trades'] })
    },
  })
  return (
    <>
      {(data?.busiestPairs ?? []).length > 0 && (
        <Alert type="warning" showIcon style={{ marginBottom: 12 }} message="Cặp đổi nhiều lần (đáng xem)"
          description={data.busiestPairs.map(p => `${p.aName} ↔ ${p.bName}: ${p.trades} lần`).join(' · ')} />
      )}
      <Table rowKey="id" loading={isLoading} dataSource={data?.items ?? []}
        pagination={{ current: page, pageSize: 30, total: data?.total ?? 0, onChange: setPage, showSizeChanger: false }}
        columns={[
          { title: 'Lúc', dataIndex: 'createdAt', width: 150, render: v => v?.replace('T', ' ').slice(0, 16) },
          { title: 'Người thứ nhất', render: (_, t) => `${t.aName ?? t.aUser} ${t.aPhone ?? ''}` },
          { title: 'Đưa', dataIndex: 'aSticker' },
          { title: 'Người thứ hai', render: (_, t) => `${t.bName ?? t.bUser} ${t.bPhone ?? ''}` },
          { title: 'Đưa', dataIndex: 'bSticker' },
          { title: '', width: 110, render: (_, t) => (t.status === 'done'
            ? <Popconfirm title="Hủy giao dịch và trả lại sticker cho hai bên?" onConfirm={() => cancel.mutate(t.id)}><Button size="small" danger>Hủy</Button></Popconfirm>
            : <Tag>Đã hủy</Tag>) },
        ]} />
    </>
  )
}

function ReviewTab() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['admin-sticker-review'],
    queryFn: () => client.get('/admin/stickers/review').then(r => r.data?.data ?? null),
  })
  const act = useMutation({
    mutationFn: ({ path, body }) => client.post(path, body ?? {}).then(r => r.data),
    onSuccess: res => {
      if (res.resultCode !== 1) return message.error(res.message)
      qc.invalidateQueries({ queryKey: ['admin-sticker-review'] })
      qc.invalidateQueries({ queryKey: ['admin-badges'] })
    },
  })
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card size="small" title="Gói quà chờ duyệt (đợt 2 và thưởng người mời đang giữ)">
        <Table rowKey="userId" loading={isLoading} pagination={false} dataSource={data?.welcome ?? []} locale={{ emptyText: 'Không có gói quà nào chờ duyệt' }}
          columns={[
            { title: 'Người nhận', render: (_, r) => `${r.userName ?? r.userId} ${r.userPhone ?? ''}` },
            { title: 'Người mời', render: (_, r) => r.inviterName ?? r.inviterId },
            { title: 'Từ', dataIndex: 'createdAt', width: 150, render: v => String(v).replace('T', ' ').slice(0, 16) },
            { width: 170, render: (_, r) => (
              <Space>
                <Button size="small" type="primary" onClick={() => act.mutate({ path: `/admin/stickers/review/${r.userId}/approve` })}>Duyệt</Button>
                <Popconfirm title="Hủy gói quà đợt 2 của người này?" onConfirm={() => act.mutate({ path: `/admin/stickers/review/${r.userId}/reject` })}><Button size="small" danger>Hủy</Button></Popconfirm>
              </Space>) },
          ]} />
      </Card>
      <Card size="small" title="Tài khoản bị gắn cờ rủi ro">
        <Table rowKey="userId" pagination={false} dataSource={data?.flagged ?? []} locale={{ emptyText: 'Chưa có tài khoản nào bị gắn cờ' }}
          columns={[
            { title: 'Tài khoản', render: (_, r) => `${r.userName ?? r.userId} ${r.userPhone ?? ''}` },
            { title: 'Điểm', dataIndex: 'score', width: 70, align: 'right' },
            { title: 'Lý do', dataIndex: 'reasons' },
            { title: 'Trạng thái', dataIndex: 'status', width: 110, render: s => ({ open: <Tag color="gold">Cần xem</Tag>, cleared: <Tag color="green">Đã bỏ qua</Tag>, blocked: <Tag color="red">Đã khóa</Tag> }[s] ?? s) },
            { width: 230, render: (_, r) => (
              <Space>
                <Button size="small" danger onClick={() => act.mutate({ path: `/admin/stickers/risk/${r.userId}`, body: { status: 'blocked' } })}>Khóa</Button>
                <Button size="small" onClick={() => act.mutate({ path: `/admin/stickers/risk/${r.userId}`, body: { status: 'cleared' } })}>Bỏ qua</Button>
              </Space>) },
          ]} />
      </Card>
    </Space>
  )
}

function SettingsTab() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['admin-sticker-settings'],
    queryFn: () => client.get('/admin/stickers/settings').then(r => r.data?.data ?? null),
  })
  const [form] = Form.useForm()
  useEffect(() => { if (data) form.setFieldsValue(data) }, [data, form])
  const save = useMutation({
    mutationFn: values => client.put('/admin/stickers/settings', values).then(r => r.data),
    onSuccess: res => {
      if (res.resultCode !== 1) return message.error(res.message)
      message.success('Đã lưu cấu hình sticker')
      qc.invalidateQueries({ queryKey: ['admin-sticker-settings'] })
    },
  })
  return (
    <Card loading={isLoading}>
      <Form form={form} layout="vertical" onFinish={values => save.mutate(values)} style={{ maxWidth: 560 }}>
        <Form.Item name="enabled" label="Bật game sticker" valuePropName="checked"><Switch /></Form.Item>
        <Form.Item name="day7Sticker" label="Quà ngày 7 của chuỗi điểm danh luôn kèm 1 sticker" valuePropName="checked"><Switch /></Form.Item>
        {SETTING_FIELDS.map(([key, label, help]) => (
          <Form.Item key={key} name={key} label={label} extra={help}><InputNumber style={{ width: 160 }} /></Form.Item>
        ))}
        <Button type="primary" htmlType="submit" loading={save.isPending}>Lưu</Button>
      </Form>
    </Card>
  )
}

export default function Stickers() {
  const navigate = useNavigate()
  return (
    <div style={{ padding: 24 }}>
      <Button type="link" icon={<ArrowLeftOutlined />} style={{ padding: 0, marginBottom: 8 }} onClick={() => navigate('/fun-events')}>Vui học</Button>
      <Typography.Title level={4} style={{ marginTop: 0 }}>Sticker</Typography.Title>
      <Typography.Paragraph type="secondary">
        Bộ sticker để sưu tầm: rơi từ quà điểm danh và gói quà chào mừng, đổi cùng độ hiếm giữa bạn bè, đủ bộ nhận thưởng tiền Vui học (Leo Xu).
      </Typography.Paragraph>
      <Tabs items={[
        { key: 'set', label: 'Bộ sticker', children: <SetTab /> },
        { key: 'members', label: 'Thành viên', children: <MembersTab /> },
        { key: 'trades', label: 'Giao dịch đổi', children: <TradesTab /> },
        { key: 'review', label: 'Chờ duyệt & rủi ro', children: <ReviewTab /> },
        { key: 'settings', label: 'Cấu hình', children: <SettingsTab /> },
      ]} />
    </div>
  )
}
