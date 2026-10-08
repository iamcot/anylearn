import {
  App, Button, DatePicker, Form, Input, InputNumber,
  Popover, Rate, Select, Space, Switch, Table, Tabs, Tag, Tooltip,
  Typography, Upload,
} from 'antd'
import {
  ArrowLeftOutlined, CheckOutlined, DeleteOutlined,
  InfoCircleOutlined, QuestionCircleOutlined,
  SaveOutlined, StarOutlined, UndoOutlined, UploadOutlined,
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import client from '../api/client'
import RichEditor from '../components/RichEditor'
import { usePagination } from '../hooks/usePagination'
import { fmtVND, fmtDate, fmtDateTime } from '../utils/format'

// ── Constants ────────────────────────────────────────────────────────────────

const SUBTYPES = [
  { value: 'online', label: 'Online' }, { value: 'digital', label: 'Digital' },
  { value: 'offline', label: 'Offline' }, { value: 'extra', label: 'Extra' },
  { value: 'video', label: 'Video' }, { value: 'preschool', label: 'Preschool' },
]
const CYCLE_TYPES = [
  { value: 'session', label: 'Buổi' }, { value: 'day', label: 'Ngày' },
  { value: 'week', label: 'Tuần' }, { value: 'month', label: 'Tháng' }, { value: 'year', label: 'Năm' },
]
const LOCATION_TYPES = [
  { value: 'online', label: 'Online' }, { value: 'offline', label: 'Offline' }, { value: 'hybrid', label: 'Hybrid' },
]
const CC_FIELDS = [
  { key: 'discount', label: 'Giảm giá (%)' }, { key: 'commission', label: 'Hoa hồng cty (%)' },
  { key: 'bonus_ref_seller', label: 'Thưởng người giới thiệu (%)' }, { key: 'bonus_foundation', label: 'Thưởng foundation (%)' },
]
const STUDENT_STATUS_LABELS = {
  active: 'Đang học', completed: 'Hoàn thành', cancelled: 'Đã huỷ',
  pending: 'Chờ xác nhận', refunded: 'Hoàn tiền',
}
const CONTENT_GUIDE = `Cấu trúc bài viết chất lượng gợi ý:

1. Giới thiệu — IXL là gì? Điểm nổi bật
2. Ưu điểm — Lợi ích, tính năng đặc biệt
3. Chương trình học — Nội dung, cấp độ, tài liệu
4. Đối tượng phù hợp — Độ tuổi, trình độ
5. Giáo viên — Kinh nghiệm, chứng chỉ
6. Cơ sở vật chất — Phòng học, thiết bị
7. Kết quả học viên — Thành tích, phụ huynh nói gì
8. Thông tin đăng ký — Học phí, ưu đãi, liên hệ`

// ── Helper components ─────────────────────────────────────────────────────────

function SectionCard({ title, children }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 8, padding: '16px 20px', marginBottom: 16 }}>
      {title && <Typography.Text strong style={{ display: 'block', marginBottom: 12, fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</Typography.Text>}
      {children}
    </div>
  )
}

function FieldRow({ label, tooltip, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '170px 1fr', alignItems: 'flex-start', padding: '6px 0' }}>
      <span style={{ fontSize: 13, color: '#555', paddingTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
        {label}
        {tooltip && <Tooltip title={tooltip}><InfoCircleOutlined style={{ fontSize: 11, color: '#bbb' }} /></Tooltip>}
      </span>
      <div>{children}</div>
    </div>
  )
}

// Switch bound to numeric form field (stores 0/1, not boolean)
// (used inline via switchItemProps — this wrapper kept for potential future use)
// ── Data helpers ──────────────────────────────────────────────────────────────

function parseContent(raw) {
  if (!raw || !raw.trim().startsWith('{')) return raw || ''
  try {
    const parsed = JSON.parse(raw)
    return Object.entries(parsed)
      .filter(([key, val]) => key !== 'content_old' && val != null && String(val).trim())
      .map(([, val]) => String(val).trim())
      .join('\n')
  } catch { return raw }
}

