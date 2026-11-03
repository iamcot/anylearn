import { Button, Card, Checkbox, Drawer, Empty, Form, Input, InputNumber, Modal, Radio, Select, Space, Switch, Table, Tabs, Tag, Typography, message } from 'antd'
import { CloseOutlined, EditOutlined, GiftOutlined, PlusOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import CollectionCoursePicker from '../components/CollectionCoursePicker'
import { fmtDateTime, fmtVND } from '../utils/format'

// Plan 20: voucher groups (how codes are made and what they allow), the events that hand them out,
// people's wallets and a small report. The server checks every voucher again at checkout.

const PLACES = [
  { value: 'home', label: 'Trang chủ' }, { value: 'search', label: 'Tìm kiếm' }, { value: 'pdp', label: 'Trang khóa học' },
  { value: 'partner', label: 'Trang đối tác' }, { value: 'fun', label: 'Vui học' }, { value: 'tier', label: 'Trang hạng thành viên / ví' },
]
const SOURCE_LABELS = { event: 'Sự kiện', collect: 'Tự lưu', shop: 'Đổi Leo Xu', admin: 'Admin tặng', code: 'Nhập mã' }
const STATE_LABELS = { active: <Tag color="green">Còn dùng</Tag>, used: <Tag color="blue">Đã dùng</Tag>, expired: <Tag>Hết hạn</Tag> }

const ok = (res) => { if (res?.resultCode !== 1) throw new Error(res?.message || 'Lỗi'); return res.data }

function usePartners() {
  return useQuery({
    queryKey: ['admin-partners'],
    queryFn: () => client.get('/admin/partners').then(r => r.data?.data ?? []),
    staleTime: 5 * 60 * 1000,
  })
}

function PartnerSelect({ value, onChange, placeholder = 'Mọi đối tác' }) {
  const { data } = usePartners()
  return (
    <Select allowClear showSearch optionFilterProp="label" placeholder={placeholder} style={{ width: '100%' }}
      value={value ?? undefined} onChange={v => onChange(v ?? null)}
      options={(data ?? []).map(p => ({ value: p.id, label: p.name || p.phone }))} />
  )
}

// ── Groups ─────────────────────────────────────────────────────────────

function GroupDrawer({ group, onClose }) {
  const qc = useQueryClient()
  const [form] = Form.useForm()
  const [courses, setCourses] = useState(group?.items ?? [])
  const generate = Form.useWatch('generateType', form)
  const save = useMutation({
    mutationFn: (body) => (group?.id
      ? client.put(`/admin/vouchers/groups/${group.id}`, body)
      : client.post('/admin/vouchers/groups', body)).then(r => ok(r.data)),
    onSuccess: () => { message.success('Đã lưu'); qc.invalidateQueries({ queryKey: ['admin-voucher-groups'] }); onClose() },
    onError: (e) => message.error(e.message),
  })
  const initial = group ? {
    title: group.title, generateType: group.generate_type === 'manual' ? 'manual' : 'auto', prefix: group.prefix, length: group.length,
    qtt: group.qtt, value: Number(group.value) || 0, ruleMin: group.rule_min, status: group.status === 1, collectible: group.collectible === 1,
    walletDays: group.wallet_days, partnerId: group.partner_id, showOn: group.show_on ? String(group.show_on).split(',') : [],
  } : { generateType: 'auto', length: 6, qtt: 0, status: true, collectible: false, showOn: [] }

  const submit = (v) => save.mutate({ ...v, type: 'money', itemIds: courses.map(c => c.id) })

  return (
    <Drawer open width={760} title={group?.id ? `Sửa bộ voucher #${group.id}` : 'Tạo bộ voucher'} onClose={onClose}
      extra={<Button type="primary" loading={save.isPending} onClick={() => form.submit()}>Lưu</Button>}>
      <Form form={form} layout="vertical" initialValues={initial} onFinish={submit}>
        <Form.Item name="title" label="Tên hiển thị cho khách" rules={[{ required: true, message: 'Nhập tên' }]}
          extra="Ví dụ: Giảm 50.000đ cho đơn đầu tiên"><Input maxLength={150} /></Form.Item>
        <Space size={16} wrap align="start">
          <Form.Item name="value" label="Số tiền giảm (đ)" rules={[{ required: true }]}>
            <InputNumber min={1000} step={10000} style={{ width: 160 }} formatter={v => fmtVND(v)} parser={v => String(v).replace(/\D/g, '')} />
          </Form.Item>
          <Form.Item name="ruleMin" label="Đơn tối thiểu (đ)" extra="Tính trên các khóa được áp dụng; trống = không cần">
            <InputNumber min={0} step={100000} style={{ width: 160 }} formatter={v => (v ? fmtVND(v) : '')} parser={v => String(v).replace(/\D/g, '')} />
          </Form.Item>
          <Form.Item name="walletDays" label="Hạn dùng sau khi nhận (ngày)" extra="Trống = theo hạn của mã">
            <InputNumber min={1} max={3650} style={{ width: 160 }} />
          </Form.Item>
        </Space>

        <Form.Item name="generateType" label="Cách tạo mã">
          <Radio.Group options={[
            { value: 'auto', label: 'Mã động: tiền tố + ký tự tự sinh, mỗi người một mã' },
            { value: 'manual', label: 'Mã tĩnh: mã cố định, thêm ở nút "Mã"' },
          ]} />
        </Form.Item>
        {generate !== 'manual' && (
          <Space size={16} wrap>
            <Form.Item name="prefix" label="Tiền tố" rules={[{ required: true, message: 'Nhập tiền tố' }]}><Input maxLength={10} style={{ width: 140 }} placeholder="CHAO" /></Form.Item>
            <Form.Item name="length" label="Số ký tự tự sinh"><InputNumber min={4} max={16} /></Form.Item>
            <Form.Item name="qtt" label="Tổng số mã tối đa" extra="0 = không giới hạn"><InputNumber min={0} /></Form.Item>
          </Space>
        )}

        <Typography.Title level={5}>Điều kiện áp dụng</Typography.Title>
        <Form.Item name="partnerId" label="Voucher của đối tác" extra="Chọn đối tác thì chỉ dùng cho khóa của đối tác đó, và voucher hiện trên trang của đối tác.">
          <PartnerSelect />
        </Form.Item>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
          Chỉ áp dụng cho các khóa dưới đây ({courses.length}). Không chọn khóa nào = mọi khóa (của đối tác nếu đã chọn đối tác).
        </Typography.Paragraph>
        {courses.length > 0 && (
          <Table size="small" rowKey="id" dataSource={courses} pagination={false} showHeader={false} style={{ marginBottom: 12 }}
            columns={[
              { key: 'title', render: (_, r) => (
                <Space>
                  {r.image ? <img src={r.image} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6 }} /> : <div style={{ width: 36, height: 36, background: '#f0f0f0', borderRadius: 6 }} />}
                  <span style={{ fontWeight: 500 }}>{r.title}</span>
                </Space>
              ) },
              { key: 'price', dataIndex: 'price', width: 100, align: 'right', render: fmtVND },
              { key: 'x', width: 48, render: (_, r) => <Button size="small" type="text" danger icon={<CloseOutlined />} onClick={() => setCourses(courses.filter(c => c.id !== r.id))} /> },
            ]} />
        )}
        <CollectionCoursePicker addedIds={courses.map(c => c.id)} onAdd={list => setCourses([...courses, ...list.filter(x => !courses.some(c => c.id === x.id))])} />

        <Typography.Title level={5} style={{ marginTop: 16 }}>Phát voucher</Typography.Title>
        <Space size={24} wrap>
          <Form.Item name="status" label="Đang bật" valuePropName="checked" extra="Tắt thì không phát và không dùng được nữa."><Switch /></Form.Item>
          <Form.Item name="collectible" label="Cho khách tự lưu" valuePropName="checked" extra='Hiện ở ô "Voucher cho bạn" để khách bấm Lưu (mỗi người 1 lần).'><Switch /></Form.Item>
        </Space>
        <Form.Item name="showOn" label="Hiện ở đâu (khi cho tự lưu)" extra="Không chọn = mọi nơi. Trang khóa học chỉ hiện voucher dùng được cho khóa đó.">
          <Checkbox.Group options={PLACES} />
        </Form.Item>
      </Form>
    </Drawer>
  )
}

