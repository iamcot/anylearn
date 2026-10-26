import { Component } from 'react'
import { Button, Result } from 'antd'

const CHUNK_ERROR = /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Loading chunk/i
const RELOAD_KEY = 'admin.chunkReloadAt'
const RELOAD_COOLDOWN_MS = 30_000

// A crash in one page must not leave a white screen. After a deploy an open tab asks for script files that no
// longer exist: reload once to pick up the new build.
export default class ErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    if (!CHUNK_ERROR.test(String(error?.message ?? error))) return
    const last = Number(sessionStorage.getItem(RELOAD_KEY)) || 0
    if (Date.now() - last < RELOAD_COOLDOWN_MS) return
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
    window.location.reload()
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <Result
        status="warning"
        title="Trang gặp lỗi"
        subTitle="Bạn thử tải lại; nếu vẫn lỗi hãy đăng xuất rồi đăng nhập lại."
        extra={[
          <Button type="primary" key="reload" onClick={() => window.location.reload()}>Tải lại</Button>,
          <Button key="logout" onClick={() => { localStorage.removeItem('admin_token'); localStorage.removeItem('admin_user'); window.location.href = '/admin/login' }}>
            Đăng xuất
          </Button>,
        ]}
      />
    )
  }
}
