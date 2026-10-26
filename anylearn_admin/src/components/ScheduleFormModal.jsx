import { Button, Checkbox, DatePicker, Divider, Form, Input, Modal, Segmented, Select, Space, TimePicker, Typography } from 'antd'
import { useState } from 'react'

const WEEKDAYS = [
  { label: 'T2', value: 'mon' }, { label: 'T3', value: 'tue' }, { label: 'T4', value: 'wed' }, { label: 'T5', value: 'thu' },
  { label: 'T6', value: 'fri' }, { label: 'T7', value: 'sat' }, { label: 'CN', value: 'sun' },
]
const KINDS = [
  { value: 'recurring', label: 'Lớp cố định' },
  { value: 'event', label: 'Một buổi' },
  { value: 'open', label: 'Linh hoạt' },
]
const KIND_HINT = {
  recurring: 'Có ngày khai giảng, học đều các thứ trong tuần.',
  event: 'Chỉ diễn ra một ngày cụ thể.',
  open: 'Học sinh tự chọn ngày học, chỉ cần khai báo các thứ có lớp.',
}
const DATE_FORMAT = 'DD/MM/YYYY'
const PAIR = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)', gap: 8, alignItems: 'center' }

function Section({ title, children }) {
  return (
    <>
      <Divider orientation="left" plain style={{ margin: '18px 0 12px', fontSize: 12, color: '#888' }}>{title}</Divider>
      {children}
    </>
  )
}

function AddressPicker({ isNew, locations, onAddLocation }) {
  if (locations.length === 0) return <Typography.Text type="danger">Đối tác chưa có địa chỉ.</Typography.Text>
  const options = locations.map(l => ({ value: l.id, label: `${l.title} — ${l.address}` }))
  return (
    <Space direction="vertical" size={4} style={{ width: '100%' }}>
      {locations.length === 1 && <span>Tự áp dụng: {locations[0].title} — {locations[0].address}</span>}
      {locations.length > 1 && isNew && (
        <Form.Item name="userLocationIds" noStyle rules={[{ required: true, message: 'Chọn ít nhất một địa chỉ' }]}>
          <Checkbox.Group style={{ display: 'flex', flexDirection: 'column', gap: 4 }} options={options} />
        </Form.Item>
      )}
      {locations.length > 1 && !isNew && (
        <Form.Item name="userLocationId" noStyle rules={[{ required: true, message: 'Chọn địa chỉ' }]}>
          <Select placeholder="Chọn địa chỉ của đối tác" options={options} />
        </Form.Item>
      )}
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {locations.length > 1 && isNew ? 'Tick nhiều địa chỉ để tạo mỗi địa chỉ một ca cùng giờ. ' : ''}
        <a onClick={onAddLocation}>+ Thêm địa chỉ mới</a>
      </Typography.Text>
    </Space>
  )
}