function CodesDrawer({ group, onClose }) {
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const [count, setCount] = useState(10)
  const [fixed, setFixed] = useState({ code: '', uses: 100, expiredAt: '' })
  const { data, isFetching } = useQuery({
    queryKey: ['admin-voucher-codes', group.id, page],
    queryFn: () => client.get(`/admin/vouchers/groups/${group.id}/codes`, { params: { page } }).then(r => r.data?.data),
  })
  const add = useMutation({
    mutationFn: (body) => client.post(`/admin/vouchers/groups/${group.id}/codes`, body).then(r => ok(r.data)),
    onSuccess: () => { message.success('Đã thêm mã'); qc.invalidateQueries({ queryKey: ['admin-voucher-codes', group.id] }); qc.invalidateQueries({ queryKey: ['admin-voucher-groups'] }) },
    onError: (e) => message.error(e.message),
  })
  const manual = group.generate_type === 'manual'
  return (
    <Drawer open width={720} title={`Mã của "${group.title || group.prefix || group.id}"`} onClose={onClose}>
      {manual ? (
        <Space wrap style={{ marginBottom: 12 }}>
          <Input placeholder="Mã, ví dụ HOCVUI" value={fixed.code} onChange={e => setFixed({ ...fixed, code: e.target.value.toUpperCase() })} style={{ width: 160 }} />
          <InputNumber min={1} value={fixed.uses} onChange={v => setFixed({ ...fixed, uses: v })} addonAfter="lượt" style={{ width: 140 }} />
          <Input type="date" value={fixed.expiredAt} onChange={e => setFixed({ ...fixed, expiredAt: e.target.value })} style={{ width: 160 }} />
          <Button type="primary" icon={<PlusOutlined />} disabled={!fixed.code} loading={add.isPending} onClick={() => add.mutate(fixed)}>Thêm mã</Button>
        </Space>
      ) : (
        <Space wrap style={{ marginBottom: 12 }}>
          <Typography.Text type="secondary">Mã động được tạo tự động khi phát cho từng người. Tạo sẵn để in hoặc gửi tay:</Typography.Text>
          <InputNumber min={1} max={1000} value={count} onChange={setCount} />
          <Button icon={<PlusOutlined />} loading={add.isPending} onClick={() => add.mutate({ count })}>Tạo {count} mã</Button>
        </Space>
      )}
      <Table size="small" rowKey="id" loading={isFetching} dataSource={data?.items ?? []}
        pagination={{ current: page + 1, pageSize: data?.size ?? 50, total: data?.total ?? 0, onChange: p => setPage(p - 1), showSizeChanger: false }}
        columns={[
          { title: 'Mã', dataIndex: 'code', render: c => <Typography.Text copyable code>{c}</Typography.Text> },
          { title: 'Lượt', key: 'uses', width: 100, render: (_, r) => `${r.used}/${r.uses || 1}` },
          { title: 'Hạn', dataIndex: 'expired', width: 150, render: e => (e ? fmtDateTime(new Date(e * 1000).toISOString().replace('Z', '')) : '—') },
          { title: 'Người giữ (id)', dataIndex: 'holders', render: h => h || '—' },
          { title: '', dataIndex: 'status', width: 80, render: s => (s === 1 ? <Tag color="green">Còn</Tag> : <Tag>Hết</Tag>) },
        ]} />
    </Drawer>
  )
}

