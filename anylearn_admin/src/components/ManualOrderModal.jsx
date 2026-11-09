import { Alert, App, Button, Card, Checkbox, Empty, Input, InputNumber, Modal, Radio, Select, Space, Table, Tag, Typography } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { useState } from 'react'
import client from '../api/client'
import CollectionCoursePicker from './CollectionCoursePicker'
import { fmtVND } from '../utils/format'

// "Nhập đơn tay": several orders in one save. A phone without an account shows name + email (a `member` account is created
// and gets the ZNS "Tài khoản đã được tạo"); "Người học là con" picks a child of the account or adds one. Each order is saved
// on its own: the saved ones leave the form, the refused ones stay with the reason. Keep PAYMENTS in step with ManualOrderRules.

const PAYMENTS = [
  { value: 'bank_transfer', label: 'Chuyển khoản' }, { value: 'cash', label: 'Tiền mặt' },
  { value: 'card', label: 'Thẻ' }, { value: 'other', label: 'Khác' },
]
const NEW_CHILD = 'new'

let seq = 0
const blankOrder = () => ({
  key: ++seq, phone: '', lookup: null, looking: false, name: '', email: '',
  courses: [], forChild: false, childPick: NEW_CHILD, childName: '', childDob: '', childDobYearOnly: false,
  payment: 'bank_transfer', paid: true, amount: null, note: '', error: null,
})

const scheduleLabel = (s) => {
  if (s.scheduleType === 'open') return `${s.title || 'Ca linh hoạt'} (linh hoạt)`
  if (s.scheduleType === 'event') return `${s.title || 'Sự kiện'} · ${s.eventDate ?? ''}`
  return [s.title || 'Lớp', s.weekdays, s.timeStart && `${s.timeStart}${s.timeEnd ? '-' + s.timeEnd : ''}`, s.dateStart && `từ ${s.dateStart}`]
    .filter(Boolean).join(' · ')
}