// Only the parts that matter for the course are shown: a place for courses taught at a place, a meeting link for
// online courses, bring-along notes for extra-curricular ones.
function Fields({ form, isNew, item, locations, onAddLocation }) {
  const kind = Form.useWatch('scheduleType', form) ?? 'recurring'
  const meetingUrl = Form.useWatch('meetingUrl', form)
  const meetingId = Form.useWatch('meetingId', form)
  const [forceOnline, setForceOnline] = useState(false)
  const format = item?.subtype
  const showPlace = !!item?.addressRequired
  const showOnline = format === 'online' || forceOnline || !!meetingUrl || !!meetingId
  const showExtra = format === 'extra'

  return (
    <>
      <Form.Item name="title" label="Tên ca (tuỳ chọn)" style={{ marginBottom: 12 }}>
        <Input placeholder="VD: Ca chiều T3-T5" />
      </Form.Item>
      <Form.Item name="scheduleType" label="Loại lịch" initialValue="recurring" style={{ marginBottom: 4 }}>
        <Segmented block options={KINDS} />
      </Form.Item>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>{KIND_HINT[kind]}</Typography.Text>

      <Section title="Thời gian">
        {kind === 'event' && (
          <Form.Item name="eventDate" label="Ngày tổ chức" style={{ marginBottom: 12 }}>
            <DatePicker format={DATE_FORMAT} style={{ width: '100%' }} />
          </Form.Item>
        )}
        {(kind === 'recurring' || kind === 'open') && (
          <Form.Item name="weekdays" label="Các thứ trong tuần" style={{ marginBottom: 12 }}>
            <Checkbox.Group options={WEEKDAYS} />
          </Form.Item>
        )}
        {kind === 'recurring' && (
          <Form.Item label="Khai giảng → kết thúc (tuỳ chọn)" style={{ marginBottom: 12 }}>
            <div style={PAIR}>
              <Form.Item name="dateStart" noStyle><DatePicker format={DATE_FORMAT} placeholder="Ngày bắt đầu" style={{ width: '100%' }} /></Form.Item>
              <span>→</span>
              <Form.Item name="dateEnd" noStyle><DatePicker format={DATE_FORMAT} placeholder="Ngày kết thúc" style={{ width: '100%' }} /></Form.Item>
            </div>
          </Form.Item>
        )}
        <Form.Item label="Giờ học" style={{ marginBottom: 0 }}>
          <div style={PAIR}>
            <Form.Item name="timeStart" noStyle><TimePicker format="HH:mm" minuteStep={5} placeholder="08:30" style={{ width: '100%' }} /></Form.Item>
            <span>→</span>
            <Form.Item name="timeEnd" noStyle><TimePicker format="HH:mm" minuteStep={5} placeholder="10:00" style={{ width: '100%' }} /></Form.Item>
          </div>
        </Form.Item>
      </Section>

      {showPlace && (
        <Section title="Địa điểm">
          <Form.Item label="Địa chỉ học" required style={{ marginBottom: 12 }}>
            <AddressPicker isNew={isNew} locations={locations} onAddLocation={onAddLocation} />
          </Form.Item>
          <Form.Item name="locationNote" label="Phòng học / ghi chú" style={{ marginBottom: 0 }}>
            <Input placeholder="VD: Phòng A203, tầng 2" />
          </Form.Item>
        </Section>
      )}

      {showOnline && (
        <Section title="Học online">
          <Form.Item name="meetingUrl" label="Link học (Zoom…)" style={{ marginBottom: 12 }}>
            <Input placeholder="https://zoom.us/j/..." />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
            <Form.Item name="meetingId" label="Meeting ID" style={{ marginBottom: 0 }}><Input /></Form.Item>
            <Form.Item name="meetingPasscode" label="Mật khẩu" style={{ marginBottom: 0 }}><Input /></Form.Item>
          </div>
        </Section>
      )}

      {showExtra && (
        <Section title="Ngoại khóa">
          <div style={{ display: 'grid', gridTemplateColumns: '140px minmax(0, 1fr)', gap: 12 }}>
            <Form.Item name="gatherTime" label="Giờ tập trung" style={{ marginBottom: 0 }}><Input placeholder="07:30" /></Form.Item>
            <Form.Item name="bringItems" label="Cần mang theo" style={{ marginBottom: 0 }}><Input placeholder="VD: Nước uống, nón, giày thể thao" /></Form.Item>
          </div>
        </Section>
      )}

      {!showOnline && (
        <div style={{ marginTop: 14 }}>
          <a style={{ fontSize: 12 }} onClick={() => setForceOnline(true)}>+ Thêm link học online</a>
        </div>
      )}
    </>
  )
}

export default function ScheduleFormModal({ open, form, editing, item, locations, onAddLocation, onSubmit, onClose }) {
  const submit = (values) => onSubmit({
    ...values,
    weekdays: Array.isArray(values.weekdays) ? values.weekdays.join(',') : values.weekdays,
    eventDate: values.eventDate?.format('YYYY-MM-DD') ?? null,
    dateStart: values.dateStart?.format('YYYY-MM-DD') ?? null,
    dateEnd: values.dateEnd?.format('YYYY-MM-DD') ?? null,
    timeStart: values.timeStart?.format('HH:mm') ?? null,
    timeEnd: values.timeEnd?.format('HH:mm') ?? null,
  })

  return (
    <Modal title={editing ? 'Sửa ca học' : 'Thêm ca học'} open={open} onCancel={onClose} footer={null} destroyOnClose width={560}>
      <Form form={form} layout="vertical" onFinish={submit}>
        <Fields form={form} isNew={!editing} item={item} locations={locations} onAddLocation={onAddLocation} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <Button onClick={onClose}>Hủy</Button>
          <Button type="primary" htmlType="submit">Lưu ca học</Button>
        </div>
      </Form>
    </Modal>
  )
}
