import { Alert, Button, InputNumber, Modal, Progress, Space, Table, Tag, Typography, message } from 'antd'
import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import UserLocationsModal from './UserLocationsModal'

const OUTCOME = {
  waiting: ['Chờ', 'default'],
  running: ['Đang tìm…', 'processing'],
  added: ['Đã nhập', 'green'],
  review: ['Cần xem lại', 'orange'],
  manual: ['Đã xử lý tay', 'green'],
  not_found: ['Không tìm thấy', 'red'],
  skipped: ['Bỏ qua', 'default'],
  failed: ['Lỗi', 'red'],
}

// Gives partners with a signed or approved contract and no address their head office from the raw address on the
// contract. Runs one partner at a time so the person sees each result and can stop.
const ROLE_LABEL = { member: 'Thành viên', teacher: 'Giáo viên', school: 'Trường' }

// The member list filters in use when the button was pressed narrow the partners to import.
function filterSummary({ q, role, status, isSigned }) {
  return [
    q && `"${q}"`,
    role && `vai trò ${ROLE_LABEL[role] ?? role}`,
    status !== '' && status != null && (String(status) === '1' ? 'đang hoạt động' : 'đã khoá'),
    isSigned !== '' && isSigned != null && (String(isSigned) === '1' ? 'đã ký HĐ' : 'chưa ký HĐ'),
  ].filter(Boolean)
}

