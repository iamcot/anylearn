import { Alert, Button, Drawer, Input, Popconfirm, Segmented, Space, Switch, Table, Tag, Typography, message } from 'antd'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'

const MIN_COURSES = 3
const INTRO_LABELS = { none: ['Mặc định', 'default'], draft: ['Bản nháp', 'orange'], approved: ['Đã duyệt', 'green'] }

// Landing pages "{môn} cho trẻ {tuổi} tuổi tại {quận}, TP.HCM" (plan 19.A7). The list is refreshed every night at 5:40;
// pages start switched off, an admin switches them on and approves the introduction.
export default function LandingPages() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState('')
  const [editing, setEditing] = useState(null)
  const [intro, setIntro] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-landing', filter],
    queryFn: () => client.get('/admin/landing-pages', { params: { filter: filter || undefined } }).then(r => r.data?.data ?? []),
  })

  const done = (res, text) => {
    if (res.resultCode !== 1) { message.error(res.message); return false }
    if (text) message.success(text)
    qc.invalidateQueries({ queryKey: ['admin-landing'] })
    return true
  }

  const refresh = useMutation({
    mutationFn: () => client.post('/admin/landing-pages/refresh').then(r => r.data),
    onSuccess: res => done(res, res.data ? `Đã kiểm tra: ${res.data.created} trang mới, ${res.data.available} trang đủ khóa` : null),
  })
  const enableReady = useMutation({
    mutationFn: () => client.post('/admin/landing-pages/enable-ready').then(r => r.data),
    onSuccess: res => done(res, `Đã bật ${res.data?.enabled ?? 0} trang`),
  })
  const toggle = useMutation({
    mutationFn: ({ id, enabled }) => client.put(`/admin/landing-pages/${id}/enabled`, { enabled }).then(r => r.data),
    onSuccess: res => done(res),
  })
  const saveIntro = useMutation({
    mutationFn: ({ id, status }) => client.put(`/admin/landing-pages/${id}/intro`, { intro, status }).then(r => r.data),
    onSuccess: res => { if (done(res, 'Đã lưu')) setEditing(null) },
  })
  const writeAi = useMutation({
    mutationFn: id => client.post(`/admin/landing-pages/${id}/intro/ai`).then(r => r.data),
    onSuccess: res => { if (done(res, 'AI đã viết bản nháp, đọc lại rồi duyệt')) { setEditing(res.data); setIntro(res.data?.intro ?? '') } },
  })

  const open = row => { setEditing(row); setIntro(row.intro ?? '') }

  const columns = [
    { title: 'Trang', dataIndex: 'title', render: (v, r) => <Space direction="vertical" size={0}><a href={r.url} target="_blank" rel="noreferrer">{v}</a><Typography.Text type="secondary" style={{ fontSize: 12 }}>/hoc/{r.path}</Typography.Text></Space> },
    { title: 'Khóa', dataIndex: 'courseCount', align: 'right', width: 80, render: v => (v < MIN_COURSES ? <Typography.Text type="danger">{v}</Typography.Text> : v) },
    { title: 'Lượt tìm môn (90 ngày)', dataIndex: 'demand', align: 'right', width: 120 },
    { title: 'Giới thiệu', dataIndex: 'introStatus', width: 120, render: v => { const [label, color] = INTRO_LABELS[v] ?? INTRO_LABELS.none; return <Tag color={color}>{label}</Tag> } },
    { title: 'Hiện', dataIndex: 'enabled', width: 80, render: (v, r) => <Switch checked={v} disabled={!v && r.courseCount < MIN_COURSES} loading={toggle.isPending && toggle.variables?.id === r.id} onChange={enabled => toggle.mutate({ id: r.id, enabled })} /> },
    { title: '', key: 'edit', width: 110, render: (_, r) => <Button size="small" onClick={() => open(r)}>Giới thiệu</Button> },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }} wrap>
        <Typography.Title level={4} style={{ margin: 0 }}>Trang đích</Typography.Title>
        <Space wrap>
          <Button loading={refresh.isPending} onClick={() => refresh.mutate()}>Kiểm tra lại ngay</Button>
          <Popconfirm title="Bật mọi trang đang tắt mà đủ 3 khóa?" onConfirm={() => enableReady.mutate()}>
            <Button type="primary" loading={enableReady.isPending}>Bật tất cả trang đủ khóa</Button>
          </Popconfirm>
        </Space>
      </Space>
      <Typography.Paragraph type="secondary">
        Mỗi trang là một tổ hợp môn (tag) × tuổi × quận ở TP.HCM có ít nhất {MIN_COURSES} khóa đang hiện, ví dụ "Bơi cho trẻ 5 tuổi tại Quận 7, TP.HCM".
        Hệ thống tự kiểm tra mỗi đêm (5:40): trang mới được thêm ở trạng thái tắt, trang không còn đủ khóa thì tự ẩn khỏi khách và Google.
        Trang đang bật nằm trong sitemap. Đoạn giới thiệu chỉ hiện khi "Đã duyệt"; chưa duyệt thì trang dùng đoạn mặc định có số khóa.
      </Typography.Paragraph>
      <Segmented style={{ marginBottom: 12 }} value={filter} onChange={setFilter} options={[
        { label: 'Tất cả', value: '' }, { label: 'Đang bật', value: 'on' }, { label: 'Đủ khóa, đang tắt', value: 'off' },
        { label: 'Giới thiệu nháp', value: 'draft' }, { label: 'Thiếu khóa', value: 'few' },
      ]} />
      <Table size="small" rowKey="id" loading={isLoading} dataSource={data ?? []} columns={columns} scroll={{ x: 800 }} pagination={{ pageSize: 50 }} />

      <Drawer title={editing?.title} open={!!editing} onClose={() => setEditing(null)} width={560} destroyOnHidden>
        {editing && (
          <Space direction="vertical" style={{ width: '100%' }}>
            {editing.introStatus === 'draft' && <Alert type="warning" showIcon message="Bản nháp chưa hiện cho khách. Đọc kỹ (số liệu, lời hứa) rồi bấm Duyệt." />}
            <Input.TextArea rows={10} maxLength={2000} showCount value={intro} onChange={e => setIntro(e.target.value)}
              placeholder="Để trống = dùng đoạn mặc định có số khóa" />
            <Space wrap>
              <Button type="primary" loading={saveIntro.isPending} onClick={() => saveIntro.mutate({ id: editing.id, status: 'approved' })} disabled={!intro.trim()}>Lưu và duyệt</Button>
              <Button loading={saveIntro.isPending} onClick={() => saveIntro.mutate({ id: editing.id, status: 'draft' })}>Lưu nháp</Button>
              <Button loading={writeAi.isPending} onClick={() => writeAi.mutate(editing.id)}>AI viết bản nháp</Button>
            </Space>
            <Typography.Text type="secondary">AI chỉ dùng số liệu của trang (số khóa, học phí, tên vài khóa). Bản AI luôn là nháp cho đến khi bạn duyệt.</Typography.Text>
          </Space>
        )}
      </Drawer>
    </div>
  )
}