function OrderCard({ order, index, canRemove, onChange, onRemove }) {
  const [picking, setPicking] = useState(false)
  // onChange takes an updater, so answers that arrive late (lookup, classes) never undo what was typed meanwhile.
  const set = (patch) => onChange(o => ({ ...o, ...patch }))
  const lookup = order.lookup
  const exists = lookup?.exists
  const children = lookup?.children ?? []
  const total = order.courses.reduce((sum, c) => sum + (c.price ?? 0), 0)

  const runLookup = async () => {
    const phone = order.phone.trim()
    if (!phone) return set({ lookup: null })
    set({ looking: true })
    try {
      const res = await client.get('/admin/orders/manual/lookup', { params: { phone } })
      const data = res.data?.data ?? null
      const kids = data?.children ?? []
      onChange(o => ({ ...o, looking: false, lookup: data, childPick: kids.length ? kids[0].id : NEW_CHILD }))
    } catch {
      set({ looking: false })
    }
  }

  const addCourses = async (list) => {
    const fresh = list.filter(item => !order.courses.some(c => c.id === item.id))
      .map(item => ({ id: item.id, title: item.title, price: item.price, authorName: item.authorName, schedules: null, scheduleId: null, startDate: '' }))
    onChange(o => ({ ...o, courses: [...o.courses, ...fresh] }))
    setPicking(false)
    // Classes of each new course, for the "Lớp" column.
    const loaded = await Promise.all(fresh.map(c => client.get(`/admin/items/${c.id}/schedules`)
      .then(r => [c.id, r.data?.data ?? []]).catch(() => [c.id, []])))
    const byId = Object.fromEntries(loaded)
    onChange(o => ({
      ...o, courses: o.courses.map(c => byId[c.id] && c.schedules === null ? { ...c, schedules: byId[c.id], scheduleId: byId[c.id].length === 1 ? byId[c.id][0].id : c.scheduleId } : c),
    }))
  }
  const setCourse = (id, patch) => onChange(o => ({ ...o, courses: o.courses.map(c => (c.id === id ? { ...c, ...patch } : c)) }))

  const columns = [
    { title: 'Khóa học', key: 'title', render: (_, c) => (
      <div><div style={{ fontWeight: 500 }}>{c.title}</div><Typography.Text type="secondary" style={{ fontSize: 12 }}>{c.authorName}</Typography.Text></div>
    ) },
    { title: 'Giá', dataIndex: 'price', width: 110, align: 'right', render: fmtVND },
    { title: 'Lớp', key: 'schedule', width: 280, render: (_, c) => {
      if (c.schedules === null) return <Typography.Text type="secondary">Đang tải…</Typography.Text>
      if (!c.schedules.length) return <Typography.Text type="secondary">Không có lớp</Typography.Text>
      const picked = c.schedules.find(s => s.id === c.scheduleId)
      return (
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Select size="small" allowClear placeholder="Chọn lớp" style={{ width: '100%' }} value={c.scheduleId ?? undefined}
            onChange={v => setCourse(c.id, { scheduleId: v ?? null })}
            options={c.schedules.map(s => ({ value: s.id, label: scheduleLabel(s) }))} />
          {picked?.scheduleType === 'open' && (
            <Input size="small" type="date" value={c.startDate} onChange={e => setCourse(c.id, { startDate: e.target.value })}
              addonBefore="Khai giảng" />
          )}
        </Space>
      )
    } },
    { key: 'x', width: 40, render: (_, c) => <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => onChange(o => ({ ...o, courses: o.courses.filter(x => x.id !== c.id) }))} /> },
  ]

  return (
    <Card size="small" style={{ marginBottom: 12, borderColor: order.error ? '#ff7875' : undefined }}
      title={`Đơn ${index + 1}`}
      extra={canRemove && <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={onRemove}>Bỏ đơn này</Button>}>
      {order.error && <Alert type="error" showIcon message={order.error} style={{ marginBottom: 12 }} />}

      <Space wrap align="start" style={{ marginBottom: 8 }}>
        <Input style={{ width: 200 }} placeholder="Số điện thoại người mua" value={order.phone}
          onChange={e => set({ phone: e.target.value, lookup: null })} onBlur={runLookup} onPressEnter={runLookup} />
        {order.looking && <Typography.Text type="secondary">Đang kiểm tra…</Typography.Text>}
        {lookup && !lookup.valid && <Tag color="red">Số điện thoại không hợp lệ</Tag>}
        {exists && !lookup.isChild && <Tag color="green">Đã có tài khoản: {lookup.user?.name || lookup.phone}</Tag>}
        {exists && lookup.isChild && <Tag color="red">Đây là tài khoản con, hãy nhập số của phụ huynh</Tag>}
        {lookup?.valid && !exists && <Tag color="blue">Chưa có tài khoản: sẽ tạo tài khoản thành viên</Tag>}
      </Space>
      {lookup?.valid && !exists && (
        <div style={{ marginBottom: 8 }}><Space wrap>
          <Input style={{ width: 240 }} placeholder="Họ và tên (bắt buộc)" value={order.name} onChange={e => set({ name: e.target.value })} />
          <Input style={{ width: 240 }} placeholder="Email (không bắt buộc)" value={order.email} onChange={e => set({ email: e.target.value })} />
        </Space></div>
      )}

      <div style={{ margin: '4px 0 8px' }}>
        <Checkbox checked={order.forChild} onChange={e => set({ forChild: e.target.checked })}>Người học là con</Checkbox>
      </div>
      {order.forChild && (
        <div style={{ marginBottom: 8 }}><Space wrap>
          {children.length > 0 && (
            <Select style={{ width: 200 }} value={order.childPick} onChange={v => set({ childPick: v })}
              options={[...children.map(c => ({ value: c.id, label: c.name + (c.dob ? ` (${c.dob.slice(0, 4)})` : '') })), { value: NEW_CHILD, label: '+ Thêm bé mới' }]} />
          )}
          {(order.childPick === NEW_CHILD || !children.length) && (
            <>
              <Input style={{ width: 200 }} placeholder="Tên của con" value={order.childName} onChange={e => set({ childName: e.target.value })} />
              <Input style={{ width: 170 }} type="date" value={order.childDob} onChange={e => set({ childDob: e.target.value })} title="Ngày sinh của con" />
              <Checkbox checked={order.childDobYearOnly} onChange={e => set({ childDobYearOnly: e.target.checked })}>Chỉ biết năm sinh</Checkbox>
            </>
          )}
        </Space></div>
      )}

      <div style={{ marginBottom: 8 }}>
        <Space>
          <Button icon={<PlusOutlined />} onClick={() => setPicking(true)}>Chọn khóa học</Button>
          {order.courses.length > 0 && <Typography.Text type="secondary">{order.courses.length} khóa · {fmtVND(total)}</Typography.Text>}
        </Space>
      </div>
      {order.courses.length > 0
        ? <Table size="small" rowKey="id" pagination={false} dataSource={order.courses} columns={columns} style={{ marginBottom: 12 }} />
        : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa chọn khóa học" style={{ margin: '4px 0 12px' }} />}

      <Space wrap align="start">
        <Select style={{ width: 160 }} value={order.payment} onChange={v => set({ payment: v })} options={PAYMENTS} />
        <Radio.Group value={order.paid} onChange={e => set({ paid: e.target.value })} optionType="button"
          options={[{ value: true, label: 'Đã thu tiền' }, { value: false, label: 'Chờ thanh toán' }]} />
        <InputNumber style={{ width: 200 }} min={0} step={10000} value={order.amount} onChange={v => set({ amount: v })}
          placeholder={`Số tiền (trống = ${fmtVND(total)})`}
          formatter={v => (v == null || v === '' ? '' : Number(v).toLocaleString('vi-VN'))} parser={v => (v ?? '').replace(/\D/g, '')} />
      </Space>
      <Input.TextArea style={{ marginTop: 8 }} rows={1} maxLength={500} placeholder="Ghi chú (không bắt buộc)" value={order.note} onChange={e => set({ note: e.target.value })} />
      <Typography.Paragraph type="secondary" style={{ fontSize: 12, margin: '6px 0 0' }}>
        {order.paid
          ? 'Đã thu tiền: đơn được duyệt ngay (ghi danh, ZNS xác nhận đăng ký, email, anyPoint, anyLEARN Foundation, thưởng đơn đầu).'
          : 'Chờ thanh toán: đơn nằm ở "Chờ thanh toán", có nhắc thanh toán và tự hủy sau thời hạn như đơn thường; duyệt khi nhận tiền.'}
      </Typography.Paragraph>

      <Modal open={picking} title="Chọn khóa học" width={900} footer={null} onCancel={() => setPicking(false)} destroyOnHidden>
        <CollectionCoursePicker addedIds={order.courses.map(c => c.id)} onAdd={addCourses} />
      </Modal>
    </Card>
  )
}

