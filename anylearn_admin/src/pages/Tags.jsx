import { Button, Card, Input, Modal, Select, Space, Switch, Table, Typography, message } from 'antd'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import SlidePage from '../components/SlidePage'

const UNSORTED = 'other'

export default function Tags() {
  const [group, setGroup] = useState('')
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(null)
  const [merging, setMerging] = useState(null)
  const [mergeInto, setMergeInto] = useState(null)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-tags', group, q],
    queryFn: () => client.get('/admin/tags', { params: { group: group || undefined, q: q || undefined } }).then(r => r.data?.data ?? { tags: [], groups: {} }),
  })
  const groups = data?.groups ?? {}
  const groupOptions = Object.entries(groups).map(([value, label]) => ({ value, label }))

  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-tags'] })
  const done = (successText) => (res) => {
    if (res.resultCode !== 1) return message.error(res.message)
    message.success(successText)
    refresh()
  }

  const update = useMutation({
    mutationFn: ({ id, ...body }) => client.put(`/admin/tags/${id}`, body).then(r => r.data),
    onSuccess: done('Đã lưu'),
  })
  const create = useMutation({
    mutationFn: (body) => client.post('/admin/tags', body).then(r => r.data),
    onSuccess: (res) => { if (res.resultCode === 1) setAdding(null); done('Đã tạo tag')(res) },
  })
  const merge = useMutation({
    mutationFn: ({ id, intoId }) => client.post(`/admin/tags/${id}/merge`, { intoId }).then(r => r.data),
    onSuccess: (res) => { if (res.resultCode === 1) { setMerging(null); setMergeInto(null) } done('Đã gộp tag')(res) },
  })

  const columns = [
    {
      title: 'Tên tag', dataIndex: 'name', key: 'name',
      render: (name, r) => (
        <Typography.Text editable={{ onChange: v => v && v !== name && update.mutate({ id: r.id, name: v }) }}>{name}</Typography.Text>
      ),
    },
    {
      title: 'Nhóm', dataIndex: 'tagGroup', key: 'group', width: 190,
      render: (value, r) => (
        <Select size="small" value={value} style={{ width: 170 }} options={groupOptions}
          status={value === UNSORTED ? 'warning' : undefined}
          onChange={tagGroup => update.mutate({ id: r.id, group: tagGroup })} />
      ),
    },
    { title: 'Số khóa', dataIndex: 'itemCount', key: 'itemCount', width: 90, align: 'right' },
    {
      title: 'Hiện', dataIndex: 'status', key: 'status', width: 80,
      render: (value, r) => <Switch size="small" checked={value === 1} onChange={on => update.mutate({ id: r.id, status: on ? 1 : 0 })} />,
    },
    {
      title: '', key: 'action', width: 90,
      render: (_, r) => <Button size="small" onClick={() => { setMerging(r); setMergeInto(null) }}>Gộp vào…</Button>,
    },
  ]

  return (
    <SlidePage title="Tags">
    <Card title="Tags" extra={<Button type="primary" onClick={() => setAdding({ name: '', group: UNSORTED })}>+ Thêm tag</Button>}>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
        Danh mục tag dùng chung cho mọi khóa học. Nhóm &quot;Chưa phân loại&quot; là tag mới cần xếp nhóm. Hai tag trùng nghĩa thì dùng &quot;Gộp vào…&quot;: khóa học của tag bị gộp sẽ chuyển sang tag đích.
      </Typography.Paragraph>
      <Space style={{ marginBottom: 12 }} wrap>
        <Select allowClear placeholder="Mọi nhóm" style={{ width: 190 }} value={group || undefined} onChange={v => setGroup(v ?? '')} options={groupOptions} />
        <Input.Search allowClear placeholder="Tìm tag" style={{ width: 220 }} onSearch={setQ} />
      </Space>
      <Table rowKey="id" size="small" loading={isLoading} dataSource={data?.tags ?? []} columns={columns} pagination={{ pageSize: 50, hideOnSinglePage: true }} />

      <Modal open={!!adding} title="Thêm tag" okText="Tạo" cancelText="Hủy" confirmLoading={create.isPending}
        onCancel={() => setAdding(null)} onOk={() => create.mutate(adding)}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input autoFocus placeholder="Tên tag, VD: Bóng rổ" value={adding?.name} onChange={e => setAdding({ ...adding, name: e.target.value })} />
          <Select style={{ width: '100%' }} value={adding?.group} options={groupOptions} onChange={g => setAdding({ ...adding, group: g })} />
        </Space>
      </Modal>

      <Modal open={!!merging} title={`Gộp "${merging?.name}" vào tag khác`} okText="Gộp" cancelText="Hủy" okButtonProps={{ disabled: !mergeInto }}
        confirmLoading={merge.isPending} onCancel={() => setMerging(null)} onOk={() => merge.mutate({ id: merging.id, intoId: mergeInto })}>
        <Typography.Paragraph>Tag &quot;{merging?.name}&quot; sẽ bị xóa, các khóa học đang dùng nó chuyển sang tag bạn chọn.</Typography.Paragraph>
        <Select showSearch optionFilterProp="label" placeholder="Chọn tag đích" style={{ width: '100%' }} value={mergeInto} onChange={setMergeInto}
          options={(data?.tags ?? []).filter(t => t.id !== merging?.id).map(t => ({ value: t.id, label: t.name }))} />
      </Modal>
    </Card>
    </SlidePage>
  )
}
