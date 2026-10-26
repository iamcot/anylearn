import { Button, Typography } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// A page that slides in over the list it was opened from, with a back button (same motion as the course detail page).
export default function SlidePage({ title, subtitle, extra, children }) {
  const navigate = useNavigate()
  const [exiting, setExiting] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    let el = rootRef.current?.parentElement
    while (el && el !== document.body) {
      const { overflowY } = window.getComputedStyle(el)
      if (overflowY === 'auto' || overflowY === 'scroll') { el.scrollTop = 0; return }
      el = el.parentElement
    }
    window.scrollTo(0, 0)
  }, [])

  function goBack() {
    setExiting(true)
    setTimeout(() => navigate(-1), 220)
  }

  return (
    <div ref={rootRef} className={exiting ? 'page-slide-out' : 'page-slide-in'}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#fff', borderBottom: '1px solid #f0f0f0', padding: '8px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <Button icon={<ArrowLeftOutlined />} onClick={goBack}>Quay lại</Button>
            <div style={{ minWidth: 0 }}>
              <Typography.Text strong style={{ fontSize: 15 }}>{title}</Typography.Text>
              {subtitle && <div><Typography.Text type="secondary" style={{ fontSize: 12 }}>{subtitle}</Typography.Text></div>}
            </div>
          </div>
          {extra}
        </div>
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  )
}
