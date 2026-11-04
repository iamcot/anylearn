import { Alert, Button, Card, Descriptions, Drawer, Form, Input, InputNumber, Modal, Progress, Select, Space, Statistic, Table, Tabs, Tag, Typography, message } from 'antd'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import NumberSettingsForm from '../components/NumberSettingsForm'
import { fmtDateTime, fmtVND } from '../utils/format'

// Plan 21: everything around the first order. Hành trình anyLEARN (system missions), first-order / referral rewards,
// the guest quiz, the anyLEARN Foundation and the learner tier (finished courses).

const ok = (res) => { if (res?.resultCode !== 1) throw new Error(res?.message || 'Lỗi'); return res.data }
const get = (url, params) => client.get(url, { params }).then(r => ok(r.data))
const put = (url, body) => client.put(url, body).then(r => ok(r.data))
const post = (url, body) => client.post(url, body).then(r => ok(r.data))

function useSettingsSave(url, key) {
  const qc = useQueryClient()
  return useMutation({ mutationFn: body => put(url, body), onSuccess: () => qc.invalidateQueries({ queryKey: [key] }) })
}

// ── Journey ───────────────────────────────────────────────────────────

function JourneyTab() {
  const { data, isLoading } = useQuery({ queryKey: ['gm-journey'], queryFn: () => get('/admin/gamification/journey') })
  const save = useSettingsSave('/admin/gamification/journey/settings', 'gm-journey')
  if (isLoading || !data) return <Card loading />
  const claims = Object.fromEntries((data.claims ?? []).map(c => [c.mkey, c.people]))
  const rows = [
    ...(data.chapters ?? []).map(c => ({ key: `chapter:${c.no}`, chapter: c.no, label: `Xong chương ${c.no}: ${c.title}`, gift: c.gift, chapterRow: true })),
    ...(data.defs ?? []).map(d => ({ ...d, chapterRow: false })),
  ].sort((a, b) => a.chapter - b.chapter || (a.chapterRow ? 1 : 0) - (b.chapterRow ? 1 : 0))
  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      <Alert type="info" showIcon message="Mỗi nhiệm vụ được kiểm tra trên dữ liệu thật và trả quà một lần mỗi tài khoản. Chương 4 và 5 mở sau đơn hàng đầu tiên. Khi xong một chương, sự kiện voucher &quot;Xong một chương Hành trình&quot; được gọi (trang Voucher > Sự kiện, ô điều kiện = số chương)." />
      <Card size="small" title="Số người đã nhận">
        <Table size="small" rowKey="key" pagination={false} dataSource={rows} columns={[
          { title: 'Chương', dataIndex: 'chapter', width: 80 },
          { title: 'Nhiệm vụ', dataIndex: 'label', render: (v, r) => r.chapterRow ? <b>{v}</b> : <>{v}{r.optional && <Tag style={{ marginLeft: 6 }}>thêm</Tag>}</> },
          { title: 'Đã nhận', key: 'n', width: 100, render: (_, r) => claims[r.key] ?? 0 },
        ]} />
      </Card>
      <NumberSettingsForm settings={data.settings} saving={save.isPending} onSave={numbers => save.mutateAsync({ numbers })} />
    </Space>
  )
}

// ── Milestones + guest quiz ───────────────────────────────────────────

const KIND_LABELS = { first_order: 'Đơn đầu tiên', referral_buyer: 'Người được mời mua đơn đầu', referral_inviter: 'Người mời (bạn mua đơn đầu)' }

function MilestonesTab() {
  const { data, isLoading } = useQuery({ queryKey: ['gm-milestones'], queryFn: () => get('/admin/gamification/milestones') })
  const save = useSettingsSave('/admin/gamification/milestones/settings', 'gm-milestones')
  if (isLoading || !data) return <Card loading />
  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      <Card size="small" title="Đã thưởng">
        <Table size="small" rowKey="kind" pagination={false} dataSource={data.byKind ?? []} columns={[
          { title: 'Loại', dataIndex: 'kind', render: k => KIND_LABELS[k] ?? k },
          { title: 'Số lần', dataIndex: 'times' },
          { title: 'anyPoint', dataIndex: 'points' },
          { title: 'Leo Xu', dataIndex: 'coins' },
        ]} />
      </Card>
      <NumberSettingsForm settings={data.settings} saving={save.isPending} onSave={numbers => save.mutateAsync({ numbers })} />
    </Space>
  )
}

