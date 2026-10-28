import { Button, Card, Progress, Typography } from 'antd'
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { cancelVideoUpload, setUploadsFinishedHandler, useVideoUploads } from '../utils/videoUploads'

// Floating list of the videos being uploaded in the background; shown on every admin page.
export default function UploadTray() {
  const uploads = useVideoUploads()
  const qc = useQueryClient()
  useEffect(() => {
    setUploadsFinishedHandler(() => {
      qc.invalidateQueries({ queryKey: ['admin-explore-posts'] })
      qc.invalidateQueries({ queryKey: ['admin-video-course'] })
    })
    return () => setUploadsFinishedHandler(null)
  }, [qc])
  const active = uploads.length > 0
  useEffect(() => {
    if (!active) return
    const warn = e => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [active])
  if (!active) return null
  return (
    <Card size="small" title="Đang tải video lên" style={{ position: 'fixed', right: 16, bottom: 16, width: 300, zIndex: 1000, boxShadow: '0 6px 24px rgba(0,0,0,.18)' }}>
      {uploads.map(u => (
        <div key={u.id} style={{ marginBottom: 8 }}>
          <Typography.Text ellipsis style={{ display: 'block' }}>{u.title}</Typography.Text>
          <Progress percent={u.percent} size="small" />
          <Button type="link" size="small" danger style={{ padding: 0 }} onClick={() => cancelVideoUpload(u.id)}>Hủy tải</Button>
        </div>
      ))}
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>Bạn có thể làm việc ở trang khác, nhưng đừng đóng tab này.</Typography.Text>
    </Card>
  )
}