function toPayload(order) {
  const pickedChild = order.forChild && order.childPick !== NEW_CHILD && (order.lookup?.children ?? []).length > 0 ? order.childPick : null
  return {
    phone: order.phone.trim(), name: order.name.trim(), email: order.email.trim(),
    forChild: order.forChild, childId: pickedChild,
    childName: pickedChild ? null : order.childName.trim(), childDob: pickedChild ? null : order.childDob || null,
    childDobYearOnly: order.childDobYearOnly,
    items: order.courses.map(c => ({ itemId: c.id, scheduleId: c.scheduleId, startDate: c.startDate || null })),
    payment: order.payment, paid: order.paid, amount: order.amount ?? null, note: order.note.trim(),
  }
}

export default function ManualOrderModal({ open, onClose, onSaved }) {
  const { message } = App.useApp()
  const [orders, setOrders] = useState(() => [blankOrder()])
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState([])

  const close = () => { setOrders([blankOrder()]); setDone([]); onClose() }

  const save = async () => {
    setSaving(true)
    try {
      const res = await client.post('/admin/orders/manual', { orders: orders.map(toPayload) })
      if (res.data?.resultCode !== 1) return message.error(res.data?.message || 'Không lưu được')
      const results = res.data.data.results
      const saved = results.filter(r => r.ok)
      setDone(current => [...saved, ...current])
      const left = orders.map((o, i) => ({ ...o, error: results[i]?.ok ? null : results[i]?.error })).filter((_, i) => !results[i]?.ok)
      setOrders(left.length ? left : [blankOrder()])
      if (saved.length) { message.success(`Đã tạo ${saved.length} đơn`); onSaved?.() }
      if (left.length) message.warning(`${left.length} đơn chưa lưu được, xem lý do trong từng đơn`)
    } catch {
      message.error('Không lưu được')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onCancel={close} width={1000} title="Nhập đơn hàng bằng tay" destroyOnHidden
      footer={(
        <Space>
          <Button onClick={close}>Đóng</Button>
          <Button type="primary" loading={saving} onClick={save}>Lưu {orders.length} đơn</Button>
        </Space>
      )}>
      {done.length > 0 && (
        <Alert type="success" showIcon style={{ marginBottom: 12 }} message={`Đã tạo ${done.length} đơn`} description={(
          <div>
            {done.map(r => (
              <div key={r.orderId}>
                Đơn #{r.orderId} · {r.buyerName || r.phone} · {r.status === 'delivered' ? 'đã duyệt' : 'chờ thanh toán'} · {fmtVND(r.amount)}
                {r.accountCreated && <> · tài khoản mới, mật khẩu tạm <Typography.Text code copyable>{r.password}</Typography.Text>
                  <Typography.Text type="secondary"> (không gửi qua ZNS; khách cũng có thể dùng "Quên mật khẩu")</Typography.Text>
                  {!r.accountZnsQueued && <Typography.Text type="warning"> · ZNS tài khoản chưa gửi: mẫu chưa có mã hoặc đang tắt</Typography.Text>}</>}
              </div>
            ))}
          </div>
        )} />
      )}
      {orders.map((order, index) => (
        <OrderCard key={order.key} order={order} index={index} canRemove={orders.length > 1}
          onChange={update => setOrders(list => list.map(o => (o.key === order.key ? update(o) : o)))}
          onRemove={() => setOrders(list => list.filter(o => o.key !== order.key))} />
      ))}
      <Button block type="dashed" icon={<PlusOutlined />} onClick={() => setOrders(list => [...list, blankOrder()])}>Thêm đơn</Button>
    </Modal>
  )
}