function itemToForm(d) {
  let ccObj = {}
  try { ccObj = d.companyCommission ? JSON.parse(d.companyCommission) : {} } catch {}
  return {
    ...d,
    userId: d.userId ? { value: d.userId, label: [d.ownerName, d.ownerPhone].filter(Boolean).join(' · ') } : undefined,
    // numeric 0/1 fields — keep as numbers, normalize on Switch via getValueProps
    status: d.status ?? 0,
    userStatus: d.userStatus ?? 0,
    isHot: d.isHot ?? 0,
    isPaymentfee: d.isPaymentfee ?? 0,
    allowReRegister: d.allowReRegister ?? 0,
    activiyTrial: d.activiyTrial ?? 0,
    activiyTest: d.activiyTest ?? 0,
    activiyVisit: d.activiyVisit ?? 0,
    // date fields
    dateStart: d.dateStart ? dayjs(d.dateStart) : null,
    dateEnd: d.dateEnd ? dayjs(d.dateEnd) : null,
    // special fields
    nolimitTime: d.nolimitTime === '1',
    tags: (d.tags || '').split(',').filter(Boolean).map(t => t.trim()),
    categoryIds: (d.categories ?? []).map(c => c.id),
    // company commission JSON
    cc_discount: ccObj.discount ?? null,
    cc_commission: ccObj.commission ?? null,
    cc_bonus_ref_seller: ccObj.bonus_ref_seller ?? null,
    cc_bonus_foundation: ccObj.bonus_foundation ?? null,
  }
}

