'use client'

import { useEffect } from 'react'

export default function FloatContact() {
  useEffect(() => {
    const div = document.createElement('div')
    div.className = 'zalo-chat-widget'
    div.setAttribute('data-oaid', '3721021934871748468')
    div.setAttribute('data-welcome-message', 'Bạn đang muốn tìm kiếm khóa học nào thế ?')
    div.setAttribute('data-autopopup', '0')
    div.setAttribute('data-width', '350')
    div.setAttribute('data-height', '420')
    document.body.appendChild(div)
    return () => { document.body.removeChild(div) }
  }, [])

  return null
}