function GuestQuizTab() {
  const { data, isLoading } = useQuery({ queryKey: ['gm-guest-quiz'], queryFn: () => get('/admin/gamification/guest-quiz') })
  const topics = useQuery({ queryKey: ['quiz-bank-overview-topics'], queryFn: () => get('/admin/quiz-bank/overview').then(d => d?.topics ?? []) })
  const save = useSettingsSave('/admin/gamification/guest-quiz/settings', 'gm-guest-quiz')
  const [topic, setTopic] = useState(null)
  if (isLoading || !data) return <Card loading />
  const topicList = topics.data ?? []
  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      <Alert type="info" showIcon message={<>Trang công khai <b>/quiz-thu</b>: khách chơi không cần đăng ký, câu hỏi lấy từ Kho câu hỏi (chỉ câu dễ). Đăng ký từ trang kết quả được tặng Leo Xu một lần. Đã có <b>{data.signups}</b> người đăng ký sau quiz.</>} />
      <NumberSettingsForm settings={data} saving={save.isPending}
        onSave={numbers => save.mutateAsync({ numbers, topic: topic ?? data.topic })}
        extra={<Card size="small" title="Chủ đề câu hỏi">
          <Select style={{ width: 280 }} value={topic ?? data.topic} onChange={setTopic}
            options={topicList.map(t => ({ value: t.key, label: t.label }))} />
        </Card>} />
    </Space>
  )
}

// ── Foundation ────────────────────────────────────────────────────────

const SOURCE_LABELS = { order: 'Đơn hàng', milestone: 'Phần thưởng', seed: 'anyLEARN góp', admin: 'Admin' }

function HouseDrawer({ house, onClose }) {
  const qc = useQueryClient()
  const [form] = Form.useForm()
  const save = useMutation({ mutationFn: body => put(`/admin/foundation/houses/${house.houseNo}`, body), onSuccess: () => { qc.invalidateQueries({ queryKey: ['gm-foundation'] }); message.success('Đã lưu'); onClose() } })
  return (
    <Drawer open title={`Căn số ${house.houseNo}`} onClose={onClose} width={420} destroyOnHidden
      extra={<Button type="primary" loading={save.isPending} onClick={() => form.submit()}>Lưu</Button>}>
      <Form form={form} layout="vertical" initialValues={house} onFinish={v => save.mutate(v)}>
        <Form.Item name="school" label="Trường"><Input /></Form.Item>
        <Form.Item name="place" label="Địa điểm"><Input /></Form.Item>
        <Form.Item name="openedOn" label="Ngày khánh thành (yyyy-mm-dd)"><Input placeholder="2027-03-15" /></Form.Item>
        <Form.Item name="photoUrl" label="Link ảnh"><Input /></Form.Item>
        <Form.Item name="proofUrl" label="Link chứng từ"><Input /></Form.Item>
        <Form.Item name="note" label="Ghi chú"><Input.TextArea rows={3} /></Form.Item>
      </Form>
    </Drawer>
  )
}

