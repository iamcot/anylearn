import { Space, Tooltip } from 'antd'
import { EyeInvisibleOutlined, EyeOutlined, FileDoneOutlined } from '@ant-design/icons'

// Same codes as ItemVisibility.hiddenReasons (backend).
const HIDDEN_REASON_LABELS = {
  item_off: 'Platform đang ẩn khóa học',
  partner_pending: 'Khóa học chưa được đối tác duyệt',
  partner_inactive: 'Tài khoản đối tác chưa kích hoạt (Thành viên > trạng thái)',
  contract_unapproved: 'Hợp đồng đã ký nhưng chưa được duyệt (Thành viên > Ký HĐ)',
  contract_missing: 'Đối tác chưa ký hợp đồng (Thành viên > Ký HĐ)',
}

const GREEN = '#52c41a'
const RED = '#ff4d4f'
const ORANGE = '#fa8c16'
const GREY = '#bfbfbf'

// Status values: users.status 1 = active; users.is_signed 99 = approved contract, 10 = signed, waiting for approval.
export function PartnerStatus({ name, status, signed }) {
  const active = status == 1
  const contract = signed == 99
    ? { color: GREEN, text: 'Đã ký hợp đồng' }
    : signed == 10
      ? { color: ORANGE, text: 'Hợp đồng đã ký, chưa duyệt: khóa học chưa hiện ngoài trang' }
      : { color: GREY, text: 'Chưa ký hợp đồng: khóa học chưa hiện ngoài trang' }
  return (
    <Space size={6} style={{ maxWidth: '100%' }}>
      <Tooltip title={active ? 'Đối tác đang hoạt động' : 'Đối tác chưa kích hoạt: khóa học chưa hiện ngoài trang'}>
        <span
          aria-label={active ? 'Đối tác hoạt động' : 'Đối tác chưa kích hoạt'}
          style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', flex: 'none', background: active ? GREEN : RED }}
        />
      </Tooltip>
      <Tooltip title={contract.text}>
        <FileDoneOutlined aria-label={contract.text} style={{ color: contract.color }} />
      </Tooltip>
      <span>{name}</span>
    </Space>
  )
}

export function VisibilityIcon({ reasons }) {
  if (!reasons) return null
  if (reasons.length === 0) {
    return <Tooltip title="Đang hiện ngoài trang"><EyeOutlined style={{ color: GREEN }} /></Tooltip>
  }
  return (
    <Tooltip title={
      <div style={{ fontSize: 12, lineHeight: 1.6 }}>
        <b>Chưa hiện ngoài trang vì:</b>
        {reasons.map(r => <div key={r}>• {HIDDEN_REASON_LABELS[r] ?? r}</div>)}
      </div>
    }>
      <EyeInvisibleOutlined style={{ color: RED }} />
    </Tooltip>
  )
}