function GrantModal({ group, onClose }) {
  const [phones, setPhones] = useState('')
  const grant = useMutation({
    mutationFn: () => client.post(`/admin/vouchers/groups/${group.id}/grant`, { phones }).then(r => ok(r.data)),
    onSuccess: (d) => { message.success(`Đã tặng ${d.given}/${d.people} người${d.skipped?.length ? `, bỏ qua ${d.skipped.length} (đã có hoặc hết mã)` : ''}`); onClose() },
    onError: (e) => message.error(e.message),
  })
  return (
    <Modal open title={`Tặng "${group.title}" vào ví`} okText="Tặng" cancelText="Thôi" onCancel={onClose}
      confirmLoading={grant.isPending} okButtonProps={{ disabled: !phones.trim() }} onOk={() => grant.mutate()}>
      <Typography.Paragraph type="secondary">Mỗi người nhận 1 voucher của bộ này (người đã có thì bỏ qua). Nhập số điện thoại, cách nhau bằng dấu phẩy hoặc xuống dòng.</Typography.Paragraph>
      <Input.TextArea rows={5} value={phones} onChange={e => setPhones(e.target.value)} placeholder="0901234567, 0912345678" />
    </Modal>
  )
}

function GroupsTab() {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(null)
  const [codesOf, setCodesOf] = useState(null)
  const [grantOf, setGrantOf] = useState(null)
  const { data, isLoading } = useQuery({
    queryKey: ['admin-voucher-groups', q],
    queryFn: () => client.get('/admin/vouchers/groups', { params: { q: q || undefined } }).then(r => r.data?.data ?? []),
  })
  const toggle = useMutation({
    mutationFn: ({ id, on }) => client.put(`/admin/vouchers/groups/${id}/status`, { on }).then(r => ok(r.data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-voucher-groups'] }),
    onError: (e) => message.error(e.message),
  })
  return (
    <>
      <Space style={{ marginBottom: 12 }} wrap>
        <Input.Search placeholder="Tìm theo tên, tiền tố, mã" allowClear onSearch={setQ} style={{ width: 280 }} />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing({})}>Tạo bộ voucher</Button>
      </Space>
      <Table size="small" rowKey="id" loading={isLoading} dataSource={data ?? []} scroll={{ x: 1000 }}
        columns={[
          { title: 'Bộ voucher', key: 'title', render: (_, r) => (
            <div>
              <div style={{ fontWeight: 600 }}>{r.title || `#${r.id}`}</div>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {r.generate_type === 'manual' ? `Mã tĩnh ${r.first_code ?? ''}` : `Mã động ${r.prefix ?? ''}…`}
                {r.partner_name ? ` · Đối tác ${r.partner_name}` : ''}
                {r.itemIds?.length ? ` · ${r.itemIds.length} khóa` : ''}
              </Typography.Text>
            </div>
          ) },
          { title: 'Giảm', dataIndex: 'value', width: 100, align: 'right', render: v => fmtVND(v) },
          { title: 'Đơn từ', dataIndex: 'rule_min', width: 100, align: 'right', render: v => (v ? fmtVND(v) : '—') },
          { title: 'Tự lưu', dataIndex: 'collectible', width: 80, render: c => (c === 1 ? <Tag color="purple">Có</Tag> : '—') },
          { title: 'Mã / trong ví / đã dùng', key: 'n', width: 170, render: (_, r) => `${r.codes} / ${r.held} / ${r.used}` },
          { title: 'Đã giảm', dataIndex: 'discount', width: 110, align: 'right', render: v => fmtVND(v) },
          { title: 'Bật', dataIndex: 'status', width: 70, render: (s, r) => <Switch size="small" checked={s === 1} onChange={on => toggle.mutate({ id: r.id, on })} /> },
          { title: '', key: 'act', width: 230, render: (_, r) => (
            <Space size={4}>
              <Button size="small" icon={<EditOutlined />} onClick={() => setEditing(r)}>Sửa</Button>
              <Button size="small" icon={<UnorderedListOutlined />} onClick={() => setCodesOf(r)}>Mã</Button>
              <Button size="small" icon={<GiftOutlined />} onClick={() => setGrantOf(r)}>Tặng</Button>
            </Space>
          ) },
        ]} />
      {editing && <GroupDrawer group={editing.id ? editing : null} onClose={() => setEditing(null)} />}
      {codesOf && <CodesDrawer group={codesOf} onClose={() => setCodesOf(null)} />}
      {grantOf && <GrantModal group={grantOf} onClose={() => setGrantOf(null)} />}
    </>
  )
}

// ── Events ─────────────────────────────────────────────────────────────

function CourseSelect({ value, label, onChange }) {
  const [q, setQ] = useState('')
  const { data, isFetching } = useQuery({
    queryKey: ['voucher-course-select', q],
    queryFn: () => client.get('/admin/collections/course-search', { params: { q, page: 0, pageSize: 20 } }).then(r => r.data?.data?.items ?? []),
    enabled: q.length >= 2,
  })
  const options = (data ?? []).map(i => ({ value: i.id, label: i.title }))
  if (value && !options.some(o => o.value === value)) options.unshift({ value, label: label || `Khóa #${value}` })
  return (
    <Select allowClear showSearch filterOption={false} onSearch={setQ} loading={isFetching} placeholder="Gõ tên khóa để tìm; trống = khóa bất kỳ"
      value={value || undefined} onChange={v => onChange(v ?? 0)} options={options} style={{ width: '100%' }}
      notFoundContent={q.length < 2 ? 'Gõ ít nhất 2 chữ' : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />} />
  )
}

function EventDrawer({ event, types, groups, onClose }) {
  const qc = useQueryClient()
  const [form] = Form.useForm()
  const type = Form.useWatch('type', form)
  const save = useMutation({
    mutationFn: (body) => (event?.id
      ? client.put(`/admin/vouchers/events/${event.id}`, body)
      : client.post('/admin/vouchers/events', body)).then(r => ok(r.data)),
    onSuccess: () => { message.success('Đã lưu'); qc.invalidateQueries({ queryKey: ['admin-voucher-events'] }); onClose() },
    onError: (e) => message.error(e.message),
  })
  const initial = event ? {
    type: event.type, title: event.title, trigger: event.trigger, partnerId: event.ref_user_id, qtt: event.qtt, status: event.status === 1,
    notifTemplate: event.notif_template, groupIds: String(event.targets ?? '').split(',').map(Number).filter(Boolean),
  } : { qtt: 1, status: true, trigger: 0, groupIds: [] }
  const partnerEvent = type === 'follow_partner' || type === 'buy_partner'
  return (
    <Drawer open width={560} title={event?.id ? `Sửa sự kiện #${event.id}` : 'Tạo sự kiện phát voucher'} onClose={onClose}
      extra={<Button type="primary" loading={save.isPending} onClick={() => form.submit()}>Lưu</Button>}>
      <Form form={form} layout="vertical" initialValues={initial} onFinish={v => save.mutate(v)}>
        <Form.Item name="title" label="Tên sự kiện" rules={[{ required: true, message: 'Nhập tên' }]}><Input maxLength={150} /></Form.Item>
        <Form.Item name="type" label="Khi nào phát" rules={[{ required: true, message: 'Chọn loại' }]}>
          <Select options={(types ?? []).map(t => ({ value: t.key, label: t.label }))} />
        </Form.Item>
        {type === 'buy_item' && (
          <Form.Item name="trigger" label="Khóa học">
            <CourseSelect label={event?.item_title} />
          </Form.Item>
        )}
        {partnerEvent && (
          <Form.Item name="partnerId" label="Đối tác" rules={[{ required: true, message: 'Chọn đối tác' }]}>
            <PartnerSelect placeholder="Chọn đối tác" />
          </Form.Item>
        )}
        <Form.Item name="groupIds" label="Bộ voucher được phát" rules={[{ required: true, message: 'Chọn bộ voucher' }]}>
          <Select mode="multiple" optionFilterProp="label"
            options={(groups ?? []).map(g => ({ value: g.id, label: `${g.title || `#${g.id}`} (-${fmtVND(g.value)})${g.status === 1 ? '' : ' · đang tắt'}` }))} />
        </Form.Item>
        <Form.Item name="qtt" label="Số voucher mỗi bộ cho mỗi người"><InputNumber min={1} max={10} /></Form.Item>
        <Form.Item name="notifTemplate" label="Lời nhắn trong thông báo" extra="Trống = “Bạn nhận được voucher …”"><Input.TextArea rows={2} maxLength={300} /></Form.Item>
        <Form.Item name="status" label="Đang bật" valuePropName="checked"><Switch /></Form.Item>
        <Typography.Paragraph type="secondary">Mỗi người chỉ nhận một lần cho mỗi sự kiện. Voucher vào thẳng ví và người nhận có thông báo.</Typography.Paragraph>
      </Form>
    </Drawer>
  )
}

function EventsTab() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(null)
  const { data, isLoading } = useQuery({
    queryKey: ['admin-voucher-events'],
    queryFn: () => client.get('/admin/vouchers/events').then(r => r.data?.data ?? { items: [], types: [] }),
  })
  const { data: groups } = useQuery({
    queryKey: ['admin-voucher-groups', ''],
    queryFn: () => client.get('/admin/vouchers/groups').then(r => r.data?.data ?? []),
  })
  const typeLabel = Object.fromEntries((data?.types ?? []).map(t => [t.key, t.label]))
  const groupTitle = Object.fromEntries((groups ?? []).map(g => [g.id, g.title || `#${g.id}`]))
  const toggle = useMutation({
    mutationFn: (r) => client.put(`/admin/vouchers/events/${r.id}`, {
      type: r.type, title: r.title, trigger: r.trigger, partnerId: r.ref_user_id, qtt: r.qtt, notifTemplate: r.notif_template,
      groupIds: String(r.targets ?? '').split(',').map(Number).filter(Boolean), status: r.status !== 1,
    }).then(x => ok(x.data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-voucher-events'] }),
    onError: (e) => message.error(e.message),
  })
  return (
    <>
      <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 12 }} onClick={() => setEditing({})}>Tạo sự kiện</Button>
      <Table size="small" rowKey="id" loading={isLoading} dataSource={data?.items ?? []} scroll={{ x: 900 }}
        columns={[
          { title: 'Sự kiện', dataIndex: 'title', render: (t, r) => (
            <div>
              <div style={{ fontWeight: 600 }}>{t}</div>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {typeLabel[r.type] ?? r.type}{r.item_title ? ` · ${r.item_title}` : ''}{r.partner_name ? ` · ${r.partner_name}` : ''}
              </Typography.Text>
            </div>
          ) },
          { title: 'Phát bộ', dataIndex: 'targets', render: t => String(t ?? '').split(',').filter(Boolean).map(id => <Tag key={id}>{groupTitle[Number(id)] ?? `#${id}`}</Tag>) },
          { title: 'Đã phát', dataIndex: 'given', width: 90, align: 'right' },
          { title: 'Bật', dataIndex: 'status', width: 70, render: (s, r) => <Switch size="small" checked={s === 1} onChange={() => toggle.mutate(r)} /> },
          { title: '', key: 'act', width: 80, render: (_, r) => <Button size="small" icon={<EditOutlined />} onClick={() => setEditing(r)}>Sửa</Button> },
        ]} />
      {editing && <EventDrawer event={editing.id ? editing : null} types={data?.types} groups={groups} onClose={() => setEditing(null)} />}
    </>
  )
}

// ── Wallet lookup and report ───────────────────────────────────────────

function WalletTab() {
  const [who, setWho] = useState('')
  const { data, isFetching, error } = useQuery({
    queryKey: ['admin-voucher-wallet', who],
    queryFn: () => client.get('/admin/vouchers/wallet', { params: { who } }).then(r => ok(r.data)),
    enabled: !!who,
    retry: false,
  })
  return (
    <>
      <Input.Search placeholder="Số điện thoại hoặc id thành viên" allowClear enterButton="Xem ví" onSearch={v => setWho(v.trim())} style={{ maxWidth: 360, marginBottom: 12 }} />
      {error && <Typography.Paragraph type="danger">{error.message}</Typography.Paragraph>}
      <Table size="small" rowKey="id" loading={isFetching} dataSource={data ?? []}
        columns={[
          { title: 'Voucher', dataIndex: 'title' },
          { title: 'Mã', dataIndex: 'code', render: c => <Typography.Text code>{c}</Typography.Text> },
          { title: 'Giảm', dataIndex: 'value', align: 'right', render: fmtVND },
          { title: 'Nguồn', dataIndex: 'source', render: s => SOURCE_LABELS[s] ?? s },
          { title: 'Trạng thái', dataIndex: 'state', render: s => STATE_LABELS[s] ?? s },
          { title: 'Hạn', dataIndex: 'expiresAt', render: v => (v ? fmtDateTime(v) : '—') },
          { title: 'Đơn', dataIndex: 'usedOrderId', render: v => v ?? '—' },
        ]} />
    </>
  )
}

function ReportTab() {
  const [months, setMonths] = useState(6)
  const { data, isLoading } = useQuery({
    queryKey: ['admin-voucher-report', months],
    queryFn: () => client.get('/admin/vouchers/report', { params: { months } }).then(r => ok(r.data)),
  })
  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      <Select value={months} onChange={setMonths} style={{ width: 160 }} options={[1, 3, 6, 12].map(m => ({ value: m, label: `${m} tháng gần nhất` }))} />
      <Card size="small" title="Lượt dùng và tiền đã giảm theo tháng">
        <Table size="small" rowKey="month" loading={isLoading} pagination={false} dataSource={data?.byMonth ?? []}
          columns={[{ title: 'Tháng', dataIndex: 'month' }, { title: 'Lượt dùng', dataIndex: 'uses', align: 'right' }, { title: 'Đã giảm (đ)', dataIndex: 'discount', align: 'right', render: fmtVND }]} />
      </Card>
      <Card size="small" title="Voucher vào ví theo nguồn">
        <Table size="small" rowKey="source" loading={isLoading} pagination={false} dataSource={data?.bySource ?? []}
          columns={[{ title: 'Nguồn', dataIndex: 'source', render: s => SOURCE_LABELS[s] ?? s }, { title: 'Đã phát', dataIndex: 'issued', align: 'right' }, { title: 'Đã dùng', dataIndex: 'used', align: 'right' }]} />
      </Card>
      <Card size="small" title="Sự kiện phát nhiều nhất">
        <Table size="small" rowKey="id" loading={isLoading} pagination={false} dataSource={data?.byEvent ?? []}
          columns={[{ title: 'Sự kiện', dataIndex: 'title' }, { title: 'Đã phát', dataIndex: 'issued', align: 'right' }]} />
      </Card>
    </Space>
  )
}

export default function Vouchers() {
  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={3} style={{ marginTop: 0 }}>Voucher</Typography.Title>
      <Typography.Paragraph type="secondary">
        Bộ voucher quy định cách tạo mã, số tiền giảm và điều kiện (khóa, đối tác, đơn tối thiểu). Sự kiện phát voucher thẳng vào ví khách;
        bộ "cho khách tự lưu" hiện ở trang chủ, tìm kiếm, trang khóa, trang đối tác, Vui học và trang hạng thành viên. Khách chọn voucher trong ví hoặc nhập mã khi thanh toán.
      </Typography.Paragraph>
      <Tabs items={[
        { key: 'groups', label: 'Bộ voucher', children: <GroupsTab /> },
        { key: 'events', label: 'Sự kiện phát', children: <EventsTab /> },
        { key: 'wallet', label: 'Ví của khách', children: <WalletTab /> },
        { key: 'report', label: 'Báo cáo', children: <ReportTab /> },
      ]} />
    </div>
  )
}