function FoundationTab() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['gm-foundation'], queryFn: () => get('/admin/foundation') })
  const save = useSettingsSave('/admin/foundation/settings', 'gm-foundation')
  const seed = useMutation({ mutationFn: body => post('/admin/foundation/seed', body), onSuccess: () => { qc.invalidateQueries({ queryKey: ['gm-foundation'] }); message.success('Đã ghi nhận') } })
  const [house, setHouse] = useState(null)
  const [seedOpen, setSeedOpen] = useState(false)
  const [seedForm] = Form.useForm()
  if (isLoading || !data) return <Card loading />
  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      <Card>
        <Space size={32} wrap>
          <Statistic title={`Căn đang xây (số ${data.currentHouse})`} value={data.percent} suffix="%" />
          <Statistic title="Đã có" value={fmtVND(data.currentAmount)} />
          <Statistic title="Còn thiếu" value={fmtVND(data.remaining)} />
          <Statistic title="Đã xây xong" value={data.housesBuilt} suffix="căn" />
          <Statistic title="Tổng đã góp" value={fmtVND(data.totalAmount)} />
          <Statistic title="Gia đình góp" value={data.contributors} />
        </Space>
        <Progress percent={data.percent} style={{ marginTop: 12 }} />
        <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
          Đổi giá trị một căn chỉ đổi phần trăm của căn đang xây, không đổi số căn đã xong. Hạ giá trị xuống dưới số đã có: căn đang xây xong ở lần góp tiếp theo.
        </Typography.Paragraph>
        <Button style={{ marginTop: 12 }} onClick={() => setSeedOpen(true)}>anyLEARN góp thêm</Button>
      </Card>
      <Card size="small" title="Theo nguồn">
        <Table size="small" rowKey="source" pagination={false} dataSource={data.bySource ?? []} columns={[
          { title: 'Nguồn', dataIndex: 'source', render: s => SOURCE_LABELS[s] ?? s },
          { title: 'Số lần', dataIndex: 'times' },
          { title: 'Số tiền', dataIndex: 'amount', render: fmtVND },
        ]} />
      </Card>
      <Card size="small" title="Căn đã xây xong">
        <Table size="small" rowKey="houseNo" pagination={false} dataSource={data.houses ?? []} locale={{ emptyText: 'Chưa có căn nào' }} columns={[
          { title: 'Căn', dataIndex: 'houseNo', width: 70 },
          { title: 'Đủ tiền lúc', dataIndex: 'completedAt', render: fmtDateTime },
          { title: 'Trường', dataIndex: 'school' },
          { title: 'Địa điểm', dataIndex: 'place' },
          { title: 'Khánh thành', dataIndex: 'openedOn' },
          { title: '', key: 'a', render: (_, r) => <Button size="small" onClick={() => setHouse(r)}>Sửa thông tin</Button> },
        ]} />
      </Card>
      <Card size="small" title="Đóng góp gần đây (tên như khách thấy)">
        <Table size="small" rowKey="id" pagination={{ pageSize: 10 }} dataSource={data.recent ?? []} columns={[
          { title: 'Tên', dataIndex: 'name' },
          { title: 'Góp', dataIndex: 'label' },
          { title: 'Nguồn', dataIndex: 'source', render: s => SOURCE_LABELS[s] ?? s },
          { title: 'Căn', dataIndex: 'houseNo' },
          { title: 'Lúc', dataIndex: 'at', render: fmtDateTime },
        ]} />
      </Card>
      <NumberSettingsForm settings={data.settings} saving={save.isPending} onSave={numbers => save.mutateAsync({ numbers })} />
      {house && <HouseDrawer house={house} onClose={() => setHouse(null)} />}
      <Modal open={seedOpen} title="anyLEARN góp thêm" onCancel={() => setSeedOpen(false)} confirmLoading={seed.isPending}
        onOk={() => seedForm.validateFields().then(v => seed.mutateAsync(v)).then(() => { setSeedOpen(false); seedForm.resetFields() }).catch(e => e?.message && message.error(e.message))}>
        <Form form={seedForm} layout="vertical">
          <Form.Item name="amount" label="Số tiền (đ)" rules={[{ required: true }]}><InputNumber min={1000} step={100000} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="note" label="Ghi chú"><Input placeholder="anyLEARN góp" /></Form.Item>
        </Form>
      </Modal>
    </Space>
  )
}

// ── Learner tier ──────────────────────────────────────────────────────

const COMPLETION_SOURCES = { video: 'Học xong video', class: 'Lớp kết thúc, đủ buổi', parent: 'Phụ huynh bấm', admin: 'Admin' }

