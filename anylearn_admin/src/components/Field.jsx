import { Typography } from 'antd'

export function Field({ label, viewValue, editContent, editing = false }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '120px 1fr',
      gap: '4px 12px',
      alignItems: 'center',
      padding: '8px 0',
      borderBottom: '1px solid #f0f0f0',
    }}>
      <Typography.Text type="secondary" style={{ fontSize: 13 }}>{label}</Typography.Text>
      <div>{editing ? editContent : (viewValue ?? <Typography.Text type="secondary">—</Typography.Text>)}</div>
    </div>
  )
}