export default function ContractImportModal({ open, onClose, filters = {} }) {
  const [rows, setRows] = useState({}) // userId -> {outcome, location, suggestions}
  const [running, setRunning] = useState(false)
  const [limit, setLimit] = useState(null) // how many partners this run handles; empty = all
  const [editingUser, setEditingUser] = useState(null) // a partner opened with "Xử lý tay"
  const stop = useRef(false)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-contract-import', filters.q, filters.role, filters.status, filters.isSigned],
    queryFn: () => client.get('/admin/locations/contract-import', {
      params: { q: filters.q || undefined, role: filters.role || undefined,
        status: filters.status === '' ? undefined : filters.status, isSigned: filters.isSigned === '' ? undefined : filters.isSigned },
    }).then(r => r.data?.data ?? { enabled: false, candidates: [] }),
    enabled: open,
    refetchOnMount: 'always',
  })
  const candidates = data?.candidates ?? []
  const done = candidates.filter(c => rows[c.userId] && rows[c.userId].outcome !== 'running').length
  const remaining = candidates.length - done
  const thisRun = limit ? Math.min(limit, remaining) : remaining
  const added = candidates.filter(c => rows[c.userId]?.outcome === 'added').length

  const set = (userId, value) => setRows(current => ({ ...current, [userId]: value }))

  const start = async () => {
    stop.current = false
    setRunning(true)
    let handled = 0
    for (const c of candidates) {
      if (stop.current || (limit && handled >= limit)) break
      if (rows[c.userId] && rows[c.userId].outcome !== 'failed') continue
      handled += 1
      set(c.userId, { outcome: 'running' })
      try {
        const res = await client.post(`/admin/locations/contract-import/${c.userId}`).then(r => r.data)
        if (res.resultCode !== 1) {
          set(c.userId, { outcome: 'failed', error: res.message })
          continue
        }
        set(c.userId, res.data)
      } catch (e) {
        set(c.userId, { outcome: 'failed', error: e.message })
      }
    }
    setRunning(false)
    qc.invalidateQueries({ queryKey: ['admin-users'] })
  }

  // After a hand-made fix, show what the partner has now instead of the old "needs review" row.
  const afterManualFix = async (user) => {
    setEditingUser(null)
    const list = await client.get('/admin/locations', { params: { userId: user.id } }).then(r => r.data?.data ?? [])
    const location = list.find(l => l.head) ?? list[0]
    if (location) set(user.id, { outcome: 'manual', location })
    qc.invalidateQueries({ queryKey: ['admin-users'] })
  }

  const undo = async (userId, locationId) => {
    await client.delete(`/admin/locations/${locationId}`)
    set(userId, { outcome: 'waiting' })
    message.success('Đã hoàn tác')
    qc.invalidateQueries({ queryKey: ['admin-users'] })
  }

  const columns = [
    {
      title: 'Đối tác', key: 'who', width: 190,
      render: (_, c) => <div><b>{c.name}</b> <Tag>{c.role}</Tag><div style={{ fontSize: 12, color: '#888' }}>{c.phone}</div></div>,
    },
    { title: 'Địa chỉ trong hợp đồng', dataIndex: 'address', key: 'address', render: v => <span style={{ fontSize: 13 }}>{v}</span> },
    {
      title: 'Địa chỉ mới', key: 'new',
      render: (_, c) => {
        const row = rows[c.userId]
        if (row?.location) {
          const area = [row.location.wardName, row.location.districtName, row.location.provinceName].filter(Boolean).join(', ')
          return <div style={{ fontSize: 13 }}>{row.location.address}<div style={{ fontSize: 12, color: '#888' }}>{area || 'Chưa có khu vực'}</div></div>
        }
        if (row?.suggestions?.length) return <div style={{ fontSize: 12, color: '#888' }}>Gợi ý: {row.suggestions.join(' · ')}</div>
        if (row?.error) return <span style={{ color: '#cf1322', fontSize: 12 }}>{row.error}</span>
        return null
      },
    },
    {
      title: 'Kết quả', key: 'outcome', width: 150,
      render: (_, c) => {
        const row = rows[c.userId]
        const [label, color] = OUTCOME[row?.outcome ?? 'waiting'] ?? OUTCOME.waiting
        return (
          <Space direction="vertical" size={2}>
            <Tag color={color}>{label}</Tag>
            {row?.outcome === 'added' && <a onClick={() => undo(c.userId, row.location.id)}>Hoàn tác</a>}
            {row?.outcome === 'manual' && <a onClick={() => setEditingUser({ id: c.userId, name: c.name, role: c.role })}>Sửa</a>}
            {['review', 'not_found'].includes(row?.outcome) && <a onClick={() => setEditingUser({ id: c.userId, name: c.name, role: c.role })}>Xử lý tay</a>}
          </Space>
        )
      },
    },
  ]

  return (
    <Modal open={open} onCancel={running ? undefined : onClose} closable={!running} maskClosable={!running} footer={null} width={980} destroyOnClose
      title="Nhập địa chỉ từ hợp đồng">
      <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
        Các đối tác có hợp đồng đã ký hoặc đã duyệt nhưng chưa có địa chỉ. Hệ thống tìm địa chỉ trong hợp đồng trên Google; chỉ khi có đúng một kết quả khớp số nhà và tên đường thì mới lưu làm hội sở. Các trường hợp còn lại để bạn xử lý tay.
      </Typography.Paragraph>
      {filterSummary(filters).length > 0 && (
        <Alert type="info" showIcon style={{ marginBottom: 12 }}
          message={`Đang áp dụng bộ lọc của danh sách: ${filterSummary(filters).join(', ')}. Bỏ lọc ở trang Thành viên để nhập cho tất cả.`} />
      )}
      {data && !data.enabled && <Alert type="warning" showIcon style={{ marginBottom: 12 }} message="Chưa bật Google Maps (thiếu GOOGLE_MAPS_API_KEY), chưa thể nhập tự động." />}
      <Space style={{ marginBottom: 12 }} wrap>
        <InputNumber min={1} max={Math.max(remaining, 1)} precision={0} value={limit} onChange={setLimit} disabled={running}
          placeholder="Số lượng: để trống = tất cả" style={{ width: 200 }} />
        {!running
          ? <Button type="primary" disabled={!data?.enabled || candidates.length === 0 || done === candidates.length} onClick={start}>
              {done === candidates.length && done > 0 ? 'Đã xong' : `${done > 0 ? 'Tiếp tục' : 'Bắt đầu nhập'} (${thisRun} đối tác)`}
            </Button>
          : <Button danger onClick={() => { stop.current = true }}>Dừng</Button>}
        {candidates.length > 0 && (
          <Progress percent={Math.round((done / candidates.length) * 100)} size="small" style={{ width: 220 }} format={() => `${done}/${candidates.length}`} />
        )}
        {done > 0 && <Typography.Text>Đã nhập {added}, xử lý tay {candidates.filter(c => rows[c.userId]?.outcome === 'manual').length}, còn cần xem lại {candidates.filter(c => ['review', 'not_found', 'failed'].includes(rows[c.userId]?.outcome)).length}</Typography.Text>}
      </Space>
      <Table rowKey="userId" size="small" loading={isLoading} dataSource={candidates} columns={columns} pagination={{ pageSize: 20, hideOnSinglePage: true }}
        locale={{ emptyText: 'Không còn đối tác nào cần nhập.' }} />
      <UserLocationsModal open={!!editingUser} user={editingUser} onClose={() => afterManualFix(editingUser)} />
    </Modal>
  )
}