function LearnerTierTab() {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(0)
  const list = useQuery({ queryKey: ['gm-tier', q, status, page], queryFn: () => get('/admin/learner-tier', { q, status, page }) })
  const settings = useQuery({ queryKey: ['gm-tier-settings'], queryFn: () => get('/admin/learner-tier/settings') })
  const saveSettings = useSettingsSave('/admin/learner-tier/settings', 'gm-tier-settings')
  const setRow = useMutation({ mutationFn: ({ id, ...body }) => put(`/admin/learner-tier/${id}`, body), onSuccess: () => qc.invalidateQueries({ queryKey: ['gm-tier'] }) })
  const add = useMutation({ mutationFn: body => post('/admin/learner-tier', body), onSuccess: () => qc.invalidateQueries({ queryKey: ['gm-tier'] }) })
  const [addOpen, setAddOpen] = useState(false)
  const [addForm] = Form.useForm()

  const revoke = row => {
    let note = ''
    Modal.confirm({
      title: `Bỏ hoàn thành "${row.title}" của ${row.learnerName}?`,
      content: <Input.TextArea rows={2} placeholder="Lý do (bắt buộc)" onChange={e => { note = e.target.value }} />,
      onOk: () => setRow.mutateAsync({ id: row.id, status: 'revoked', note }).catch(e => { message.error(e.message); throw e }),
    })
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      <Alert type="info" showIcon message="Một khóa được tính hoàn thành khi: học xong 100% khóa video, hoặc lớp đã kết thúc và bé đi đủ số buổi theo tỉ lệ, hoặc phụ huynh bấm &quot;Đã hoàn thành&quot;. Admin bỏ hoặc thêm khi thấy không đúng; dòng đã bỏ không bị hệ thống thêm lại." />
      <Space wrap>
        <Input.Search allowClear placeholder="Tên, SĐT, khóa học" onSearch={v => { setQ(v); setPage(0) }} style={{ width: 280 }} />
        <Select value={status} onChange={v => { setStatus(v); setPage(0) }} style={{ width: 160 }}
          options={[{ value: 'all', label: 'Tất cả' }, { value: 'done', label: 'Hoàn thành' }, { value: 'revoked', label: 'Đã bỏ' }]} />
        <Button onClick={() => setAddOpen(true)}>Thêm thủ công</Button>
      </Space>
      <Table size="small" rowKey="id" loading={list.isLoading} dataSource={list.data?.items ?? []}
        pagination={{ current: page + 1, pageSize: list.data?.size ?? 50, total: list.data?.total ?? 0, onChange: p => setPage(p - 1) }}
        columns={[
          { title: 'Người học', dataIndex: 'learnerName', render: (v, r) => <>{v}<br /><Typography.Text type="secondary">{r.phone} · #{r.learnerId}</Typography.Text></> },
          { title: 'Khóa học', dataIndex: 'title', render: (v, r) => <>{v} <Typography.Text type="secondary">#{r.itemId}</Typography.Text></> },
          { title: 'Cách tính', dataIndex: 'source', render: s => COMPLETION_SOURCES[s] ?? s },
          { title: 'Trạng thái', dataIndex: 'status', render: (s, r) => s === 'done' ? <Tag color="green">Hoàn thành</Tag> : <Tag title={r.note}>Đã bỏ</Tag> },
          { title: 'Lúc', dataIndex: 'completedAt', render: fmtDateTime },
          { title: '', key: 'a', render: (_, r) => r.status === 'done'
            ? <Button size="small" danger onClick={() => revoke(r)}>Bỏ</Button>
            : <Button size="small" onClick={() => setRow.mutate({ id: r.id, status: 'done', note: 'Admin khôi phục' })}>Khôi phục</Button> },
        ]} />
      {settings.data && <NumberSettingsForm settings={settings.data} saving={saveSettings.isPending} onSave={numbers => saveSettings.mutateAsync({ numbers })} />}
      <Modal open={addOpen} title="Thêm khóa hoàn thành" onCancel={() => setAddOpen(false)} confirmLoading={add.isPending}
        onOk={() => addForm.validateFields().then(v => add.mutateAsync(v)).then(() => { setAddOpen(false); addForm.resetFields(); message.success('Đã thêm') }).catch(e => e?.message && message.error(e.message))}>
        <Form form={addForm} layout="vertical">
          <Form.Item name="learnerId" label="ID người học (tài khoản hoặc bé)" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="itemId" label="ID khóa học" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="note" label="Ghi chú"><Input /></Form.Item>
        </Form>
      </Modal>
    </Space>
  )
}

export default function Gamification() {
  return (
    <div style={{ padding: 24 }}>
      <Card>
      <Typography.Title level={3} style={{ marginTop: 0 }}>Hành trình & đơn đầu</Typography.Title>
      <Descriptions size="small" column={1} style={{ marginBottom: 12 }}>
        <Descriptions.Item label="Mục tiêu">Dẫn gia đình mới tới khóa học đầu tiên và quay lại lớp.</Descriptions.Item>
      </Descriptions>
      <Tabs items={[
        { key: 'journey', label: 'Hành trình HỌC không giới hạn!', children: <JourneyTab /> },
        { key: 'milestones', label: 'Thưởng đơn đầu & giới thiệu', children: <MilestonesTab /> },
        { key: 'foundation', label: 'anyLEARN Foundation', children: <FoundationTab /> },
        { key: 'tier', label: 'Cấp học viên', children: <LearnerTierTab /> },
        { key: 'guest-quiz', label: 'Quiz thử cho khách', children: <GuestQuizTab /> },
      ]} />
      </Card>
    </div>
  )
}