// Shared props for Switch form items that store 0/1
const switchItemProps = {
  getValueProps: (v) => ({ checked: v == 1 }),
  normalize: (v) => (v ? 1 : 0),
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function ItemDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const qc = useQueryClient()
  const isNew = id === 'new'

  const [form] = Form.useForm()
  const [reviewForm] = Form.useForm()
  const [dirty, setDirty] = useState(false)
  const [richContent, setRichContent] = useState('')
  const studentsPagination = usePagination()

  // ── Queries ─────────────────────────────────────────────────────────────────

  const { data: item, isLoading } = useQuery({
    queryKey: ['admin-item-detail', id],
    queryFn: () => client.get(`/admin/items/${id}`).then(r => r.data?.data ?? r.data),
    enabled: !isNew,
  })

  // Init form only after component is mounted and item data arrives
  useEffect(() => {
    if (item) {
      form.setFieldsValue(itemToForm(item))
      setRichContent(parseContent(item.content) || '')
    }
  }, [item?.id])

  const { data: categories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => client.get('/admin/categories').then(r => r.data?.data ?? []),
    staleTime: 5 * 60_000,
  })

  const { data: partners } = useQuery({
    queryKey: ['admin-partners'],
    queryFn: () => client.get('/admin/partners').then(r => r.data?.data ?? []),
    staleTime: 30 * 60_000,
  })

  const { data: reviews } = useQuery({
    queryKey: ['admin-item-reviews', id],
    queryFn: () => client.get(`/admin/items/${id}/reviews`).then(r => r.data?.data ?? []),
    enabled: !isNew,
  })

  const { data: students } = useQuery({
    queryKey: ['admin-item-students', id, studentsPagination.page],
    queryFn: () => client.get(`/admin/items/${id}/students`, { params: { page: studentsPagination.page - 1, size: 20 } })
              .then(r => r.data?.data ?? { content: [], total: 0 }),
    enabled: !isNew,
  })

  // ── Mutations ────────────────────────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: async (values) => {
      const tagArr = Array.isArray(values.tags) ? values.tags : []
      const ccJson = JSON.stringify({
        discount: values.cc_discount ?? null, commission: values.cc_commission ?? null,
        bonus_ref_seller: values.cc_bonus_ref_seller ?? null, bonus_foundation: values.cc_bonus_foundation ?? null,
      })
      const boolNum = (v) => (v ? 1 : 0)
      const body = {
        ...values,
        userId: values.userId?.value ?? values.userId,
        tags: tagArr.join(','),
        dateStart: values.dateStart ? values.dateStart.format('YYYY-MM-DD') : null,
        dateEnd: values.dateEnd ? values.dateEnd.format('YYYY-MM-DD') : null,
        nolimitTime: values.nolimitTime ? '1' : '0',
        content: richContent,
        companyCommission: ccJson,
        status: boolNum(values.status),
        userStatus: boolNum(values.userStatus),
        isHot: boolNum(values.isHot),
        isPaymentfee: boolNum(values.isPaymentfee),
        allowReRegister: boolNum(values.allowReRegister),
        activiyTrial: values.activiyTrial != null ? boolNum(values.activiyTrial) : null,
        activiyTest: values.activiyTest != null ? boolNum(values.activiyTest) : null,
        activiyVisit: values.activiyVisit != null ? boolNum(values.activiyVisit) : null,
      }
      const { categoryIds, cc_discount, cc_commission, cc_bonus_ref_seller, cc_bonus_foundation, ...itemBody } = body

      if (isNew) {
        const res = await client.post('/admin/items', itemBody)
        const newId = res.data?.data?.id
        if (categoryIds?.length) {
          await client.put(`/admin/items/${newId}/categories`, { categoryIds })
        }
        return newId
      }
      await Promise.all([
        client.put(`/admin/items/${id}`, itemBody),
        client.put(`/admin/items/${id}/categories`, { categoryIds: categoryIds ?? [] }),
      ])
      return null
    },
    onSuccess: (newId) => {
      if (newId) {
        qc.invalidateQueries(['admin-items'])
        navigate(`/items/${newId}`, { replace: true })
        message.success('Tạo khóa học thành công')
      } else {
        qc.invalidateQueries(['admin-item-detail', id])
        qc.invalidateQueries(['admin-items'])
        setDirty(false)
        message.success('Đã lưu')
      }
    },
    onError: (e) => message.error(`Lưu thất bại: ${e.response?.data?.message ?? e.message}`),
  })

  const approveMutation = useMutation({
    mutationFn: () => client.put(`/admin/items/${id}/approve`),
    onSuccess: () => { qc.invalidateQueries(['admin-item-detail', id]); message.success('Đã duyệt') },
  })

  const createReviewMutation = useMutation({
    mutationFn: (values) => client.post(`/admin/items/${id}/reviews`, values),
    onSuccess: () => { qc.invalidateQueries(['admin-item-reviews', id]); reviewForm.resetFields(); message.success('Đã thêm') },
  })

  const deleteReviewMutation = useMutation({
    mutationFn: (rid) => client.delete(`/admin/items/${id}/reviews/${rid}`),
    onSuccess: () => qc.invalidateQueries(['admin-item-reviews', id]),
  })

  function handleReset() {
    if (item) { form.setFieldsValue(itemToForm(item)); setRichContent(parseContent(item.content) || ''); setDirty(false) }
  }

  if (isLoading) return null

  // ── Tabs ──────────────────────────────────────────────────────────────────

  const tabItems = [

    { key: 'overview', label: 'Tổng quan', children: (
      <div style={{ maxWidth: 700, paddingBottom: 32 }}>
        <SectionCard title="Đối tác">
          <FieldRow label="Đối tác / Trường">
            <Form.Item name="userId" noStyle rules={[{ required: true, message: 'Chọn đối tác' }]}>
              <Select
                labelInValue showSearch placeholder="Tìm tên hoặc SĐT..."
                style={{ width: 320 }} onChange={() => setDirty(true)}
                optionFilterProp="search"
                options={(partners ?? []).map(p => ({
                  value: p.id,
                  label: p.name || `ID ${p.id}`,
                  phone: p.phone ?? '',
                  search: `${p.name ?? ''} ${p.phone ?? ''}`,
                }))}
                optionRender={opt => (
                  <div>
                    <span>{opt.data.label}</span>
                    {opt.data.phone && <span style={{ marginLeft: 8, fontSize: 12, color: '#999' }}>{opt.data.phone}</span>}
                  </div>
                )}
              />
            </Form.Item>
          </FieldRow>
        </SectionCard>

        <SectionCard title="Tiêu đề">
          <Form.Item name="title" noStyle rules={[{ required: true, min: 5 }]}>
            <Input.TextArea autoSize={{ minRows: 1, maxRows: 3 }} onChange={() => setDirty(true)} />
          </Form.Item>
        </SectionCard>

        <SectionCard title="Trạng thái & Hiển thị">
          <FieldRow label="Trạng thái platform">
            <Form.Item name="status" noStyle {...switchItemProps}>
              <Switch checkedChildren="Hiển thị" unCheckedChildren="Ẩn" onChange={() => setDirty(true)} />
            </Form.Item>
          </FieldRow>
          <FieldRow label="Trạng thái đối tác">
            <Form.Item name="userStatus" noStyle {...switchItemProps}>
              <Switch checkedChildren="Đã duyệt" unCheckedChildren="Chờ duyệt" onChange={() => setDirty(true)} />
            </Form.Item>
          </FieldRow>
          <FieldRow label="Nổi bật (Hot)">
            <Form.Item name="isHot" noStyle {...switchItemProps}>
              <Switch checkedChildren="Hot" unCheckedChildren="Thường" onChange={() => setDirty(true)} />
            </Form.Item>
          </FieldRow>
          <FieldRow label="Điểm ưu tiên" tooltip="Dùng khi sắp xếp danh sách hiển thị. Số càng lớn càng ưu tiên hiện trên.">
            <Form.Item name="boostScore" noStyle>
              <InputNumber min={0} onChange={() => setDirty(true)} />
            </Form.Item>
          </FieldRow>
        </SectionCard>

        <SectionCard title="Học phí">
          <FieldRow label="Học phí bán (VND)">
            <Form.Item name="price" noStyle rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: 200 }} formatter={v => fmtVND(v)} parser={v => String(v).replace(/\./g, '')} onChange={() => setDirty(true)} />
            </Form.Item>
          </FieldRow>
          <FieldRow label="Học phí gốc (VND)">
            <Form.Item name="orgPrice" noStyle>
              <InputNumber min={0} style={{ width: 200 }} formatter={v => fmtVND(v)} parser={v => String(v).replace(/\./g, '')} onChange={() => setDirty(true)} />
            </Form.Item>
          </FieldRow>
        </SectionCard>

        <SectionCard title="Phân loại">
          <FieldRow label="Lĩnh vực">
            <Form.Item name="categoryIds" noStyle>
              <Select mode="multiple" placeholder="Chọn lĩnh vực" style={{ width: '100%' }} optionFilterProp="label" onChange={() => setDirty(true)}
                options={(categories ?? []).map(c => ({ value: c.id, label: c.title }))} />
            </Form.Item>
          </FieldRow>
          <FieldRow label="Tags">
            <Form.Item name="tags" noStyle>
              <Select mode="tags" placeholder="Gõ rồi nhấn , hoặc Enter" style={{ width: '100%' }} tokenSeparators={[',']} onChange={() => setDirty(true)} />
            </Form.Item>
          </FieldRow>
        </SectionCard>

        <SectionCard>
          <FieldRow label="Đã bán"><Typography.Text>{fmtVND(item?.soldCount ?? 0)} học sinh</Typography.Text></FieldRow>
          <FieldRow label="Ngày tạo"><Typography.Text>{item ? fmtDate(item.createdAt) : '—'}</Typography.Text></FieldRow>
        </SectionCard>
      </div>
    )},

    { key: 'content', label: 'Nội dung', children: (
      <div style={{ maxWidth: 760, paddingBottom: 32 }}>
        <SectionCard title="Ảnh đại diện">
          {item?.image && <img src={item.image} alt="cover" style={{ maxHeight: 140, borderRadius: 6, marginBottom: 12, display: 'block' }} />}
          {!isNew && (
            <Upload name="file" showUploadList={false}
              action={`/v2/api/item/${id}/upload-image`}
              headers={{ Authorization: `Bearer ${localStorage.getItem('admin_token')}` }}
              accept="image/*"
              onChange={info => {
                if (info.file.status === 'done') {
                  const url = info.file.response?.data?.url
                  if (url) { qc.invalidateQueries(['admin-item-detail', id]); message.success('Đã cập nhật ảnh') }
                }
              }}
            >
              <Button icon={<UploadOutlined />}>Tải ảnh lên</Button>
            </Upload>
          )}
          {isNew && <Typography.Text type="secondary" style={{ fontSize: 12 }}>Tạo khóa học trước, sau đó tải ảnh lên.</Typography.Text>}
        </SectionCard>

        <SectionCard title="Mô tả ngắn">
          <Form.Item name="shortContent" noStyle>
            <Input.TextArea rows={3} maxLength={400} showCount onChange={() => setDirty(true)} />
          </Form.Item>
        </SectionCard>

        <SectionCard title={
          <Space>
            Mô tả chi tiết
            <Popover title="Hướng dẫn viết bài" trigger="click"
              content={<pre style={{ fontSize: 12, maxWidth: 340, whiteSpace: 'pre-wrap', margin: 0 }}>{CONTENT_GUIDE}</pre>}>
              <QuestionCircleOutlined style={{ color: '#1677ff', cursor: 'pointer' }} />
            </Popover>
          </Space>
        }>
          <div style={{ background: '#fff' }}>
            <RichEditor value={richContent} onChange={v => { setRichContent(v); setDirty(true) }} />
          </div>
        </SectionCard>

        <SectionCard title="SEO">
          <FieldRow label="SEO Title"><Form.Item name="seoTitle" noStyle><Input onChange={() => setDirty(true)} /></Form.Item></FieldRow>
          <FieldRow label="URL slug"><Form.Item name="seoUrl" noStyle><Input addonBefore="/" onChange={() => setDirty(true)} /></Form.Item></FieldRow>
          <FieldRow label="SEO Description"><Form.Item name="seoDesc" noStyle><Input.TextArea rows={2} onChange={() => setDirty(true)} /></Form.Item></FieldRow>
        </SectionCard>
      </div>
    )},

    { key: 'schedule', label: 'Lịch học', children: (
      <div style={{ maxWidth: 640, paddingBottom: 32 }}>
        <SectionCard title="Hình thức & Địa điểm">
          <FieldRow label="Hình thức (subtype)">
            <Form.Item name="subtype" noStyle>
              <Select style={{ width: 160 }} allowClear placeholder="Chọn" onChange={() => setDirty(true)} options={SUBTYPES} />
            </Form.Item>
          </FieldRow>
          <FieldRow label="Địa điểm">
            <Form.Item name="locationType" noStyle>
              <Select style={{ width: 160 }} allowClear onChange={() => setDirty(true)} options={LOCATION_TYPES} />
            </Form.Item>
          </FieldRow>
          <FieldRow label="Địa chỉ / Link"><Form.Item name="location" noStyle><Input onChange={() => setDirty(true)} /></Form.Item></FieldRow>
        </SectionCard>

        <SectionCard title="Thời gian">
          <FieldRow label="Chiêu sinh liên tục">
            <Form.Item name="nolimitTime" noStyle valuePropName="checked">
              <Switch checkedChildren="Liên tục" unCheckedChildren="Có hạn" onChange={() => setDirty(true)} />
            </Form.Item>
          </FieldRow>
          <Form.Item noStyle shouldUpdate={(p, c) => p.nolimitTime !== c.nolimitTime}>
            {({ getFieldValue }) => !getFieldValue('nolimitTime') && <>
              <FieldRow label="Ngày bắt đầu"><Form.Item name="dateStart" noStyle><DatePicker format="DD/MM/YYYY" onChange={() => setDirty(true)} /></Form.Item></FieldRow>
              <FieldRow label="Ngày kết thúc"><Form.Item name="dateEnd" noStyle><DatePicker format="DD/MM/YYYY" onChange={() => setDirty(true)} /></Form.Item></FieldRow>
            </>}
          </Form.Item>
          <FieldRow label="Giờ học">
            <Space>
              <Form.Item name="timeStart" noStyle><Input placeholder="08:30" style={{ width: 90 }} onChange={() => setDirty(true)} /></Form.Item>
              <span>–</span>
              <Form.Item name="timeEnd" noStyle><Input placeholder="10:00" style={{ width: 90 }} onChange={() => setDirty(true)} /></Form.Item>
            </Space>
          </FieldRow>
          <FieldRow label="Chu kỳ">
            <Space>
              <Form.Item name="cycleAmount" noStyle><InputNumber min={1} style={{ width: 80 }} onChange={() => setDirty(true)} /></Form.Item>
              <Form.Item name="cycleType" noStyle><Select style={{ width: 100 }} allowClear onChange={() => setDirty(true)} options={CYCLE_TYPES} /></Form.Item>
            </Space>
          </FieldRow>
        </SectionCard>

        <SectionCard title="Yêu cầu & Điều kiện">
          <FieldRow label="Độ tuổi">
            <Space>
              <Form.Item name="agesMin" noStyle><InputNumber min={0} max={100} style={{ width: 80 }} placeholder="Min" onChange={() => setDirty(true)} /></Form.Item>
              <span>–</span>
              <Form.Item name="agesMax" noStyle><InputNumber min={0} max={100} style={{ width: 80 }} placeholder="Max" onChange={() => setDirty(true)} /></Form.Item>
              <Typography.Text type="secondary">tuổi</Typography.Text>
            </Space>
          </FieldRow>
          <FieldRow label="Số chỗ tối đa"><Form.Item name="seats" noStyle><InputNumber min={0} placeholder="Không giới hạn" onChange={() => setDirty(true)} /></Form.Item></FieldRow>
          {[
            ['allowReRegister', 'Cho đăng ký lại'],
            ['activiyTrial', 'Có học thử'],
            ['activiyTest', 'Có test đầu vào'],
            ['activiyVisit', 'Có tham quan'],
          ].map(([name, label]) => (
            <FieldRow key={name} label={label}>
              <Form.Item name={name} noStyle {...switchItemProps}>
                <Switch onChange={() => setDirty(true)} />
              </Form.Item>
            </FieldRow>
          ))}
        </SectionCard>
      </div>
    )},

    { key: 'finance', label: 'Tài chính', children: (
      <div style={{ maxWidth: 640, paddingBottom: 32 }}>
        <SectionCard title="Cài đặt thanh toán">
          <FieldRow label="Thu hộ học phí">
            <Space direction="vertical" size={2}>
              <Form.Item name="isPaymentfee" noStyle {...switchItemProps}>
                <Switch onChange={() => setDirty(true)} />
              </Form.Item>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>Bật nếu đây là khóa chỉ thu hộ học phí</Typography.Text>
            </Space>
          </FieldRow>
        </SectionCard>

        <SectionCard title="Hoa hồng đối tác">
          <FieldRow label="Tỉ lệ HH đối tác">
            <Space direction="vertical" size={2}>
              <Form.Item name="commissionRate" noStyle>
                <InputNumber min={0} max={1} step={0.01} style={{ width: 180 }} placeholder="Theo hợp đồng"
                  formatter={v => {
                    if (v == null || v === '') return ''
                    const n = Number(v)
                    return `${(n * 100).toFixed(0)}%`  // e.g. 0.2 → 20%, 1.0 → 100%
                  }}
                  parser={v => {
                    if (!v) return null
                    const cleaned = String(v).replace('%', '').trim()
                    const n = parseFloat(cleaned)
                    if (n > 1) return n / 100           // user typed "20" → 0.2
                    return n
                  }}
                  onChange={() => setDirty(true)}
                />
              </Form.Item>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Nhập % (VD: 20) · Để trống = dùng tỉ lệ trong hợp đồng<br />
                <strong>100%</strong> = thu hộ toàn bộ cho đối tác (công ty không giữ lại)<br />
                <strong>0%</strong> = công ty giữ toàn bộ, không phát anyPoint
              </Typography.Text>
            </Space>
          </FieldRow>
        </SectionCard>

        <SectionCard title="Cấu hình hoa hồng công ty">
          {CC_FIELDS.map(({ key, label }) => (
            <FieldRow key={key} label={label}>
              <Form.Item name={`cc_${key}`} noStyle>
                <InputNumber min={0} max={1} step={0.01} style={{ width: 140 }} placeholder="Mặc định"
                  formatter={v => v != null && v !== '' ? `${(Number(v) * 100).toFixed(0)}%` : ''}
                  parser={v => v ? parseFloat(v) / 100 : null}
                  onChange={() => setDirty(true)}
                />
              </Form.Item>
            </FieldRow>
          ))}
        </SectionCard>
      </div>
    )},

    { key: 'students', label: `Học sinh${item?.soldCount ? ` (${fmtVND(item.soldCount)})` : ''}`, children: (
      <div style={{ paddingBottom: 32 }}>
        <Table size="small" dataSource={students?.content ?? []} rowKey="userId"
          pagination={{ ...studentsPagination.paginationProps(students?.content), total: students?.total }}
          columns={[
            { title: 'Tên', dataIndex: 'name', render: (v, r) => r.isChild ? <Space size={2}>{v}<Tag color="blue" style={{ fontSize: 10 }}>con</Tag></Space> : v },
            { title: 'SĐT / Phụ huynh', dataIndex: 'phone', render: (v, r) => r.isChild && r.parentName ? `PH: ${r.parentName} · ${r.parentPhone}` : v },
            { title: 'Học phí TT', dataIndex: 'paidPrice', render: v => `${fmtVND(v)}đ` },
            { title: 'Trạng thái', dataIndex: 'status', render: v => {
              const label = STUDENT_STATUS_LABELS[v] ?? v
              const color = { active: 'green', completed: 'blue', cancelled: 'red', refunded: 'orange', pending: 'default' }[v] ?? 'default'
              return <Tag color={color}>{label}</Tag>
            }},
            { title: 'Ngày đăng ký', dataIndex: 'enrolledAt', render: v => fmtDateTime(v) },
          ]}
        />
      </div>
    )},

    { key: 'reviews', forceRender: true, label: `Đánh giá${reviews?.length ? ` (${reviews.length})` : ''}`, children: (
      <div style={{ paddingBottom: 32 }}>
        {/* reviewForm uses component={false} — no nested <form> HTML */}
        <Form form={reviewForm} component={false}>
          <Space style={{ marginBottom: 16 }}>
            <Form.Item name="rating" noStyle initialValue={5}><Rate allowHalf /></Form.Item>
            <Form.Item name="comment" noStyle rules={[{ required: true }]}>
              <Input placeholder="Nội dung đánh giá..." style={{ width: 320 }} />
            </Form.Item>
            <Button type="primary" icon={<StarOutlined />} loading={createReviewMutation.isPending}
              onClick={() => reviewForm.validateFields().then(createReviewMutation.mutate)}>
              Thêm
            </Button>
          </Space>
        </Form>
        <Table size="small" dataSource={reviews ?? []} rowKey="id" pagination={false}
          columns={[
            { title: 'Người dùng', dataIndex: 'userName', render: (v, r) => v || r.userId },
            { title: 'Đánh giá', dataIndex: 'rating', render: v => <Rate disabled defaultValue={v} allowHalf style={{ fontSize: 13 }} /> },
            { title: 'Nội dung', dataIndex: 'comment', ellipsis: true },
            { title: 'Ngày', dataIndex: 'createdAt', render: v => fmtDate(v), width: 100 },
            { width: 48, render: (_, r) => <Button size="small" danger icon={<DeleteOutlined />} onClick={() => deleteReviewMutation.mutate(r.id)} /> },
          ]}
        />
      </div>
    )},
  ]

  // ── Layout ────────────────────────────────────────────────────────────────

  return (
    // component={false}: outer Form manages state without rendering <form> HTML
    <Form form={form} component={false} onValuesChange={() => setDirty(true)}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#fff', borderBottom: '1px solid #f0f0f0', padding: '8px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1, minWidth: 0 }}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <Typography.Text strong style={{ fontSize: 15, wordBreak: 'break-word' }}>
                {isNew ? 'Tạo khóa học mới' : item?.title}
              </Typography.Text>
              <div style={{ marginTop: 2, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {!isNew && <Tag color={item?.status == 1 ? 'green' : 'default'}>{item?.status == 1 ? 'Hiển thị' : 'Ẩn'}</Tag>}
                {!isNew && <Tag color={item?.userStatus == 1 ? 'blue' : 'orange'}>{item?.userStatus == 1 ? 'Đã duyệt' : 'Chờ duyệt'}</Tag>}
              </div>
            </div>
          </div>
          <Space style={{ flexShrink: 0 }}>
            {dirty && !isNew && <Typography.Text type="warning" style={{ fontSize: 12 }}>Chưa lưu</Typography.Text>}
            {!isNew && <Button icon={<UndoOutlined />} onClick={handleReset} disabled={!dirty}>Đặt lại</Button>}
            <Button type="primary" icon={isNew ? <CheckOutlined /> : <SaveOutlined />} loading={saveMutation.isPending} disabled={!isNew && !dirty}
              onClick={() => form.validateFields().then(v => saveMutation.mutate(v))}>
              {isNew ? 'Tạo khóa học' : 'Lưu'}
            </Button>
          </Space>
        </div>
      </div>

      <div style={{ padding: '0 24px', background: '#f5f5f5', minHeight: 'calc(100vh - 100px)' }}>
        <Tabs items={tabItems} />
      </div>
    </Form>
  )
}
